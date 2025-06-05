/**
 * MANTRA Vanity Address Generator - Web Worker
 * 
 * This worker handles parallel vanity address generation using multiple CPU cores.
 * It uses the WASM module's batch processing functions for optimal performance.
 */

import init, {
    generate_vanity_keypair_batch,
    get_optimal_batch_size,
    VanityPosition
} from "./vanity_wasm.js";

let wasmInitialized = false;

/**
 * Initialize WASM module in worker context
 */
async function initWasm() {
    if (!wasmInitialized) {
        await init();
        wasmInitialized = true;
    }
}

/**
 * Handle messages from main thread
 */
self.onmessage = async function(e) {
    const { id, type, data } = e.data;
    
    try {
        // Initialize WASM if not already done
        await initWasm();
        
        switch (type) {
            case 'GENERATE_VANITY_BATCH':
                await handleVanityBatch(id, data);
                break;
            
            case 'PING':
                // Health check
                self.postMessage({
                    id,
                    type: 'PONG',
                    success: true
                });
                break;
                
            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error) {
        self.postMessage({
            id,
            type: 'ERROR',
            success: false,
            error: error.message
        });
    }
};

/**
 * Handle vanity address generation batch
 */
async function handleVanityBatch(id, { target, position, batchSize, workerId }) {
    // Map position string to WASM enum
    let vanityPosition;
    switch (position) {
        case 'prefix':
            vanityPosition = VanityPosition.Prefix;
            break;
        case 'suffix':
            vanityPosition = VanityPosition.Suffix;
            break;
        case 'anywhere':
        default:
            vanityPosition = VanityPosition.Anywhere;
            break;
    }
    
    // Use optimal batch size if not specified
    const actualBatchSize = batchSize || get_optimal_batch_size(target.length);
    
    // Generate batch and check for matches
    const result = generate_vanity_keypair_batch(target, vanityPosition, actualBatchSize);
    
    if (result) {
        // Found a match!
        self.postMessage({
            id,
            type: 'VANITY_FOUND',
            success: true,
            data: {
                keypair: {
                    address: result.address,
                    mnemonic: result.mnemonic
                },
                workerId,
                attempts: actualBatchSize
            }
        });
    } else {
        // No match in this batch
        self.postMessage({
            id,
            type: 'VANITY_BATCH_COMPLETE',
            success: true,
            data: {
                workerId,
                attempts: actualBatchSize
            }
        });
    }
}

/**
 * Handle worker errors
 */
self.onerror = function(error) {
    self.postMessage({
        type: 'WORKER_ERROR',
        success: false,
        error: error.message
    });
};

// Signal that worker is ready
self.postMessage({
    type: 'WORKER_READY',
    success: true
});
