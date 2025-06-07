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
  generate_vanity_keypair_batch,
  get_optimal_batch_size,
  derive_address_from_mnemonic,
  VanityPosition
} from "./vanity_wasm.js";

const VALID_CHARS = ['q', 'p', 'z', 'r', 'y', '9', 'x', '8', 'g', 'f', '2', 't', 'v', 'd', 'w', '0', 's', '3', 'j', 'n', '5', '4', 'k', 'h', 'c', 'e', '6', 'm', 'u', 'a', '7', 'l', '1'];
const COMMON_SUBSTITUTES = {'o': '0', 'i': '1', 'b': '8'};

/**
 * Parallel processing manager using Web Workers
 */
class ParallelProcessingManager {
  constructor() {
    this.workers = [];
    this.isInitialized = false;
    this.maxWorkers = Math.max(1, (navigator.hardwareConcurrency || 4) - 2); // Use CPU cores - 2
    this.messageId = 0;
    this.pendingMessages = new Map();
  }

  /**
   * Initialize workers
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // Test if workers are supported and can import ES modules
      const testWorker = new Worker('./worker.js', { type: 'module' });
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          testWorker.terminate();
          reject(new Error('Worker timeout'));
        }, 5000);

        testWorker.onmessage = (e) => {
          if (e.data.type === 'WORKER_READY') {
            clearTimeout(timeout);
            testWorker.terminate();
            resolve();
          }
        };

        testWorker.onerror = (error) => {
          clearTimeout(timeout);
          testWorker.terminate();
          reject(error);
        };
      });

      // Create worker pool
      for (let i = 0; i < this.maxWorkers; i++) {
        const worker = new Worker('./worker.js', { type: 'module' });
        worker.onmessage = (e) => this.handleWorkerMessage(e);
        worker.onerror = (error) => this.handleWorkerError(error, i);
        this.workers.push(worker);
      }

      this.isInitialized = true;
      console.log(`✅ Initialized ${this.maxWorkers} web workers for parallel processing`);
      
    } catch (error) {
      console.warn('⚠️ Web Workers not available, falling back to single-threaded mode:', error.message);
      this.workers = [];
      this.isInitialized = false;
    }
  }

  /**
   * Handle worker messages
   */
  handleWorkerMessage(e) {
    const { id, type, success, data, error } = e.data;
    
    if (this.pendingMessages.has(id)) {
      const { resolve, reject } = this.pendingMessages.get(id);
      this.pendingMessages.delete(id);
      
      if (success) {
        resolve({ type, data });
      } else {
        reject(new Error(error));
      }
    }
  }

  /**
   * Handle worker errors
   */
  handleWorkerError(error, workerId) {
    console.error(`Worker ${workerId} error:`, error);
  }

  /**
   * Send message to worker and get promise
   */
  sendToWorker(workerIndex, type, data) {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized || workerIndex >= this.workers.length) {
        reject(new Error('Workers not initialized or invalid worker index'));
        return;
      }

      const id = this.messageId++;
      this.pendingMessages.set(id, { resolve, reject });

      this.workers[workerIndex].postMessage({
        id,
        type,
        data: { ...data, workerId: workerIndex }
      });

      // Set timeout for worker response
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          reject(new Error('Worker timeout'));
        }
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Generate vanity address using parallel workers
   */
  async generateVanityParallel(target, position, onProgress) {
    if (!this.isInitialized || this.workers.length === 0) {
      throw new Error('Parallel processing not available');
    }

    const batchSize = get_optimal_batch_size(target.length);
    let totalAttempts = 0;
    let isRunning = true;

    const startTime = Date.now();

    // Function to stop all workers
    const stopGeneration = () => {
      isRunning = false;
    };

    try {
      while (isRunning) {
        // Start all workers on the same batch
        const workerPromises = this.workers.map((_, index) => 
          this.sendToWorker(index, 'GENERATE_VANITY_BATCH', {
            target,
            position,
            batchSize
          })
        );

        // Wait for any worker to find a result or all to complete
        const results = await Promise.allSettled(workerPromises);
        
        for (const result of results) {
          if (result.status === 'fulfilled') {
            const { type, data } = result.value;
            
            if (type === 'VANITY_FOUND') {
              stopGeneration();
              return {
                keypair: data.keypair,
                attempts: totalAttempts + data.attempts,
                duration: Date.now() - startTime
              };
            } else if (type === 'VANITY_BATCH_COMPLETE') {
              totalAttempts += data.attempts;
            }
          }
        }

        // Update progress
        if (onProgress) {
          const duration = Date.now() - startTime;
          const rate = duration > 0 ? (totalAttempts / duration * 1000) : 0;
          onProgress(totalAttempts, duration, rate);
        }

        // Small delay to prevent overwhelming the CPU
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      return null; // No result found before stopping
      
    } catch (error) {
      stopGeneration();
      throw error;
    }
  }

  /**
   * Check if parallel processing is available
   */
  isAvailable() {
    return this.isInitialized && this.workers.length > 0;
  }

  /**
   * Get worker count
   */
  getWorkerCount() {
    return this.workers.length;
  }

  /**
   * Terminate all workers
   */
  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.isInitialized = false;
    this.pendingMessages.clear();
  }
}

/**
 * Application state management
 */
class VanityGeneratorApp {
  constructor() {
    this.isRunning = false;
    this.startTime = null;
    this.attempts = 0;
    this.parallelManager = new ParallelProcessingManager();
    
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
      rateValue: document.getElementById('rateValue'),
      suggestionList: document.getElementById('suggestionList'),
      suggestionArea: document.getElementById('suggestionArea')
    };
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Initialize the WASM module
      await init();
      
      // Initialize parallel processing
      await this.parallelManager.init();
      
      if (this.parallelManager.isAvailable()) {
        const workerCount = this.parallelManager.getWorkerCount();
        const cpuCount = navigator.hardwareConcurrency || 'unknown';
        console.log(`✅ WASM module initialized with parallel processing (${workerCount} workers, ${cpuCount} CPU cores)`);
        
        // Show performance info to user
        this.showStatus(`Ready! Using ${workerCount} parallel workers on ${cpuCount} CPU cores for optimal performance.`, 'success');
      } else {
        console.log('✅ WASM module initialized (single-threaded mode)');
        this.showStatus('Ready! Note: Parallel processing not available - using single-threaded mode.', 'info');
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Update worker info display
      this.updateWorkerInfo();
      
      // Enable the form
      this.elements.generateButton.disabled = false;
      
      // Update worker information display
      this.updateWorkerInfo();
      
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
    const selectedPosition = document.querySelector('input[name="position"]:checked').value;
    const feedbackElement = document.getElementById('positionFeedback');
    
    const feedbackTexts = {
      anywhere: 'Pattern can appear anywhere in the address',
      prefix: 'Pattern will appear right after "mantra1"',
      suffix: 'Pattern will appear at the end of the address'
    };
    
    feedbackElement.textContent = feedbackTexts[selectedPosition];
  }

  /**
   * Validate user input
   */
  validateInput(target) {
    if (this.elements.suggestionArea) {
        this.elements.suggestionArea.innerHTML = ''; // Clear suggestions UI initially
    }

    const feedback = this.elements.inputFeedback;
    let message = '';
    let className = 'feedback'; // Default state
    let canGenerate = false;

    if (!target) {
        message = ''; // Deliberate clear for empty input
        className = 'feedback';
        canGenerate = false;
    } else if (!validate_target_string(target)) {
        className = 'feedback error';
        canGenerate = false;
        message = 'Invalid characters - use only: 0-9, a-z (except "b", "i", "o", "1")';
        if (target.length > 10) {
            message = `Target is too long. Also, it contains invalid characters. Use only: 0-9, a-z (except "b", "i", "o", "1")`;
        }

        const suggestions = this.generateSuggestions(target);
        if (suggestions.length > 0 && this.elements.suggestionArea && this.elements.suggestionList) {
            const preamble = document.createElement('p');
            preamble.textContent = 'Did you mean:';
            this.elements.suggestionArea.appendChild(preamble);

            this.elements.suggestionList.innerHTML = ''; // Clear old LIs
            suggestions.forEach(suggestionText => {
                const listItem = document.createElement('li');
                listItem.textContent = suggestionText;
                listItem.addEventListener('click', () => {
                    this.elements.targetInput.value = suggestionText;
                    this.validateInput(suggestionText); // Re-validate
                    this.elements.targetInput.focus();
                });
                this.elements.suggestionList.appendChild(listItem);
            });
            this.elements.suggestionArea.appendChild(this.elements.suggestionList);
        }
    } else if (target.length > 10) { // Valid characters, but too long
        message = `Target is too long (${target.length} chars). Max 10 recommended. Generation may take a very long time.`;
        className = 'feedback warning';
        canGenerate = true;
    } else if (target.length < 1) { // Should ideally not be reached if !target is handled first for empty strings
        message = 'Target must be at least 1 character';
        className = 'feedback error';
        canGenerate = false;
    } else { // Valid characters, good length (1-10)
        message = `Valid target pattern (difficulty: ~${Math.pow(32, target.length).toLocaleString()} attempts)`;
        className = 'feedback success';
        canGenerate = true;
    }

    if (feedback) {
        feedback.textContent = message;
        feedback.className = className;
        console.log('Feedback set:', { message, className, targetValue: target }); // Added targetValue for clarity
    }
    return canGenerate;
  }

  /**
   * Handle generate button click
   */
  async handleGenerate() {
    if (this.isRunning) {
      this.stopGeneration();
      return;
    }

    const target = this.elements.targetInput.value.trim().toLowerCase();
    const position = document.querySelector('input[name="position"]:checked').value;

    // Validate input
    if (!this.validateInput(target)) {
      return;
    }

    if (!target) {
      this.showStatus('Please enter a target pattern', 'error');
      return;
    }

    try {
      this.startGeneration();
      this.estimateDifficulty(target, position);
      await this.generationLoop(target, position);
    } catch (error) {
      console.error('Generation error:', error);
      this.showStatus(`Generation failed: ${error.message}`, 'error');
    } finally {
      this.stopGeneration();
    }
  }

  /**
   * Start the generation process
   */
  startGeneration() {
    this.isRunning = true;
    this.startTime = Date.now();
    this.attempts = 0;
    
    // Update UI
    this.elements.generateButton.textContent = '⏹️ Stop Generation';
    this.elements.generateButton.style.backgroundColor = '#e74c3c';
    this.elements.generateButton.classList.add('generating');
    this.elements.resultsDiv.style.display = 'none';
    
    // Hide stats section during generation
    const statsDiv = document.getElementById('stats');
    if (statsDiv) {
      statsDiv.style.display = 'none';
    }
    
    this.showStatus('🚀 Starting vanity address generation...', 'info', true);
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
    // Use parallel generation if available, otherwise fall back to single-threaded
    const useParallel = this.parallelManager.isAvailable();
    
    if (useParallel) {
      console.log(`🚀 Using parallel generation with ${this.parallelManager.getWorkerCount()} workers`);
      await this.parallelGenerationLoop(target, position);
    } else {
      console.log('⚡ Using single-threaded generation');
      await this.singleThreadedGenerationLoop(target, position);
    }
  }

  /**
   * Parallel generation using Web Workers
   */
  async parallelGenerationLoop(target, position) {
    try {
      const result = await this.parallelManager.generateVanityParallel(
        target, 
        position, 
        (attempts, duration, rate) => {
          this.attempts = attempts;
          this.updateProgress();
        }
      );

      if (result && this.isRunning) {
        this.attempts = result.attempts;
        this.showSuccess(result.keypair);
      }
    } catch (error) {
      console.error('Parallel generation failed:', error);
      // Fall back to single-threaded mode
      console.log('Falling back to single-threaded generation...');
      await this.singleThreadedGenerationLoop(target, position);
    }
  }

  /**
   * Single-threaded generation loop
   */
  async singleThreadedGenerationLoop(target, position) {
    const batchSize = get_optimal_batch_size(target.length);
    
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
        // Use the new batch function for better performance
        const result = generate_vanity_keypair_batch(target, vanityPosition, batchSize);
        
        this.attempts += batchSize;
        
        if (result) {
          // Found a match!
          this.showSuccess(result);
          return;
        }
        
        // Update progress
        this.updateProgress();
        
        // Yield control to browser
        await this.sleep(5);
        
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
          this.showSuccess(keypair);
          return;
        }
      }
      
      // Update progress
      this.updateProgress();
      
      // Yield control to browser
      await this.sleep(10);
    }
  }

  /**
   * Update progress display with enhanced animations
   */
  updateProgress() {
    const duration = Date.now() - this.startTime;
    const rate = duration > 0 ? (this.attempts / duration * 1000) : 0;
    
    // Create animated progress message with time estimation
    const searchEmoji = this.getRotatingSearchEmoji();
    const dotsAnimation = this.getAnimatedDots();
    const { progressInfo, progressPercent } = this.getProgressInfo(rate);
    
    // Format detailed attempt information
    const formattedDuration = this.formatDuration(duration);
    const formattedRate = Math.round(rate).toLocaleString();
    const attemptInfo = `${this.attempts.toLocaleString()} attempts in ${formattedDuration} (${formattedRate}/sec)`;
    
    this.showStatus(
      `<span class="search-animation">${searchEmoji}</span><span class="progress-text">Searching for vanity address${dotsAnimation}</span><br>
       <div style="margin: 0.5rem 0; font-size: 0.9em; font-weight: 500;">${attemptInfo}</div>
       <small style="opacity: 0.8; font-size: 0.8em;">${progressInfo}</small>`,
      'info',
      true,
      progressPercent
    );
  }

  /**
   * Get progress information with time estimation
   */
  getProgressInfo(rate) {
    const target = this.elements.targetInput.value.trim().toLowerCase();
    const position = document.querySelector('input[name="position"]:checked').value;
    
    if (!target || rate === 0) {
      return {
        progressInfo: `Attempts: ${this.attempts.toLocaleString()} • Rate: ${Math.round(rate).toLocaleString()}/sec`,
        progressPercent: null
      };
    }
    
    // Estimate expected attempts based on target length and position
    const bech32Chars = 32;
    let expectedAttempts = Math.pow(bech32Chars, target.length);
    
    if (position === 'prefix' || position === 'suffix') {
      expectedAttempts *= 2; // Position constraints make it harder
    }
    
    // Calculate progress percentage and ETA
    const progressPercent = Math.min((this.attempts / expectedAttempts) * 100, 99);
    const remainingAttempts = Math.max(0, expectedAttempts - this.attempts);
    const etaSeconds = rate > 0 ? remainingAttempts / rate : 0;
    
    let progressText = `Progress: ${progressPercent.toFixed(1)}%`;
    
    if (etaSeconds > 0 && etaSeconds < 3600) { // Only show ETA if less than 1 hour
      const etaFormatted = this.formatDuration(etaSeconds * 1000);
      progressText += ` • ETA: ~${etaFormatted}`;
    }
    
    return {
      progressInfo: progressText,
      progressPercent: progressPercent > 1 ? progressPercent : null // Only show progress bar if meaningful
    };
  }

  /**
   * Get rotating search emoji for animation
   */
  getRotatingSearchEmoji() {
    const searchEmojis = ['🔍', '🔎', '⚡', '💎', '🎯', '✨'];
    const index = Math.floor(Date.now() / 500) % searchEmojis.length;
    return searchEmojis[index];
  }

  /**
   * Get animated dots
   */
  getAnimatedDots() {
    const dotCount = Math.floor(Date.now() / 500) % 4;
    return '<span class="progress-dots">' + '.'.repeat(dotCount) + '</span>';
  }

  /**
   * Show generation success
   */
  showSuccess(keypair) {
    this.elements.addressValue.textContent = keypair.address;
    this.elements.mnemonicValue.textContent = keypair.mnemonic;
    this.elements.resultsDiv.style.display = 'block';
    
    // Stop animations
    this.elements.generateButton.classList.remove('generating');
    
    const duration = Date.now() - this.startTime;
    const rate = duration > 0 ? (this.attempts / duration * 1000) : 0;
    
    // Show stats section with final results
    const statsDiv = document.getElementById('stats');
    if (statsDiv) {
      statsDiv.style.display = 'grid';
      statsDiv.style.marginTop = '1rem';
      statsDiv.classList.remove('active'); // Remove the pulsing animation
      
      // Update stats with final values
      this.elements.attemptsValue.textContent = this.attempts.toLocaleString();
      this.elements.durationValue.textContent = this.formatDuration(duration);
      this.elements.rateValue.textContent = `${Math.round(rate).toLocaleString()}/sec`;
    }
    
    // Show success status
    this.showStatus(
      `🎉 <span class="progress-text">Success!</span> Found matching address in ${this.formatDuration(duration)} after ${this.attempts.toLocaleString()} attempts (${Math.round(rate).toLocaleString()}/sec)`,
      'success'
    );
    
    // Scroll to results
    this.elements.resultsDiv.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Show status message with optional progress bar and animations
   */
  showStatus(message, type = 'info', showProgress = false, progressPercent = null) {
    // Support HTML content by using innerHTML
    this.elements.statusDiv.innerHTML = message;
    this.elements.statusDiv.className = `status ${type}`;
    this.elements.statusDiv.style.display = 'block';
    
    // Add/remove progress bar with enhanced animation
    let progressBar = this.elements.statusDiv.querySelector('.progress-bar');
    if (showProgress && !progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      progressBar.innerHTML = '<div class="progress-fill"></div>';
      this.elements.statusDiv.appendChild(progressBar);
      
      // Add pulse animation to the entire status div
      this.elements.statusDiv.classList.add('progress-pulse');
    } else if (!showProgress && progressBar) {
      progressBar.remove();
      this.elements.statusDiv.classList.remove('progress-pulse');
      return;
    }
    
    // Update progress bar if percentage is provided
    if (progressBar && progressPercent !== null) {
      const progressFill = progressBar.querySelector('.progress-fill');
      if (progressFill) {
        progressFill.style.width = `${Math.min(progressPercent, 95)}%`;
        progressFill.classList.add('estimated');
      }
    } else if (progressBar) {
      const progressFill = progressBar.querySelector('.progress-fill');
      if (progressFill) {
        progressFill.style.width = '';
        progressFill.classList.remove('estimated');
      }
    }
  }

  /**
   * Hide status message
   */
  hideStatus() {
    this.elements.statusDiv.style.display = 'none';
  }

  /**
   * Stop the generation process
   */
  stopGeneration() {
    this.isRunning = false;
    
    // Note: We don't terminate workers here since they can be reused
    // Workers will naturally stop when they complete their current batch
    
    // Reset UI
    this.elements.generateButton.textContent = '🎲 Generate Vanity Address';
    this.elements.generateButton.style.backgroundColor = 'var(--primary-color)';
    this.elements.generateButton.classList.remove('generating');
    
    // Remove active stats animation
    const statsDiv = document.getElementById('stats');
    if (statsDiv) {
      statsDiv.classList.remove('active');
    }
    
    // Hide stats if no attempts were made
    if (this.attempts === 0) {
      this.hideStatus();
      if (statsDiv) {
        statsDiv.style.display = 'none';
      }
    } else {
      // Show stopped message if generation was in progress
      this.showStatus('⏹️ Generation stopped by user', 'info');
      // Keep stats visible to show progress made
    }
  }

  /**
   * Cleanup resources (called on page unload)
   */
  cleanup() {
    this.stopGeneration();
    this.parallelManager.terminate();
  }

  /**
   * Utility: Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Utility: Format duration in human-readable format
   */
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Update worker information display
   */
  updateWorkerInfo() {
    const workerCountElement = document.getElementById('workerCount');
    if (workerCountElement) {
      if (this.parallelManager.isAvailable()) {
        const workerCount = this.parallelManager.getWorkerCount();
        workerCountElement.textContent = workerCount;
      } else {
        workerCountElement.textContent = '1';
      }
    }
  }

  /**
   * Generate suggestions for invalid user input
   */
  generateSuggestions(userInput, maxSuggestions = 5) {
    const suggestions = new Set();
    const lowerUserInput = userInput.toLowerCase();

    const addSuggestion = (patternStr) => {
      if (suggestions.size < maxSuggestions && validate_target_string(patternStr)) {
        suggestions.add(patternStr);
      }
    };

    // Suggestion 1: Comprehensive Replacement
    let comprehensiveChars = Array.from(lowerUserInput).map(char => {
      if (validate_target_string(char)) {
        return char;
      }
      return COMMON_SUBSTITUTES[char] || VALID_CHARS[0];
    });
    addSuggestion(comprehensiveChars.join(''));

    // Find invalid character indices
    const invalidCharIndices = [];
    for (let i = 0; i < lowerUserInput.length; i++) {
      if (!validate_target_string(lowerUserInput[i])) {
        invalidCharIndices.push(i);
      }
    }

    // Suggestion 2-N: Focused First Invalid Character Replacement
    if (invalidCharIndices.length > 0) {
      const firstInvalidIndex = invalidCharIndices[0];
      const originalInvalidChar = lowerUserInput[firstInvalidIndex];
      let tempChars = Array.from(lowerUserInput);

      if (COMMON_SUBSTITUTES[originalInvalidChar]) {
        tempChars[firstInvalidIndex] = COMMON_SUBSTITUTES[originalInvalidChar];
        addSuggestion(tempChars.join(''));
      }

      for (const validChar of VALID_CHARS) {
        if (suggestions.size >= maxSuggestions) break;
        if (COMMON_SUBSTITUTES[originalInvalidChar] === validChar) continue; // Avoid duplicate
        tempChars[firstInvalidIndex] = validChar;
        addSuggestion(tempChars.join(''));
        if (suggestions.size >= maxSuggestions) break;
      }
    }

    // Suggestion 3-M: Focused Second Invalid Character Replacement
    if (invalidCharIndices.length > 1 && suggestions.size < maxSuggestions) {
      const secondInvalidIndex = invalidCharIndices[1];
      const originalSecondInvalidChar = lowerUserInput[secondInvalidIndex];

      // Base for second fix: Use comprehensive replacement up to second invalid char
      let baseForSecondFixChars = Array.from(lowerUserInput).map((char, index) => {
        if (index < secondInvalidIndex && !validate_target_string(char)) {
          return COMMON_SUBSTITUTES[char] || VALID_CHARS[0];
        }
        return char;
      });

      if (COMMON_SUBSTITUTES[originalSecondInvalidChar]) {
        baseForSecondFixChars[secondInvalidIndex] = COMMON_SUBSTITUTES[originalSecondInvalidChar];
        addSuggestion(baseForSecondFixChars.join(''));
      }

      for (const validChar of VALID_CHARS) {
        if (suggestions.size >= maxSuggestions) break;
        if (COMMON_SUBSTITUTES[originalSecondInvalidChar] === validChar) continue; // Avoid duplicate

        let tempSecondFixChars = [...baseForSecondFixChars]; // Create a new copy
        tempSecondFixChars[secondInvalidIndex] = validChar;
        // Ensure remaining characters are also valid or substituted
        for(let i = secondInvalidIndex + 1; i < tempSecondFixChars.length; i++) {
            if(!validate_target_string(tempSecondFixChars[i])) {
                tempSecondFixChars[i] = COMMON_SUBSTITUTES[tempSecondFixChars[i]] || VALID_CHARS[0];
            }
        }
        addSuggestion(tempSecondFixChars.join(''));
        if (suggestions.size >= maxSuggestions) break;
      }
    }

    return Array.from(suggestions);
  }
}

/**
 * Main application entry point
 */
async function main() {
  console.log('🚀 Starting MANTRA Vanity Generator...');
  
  const app = new VanityGeneratorApp();
  await app.init();
  
  // Make app globally accessible for debugging
  window.vanityApp = app;
  
  // Setup cleanup on page unload
  window.addEventListener('beforeunload', () => {
    app.cleanup();
  });
  
  // Setup cleanup on page visibility change (mobile/tab switching)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && app.isRunning) {
      console.log('Page hidden, stopping generation to save resources');
      app.stopGeneration();
    }
  });
  
  console.log('✅ Application ready!');
}

// Start the application
main().catch(error => {
  console.error('❌ Failed to start application:', error);
  alert('Failed to start the application. Please refresh the page.');
});
