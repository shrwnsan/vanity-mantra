/**
 * MANTRA Vanity Address Generator - Frontend Application
 * 
 * This module implements a modern, user-friendly interface for generating
 * vanity MANTRA blockchain addresses. It follows modern JavaScript best practices:
 * 
 * - Separation of Concerns: UI, validation, and generation logic are separated
 * - Error Handling: Comprehensive error handling with user feedback
 * - Performance: Non-blocking UI with progress updates
 * - Accessibility: Semantic HTML and keyboard navigation support
 * - Security: Input validation and secure random generation
 */

import init, { 
  generate_random_keypair, 
  validate_target_string,
  generate_vanity_keypair,
  generate_vanity_keypair_with_position,
  derive_address_from_mnemonic,
  VanityPosition
} from "./vanity_wasm.js";

/**
 * Application state management
 */
class VanityGeneratorApp {
  constructor() {
    this.isRunning = false;
    this.startTime = null;
    this.attempts = 0;
    this.worker = null;
    
    // DOM element references
    this.elements = {
      form: document.getElementById('vanityForm'),
      targetInput: document.getElementById('targetInput'),
      positionInputs: document.querySelectorAll('input[name="position"]'),
      generateButton: document.getElementById('generateButton'),
      statusDiv: document.getElementById('status'),
      resultsDiv: document.getElementById('results'),
      addressValue: document.getElementById('addressValue'),
      mnemonicValue: document.getElementById('mnemonicValue'),
      attemptsValue: document.getElementById('attemptsValue'),
      durationValue: document.getElementById('durationValue'),
      rateValue: document.getElementById('rateValue')
    };
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Initialize the WASM module
      await init();
      console.log('✅ WASM module initialized successfully');
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Enable the form
      this.elements.generateButton.disabled = false;
      
    } catch (error) {
      console.error('❌ Failed to initialize WASM module:', error);
      this.showStatus('Failed to initialize. Please refresh the page.', 'error');
    }
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Form submission
    this.elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleGenerate();
    });

    // Real-time input validation
    this.elements.targetInput.addEventListener('input', (e) => {
      this.validateInput(e.target.value);
    });

    // Position change handler
    this.elements.positionInputs.forEach(input => {
      input.addEventListener('change', () => {
        this.updatePositionFeedback();
      });
    });

    // Stop generation on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isRunning) {
        this.stopGeneration();
      }
    });
  }

  /**
   * Update feedback based on selected position
   */
  updatePositionFeedback() {
    const target = this.elements.targetInput.value.trim().toLowerCase();
    const selectedPosition = document.querySelector('input[name="position"]:checked').value;
    
    if (target && target.length > 0) {
      const bech32Chars = 32;
      let expectedAttempts = Math.pow(bech32Chars, target.length);
      
      // Adjust difficulty based on position
      if (selectedPosition === 'prefix' || selectedPosition === 'suffix') {
        expectedAttempts *= 2;
      }
      
      if (expectedAttempts > 10000) {
        const minutes = Math.ceil(expectedAttempts / 1000 / 60);
        const positionText = selectedPosition === 'prefix' ? 'prefix' : selectedPosition === 'suffix' ? 'suffix' : 'anywhere';
        this.showStatus(`⏱️ Estimated time for "${target}" (${positionText}): ~${minutes} minutes`, 'info');
      } else {
        this.hideStatus();
      }
    }
  }

  /**
   * Validate user input in real-time
   */
  validateInput(value) {
    const trimmed = value.trim().toLowerCase();
    
    if (!trimmed) {
      this.elements.targetInput.style.borderColor = '';
      this.hideStatus();
      return true;
    }

    const isValid = validate_target_string(trimmed);
    this.elements.targetInput.style.borderColor = isValid ? 'var(--success-color)' : 'var(--error-color)';
    
    // Update position feedback
    if (isValid) {
      this.updatePositionFeedback();
    } else {
      this.showStatus('Invalid characters. Use only: qpzry9x8gf2tvdw0s3jn54khce6mua7l and "1"', 'error');
    }
    
    return isValid;
  }

  /**
   * Handle the generation process
   */
  async handleGenerate() {
    if (this.isRunning) {
      this.stopGeneration();
      return;
    }

    const target = this.elements.targetInput.value.trim().toLowerCase();
    const selectedPosition = document.querySelector('input[name="position"]:checked').value;
    
    // Validation
    if (!target) {
      this.showStatus('Please enter a target pattern.', 'error');
      this.elements.targetInput.focus();
      return;
    }

    if (!validate_target_string(target)) {
      this.showStatus('Invalid characters in target pattern. Use only: qpzry9x8gf2tvdw0s3jn54khce6mua7l and "1"', 'error');
      this.elements.targetInput.focus();
      return;
    }

    // Start generation with position
    await this.startGeneration(target, selectedPosition);
  }

  /**
   * Start the vanity address generation process
   */
  async startGeneration(target, position = 'anywhere') {
    this.isRunning = true;
    this.startTime = Date.now();
    this.attempts = 0;
    
    // Update UI
    this.elements.generateButton.textContent = '⏹️ Stop Generation';
    this.elements.generateButton.style.backgroundColor = 'var(--error-color)';
    this.elements.resultsDiv.classList.remove('show');
    this.showStatus('🔍 Searching for vanity address...', 'info', true);

    try {
      // Estimate difficulty and warn user if needed
      this.estimateDifficulty(target, position);
      
      // Start the generation loop with position
      await this.generationLoop(target, position);
      
    } catch (error) {
      console.error('Generation error:', error);
      this.showStatus(`Generation failed: ${error.message}`, 'error');
    } finally {
      this.stopGeneration();
    }
  }

  /**
   * Estimate generation difficulty and warn user
   */
  estimateDifficulty(target, position) {
    const bech32Chars = 32; // bech32 alphabet size
    let expectedAttempts = Math.pow(bech32Chars, target.length);
    
    // Adjust difficulty based on position
    if (position === 'prefix' || position === 'suffix') {
      // More difficult than anywhere - position constrains where pattern can appear
      expectedAttempts *= 2;
    }
    
    if (expectedAttempts > 100000) {
      const minutes = Math.ceil(expectedAttempts / 1000 / 60); // Rough estimate at 1000/sec
      const positionText = position === 'prefix' ? 'prefix' : position === 'suffix' ? 'suffix' : 'anywhere';
      console.warn(`⚠️ Target "${target}" (${positionText}) may take approximately ${minutes} minutes to find`);
    }
  }

  /**
   * Main generation loop with progress updates
   */
  async generationLoop(target, position) {
    const batchSize = 1000; // Try 1000 attempts per batch in WASM
    
    // Map string position to WASM enum
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
    
    while (this.isRunning) {
      try {
        // Use the new position-aware WASM function
        const result = generate_vanity_keypair_with_position(target, vanityPosition, batchSize);
        
        this.attempts += batchSize;
        
        if (result) {
          // Found a match!
          this.showSuccess(result);
          return;
        }
        
        // Update progress
        this.updateProgress();
        
        // Yield control to browser every batch
        await this.sleep(10);
        
      } catch (error) {
        console.error('Generation batch failed:', error);
        // Fall back to individual generation
        await this.fallbackGenerationLoop(target, position);
        return;
      }
    }
  }

  /**
   * Fallback generation loop (individual keypairs)
   */
  async fallbackGenerationLoop(target, position) {
    const updateInterval = 100; // Update UI every 100 attempts
    
    while (this.isRunning) {
      // Generate batch of keypairs
      for (let i = 0; i < updateInterval && this.isRunning; i++) {
        this.attempts++;
        
        const keypair = generate_random_keypair();
        
        // Check match based on position
        let isMatch = false;
        const address = keypair.address.toLowerCase();
        
        switch (position) {
          case 'prefix':
            // Check if pattern appears right after "mantra1"
            isMatch = address.startsWith('mantra1' + target);
            break;
          case 'suffix':
            // Check if pattern appears at the end
            isMatch = address.endsWith(target);
            break;
          case 'anywhere':
          default:
            // Check if pattern appears anywhere
            isMatch = address.includes(target);
            break;
        }
        
        if (isMatch) {
          // Found a match!
          this.showSuccess(keypair);
          return;
        }
      }
      
      // Update progress
      this.updateProgress();
      
      // Yield control to browser
      await this.sleep(0);
    }
  }

  /**
   * Update progress display
   */
  updateProgress() {
    const duration = (Date.now() - this.startTime) / 1000;
    const rate = Math.round(this.attempts / duration);
    
    this.showStatus(
      `🔍 Searching... ${this.attempts.toLocaleString()} attempts in ${duration.toFixed(1)}s (${rate}/sec)`,
      'info',
      true
    );
  }

  /**
   * Show successful result
   */
  showSuccess(keypair) {
    const duration = (Date.now() - this.startTime) / 1000;
    const rate = Math.round(this.attempts / duration);
    
    // Update stats
    this.elements.attemptsValue.textContent = this.attempts.toLocaleString();
    this.elements.durationValue.textContent = `${duration.toFixed(1)}s`;
    this.elements.rateValue.textContent = rate.toLocaleString();
    
    // Update results
    this.elements.addressValue.textContent = keypair.address;
    this.elements.mnemonicValue.textContent = keypair.mnemonic;
    
    // Show results
    this.elements.resultsDiv.classList.add('show');
    
    // Show success status
    this.showStatus(
      `🎉 Found vanity address after ${this.attempts.toLocaleString()} attempts!`,
      'success'
    );
    
    // Scroll to results
    this.elements.resultsDiv.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Stop the generation process
   */
  stopGeneration() {
    this.isRunning = false;
    
    // Reset UI
    this.elements.generateButton.textContent = '🎲 Generate Vanity Address';
    this.elements.generateButton.style.backgroundColor = 'var(--primary-color)';
    
    if (this.attempts === 0) {
      this.hideStatus();
    }
  }

  /**
   * Show status message with optional progress bar
   */
  showStatus(message, type = 'info', showProgress = false) {
    this.elements.statusDiv.textContent = message;
    this.elements.statusDiv.className = `status ${type}`;
    this.elements.statusDiv.style.display = 'block';
    
    // Add/remove progress bar
    let progressBar = this.elements.statusDiv.querySelector('.progress-bar');
    if (showProgress && !progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      progressBar.innerHTML = '<div class="progress-fill"></div>';
      this.elements.statusDiv.appendChild(progressBar);
    } else if (!showProgress && progressBar) {
      progressBar.remove();
    }
  }

  /**
   * Hide status message
   */
  hideStatus() {
    this.elements.statusDiv.style.display = 'none';
  }

  /**
   * Utility function for non-blocking delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Initialize and start the application
 */
async function main() {
  console.log('🚀 Starting MANTRA Vanity Generator...');
  
  const app = new VanityGeneratorApp();
  await app.init();
  
  console.log('✅ Application ready!');
}

// Start the application
main().catch(error => {
  console.error('❌ Failed to start application:', error);
  alert('Failed to start the application. Please refresh the page.');
});
