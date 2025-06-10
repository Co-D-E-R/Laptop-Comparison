#!/usr/bin/env node

/**
 * Automated Laptop Data Scraping and Database Update System
 * 
 * This script coordinates the entire data pipeline:
 * 1. Scrapes Amazon data using AmazonFinal.js
 * 2. Scrapes Flipkart data using Flip.js
 * 3. Matches and merges data using matchFin.js
 * 4. Updates the server database
 * 
 * Designed to run via cron job every 3 days
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const CONFIG = {
    BASE_DIR: path.join(__dirname, '..'),
    SCRAPING_DIR: path.join(__dirname, '..', 'Scrapping'),
    SERVER_DIR: path.join(__dirname, '..', 'server'),
    DATA_DIR: path.join(__dirname, '..', 'server', 'Data'),
    LOG_DIR: path.join(__dirname, 'logs'),
    SERVER_URL: process.env.SERVER_URL || 'http://localhost:8080',

    // File paths
    AMAZON_SCRIPT: path.join(__dirname, '..', 'Scrapping', 'AmazonFinal.js'),
    FLIPKART_SCRIPT: path.join(__dirname, '..', 'Scrapping', 'Flip.js'),
    MATCH_SCRIPT: path.join(__dirname, '..', 'Scrapping', 'matchFin.js'),

    // Data files
    AMAZON_DATA: path.join(__dirname, '..', 'Scrapping', 'amazon_complete_data.json'),
    FLIPKART_DATA: path.join(__dirname, '..', 'Scrapping', 'flipkart_complete_data.json'),
    MATCHED_DATA: path.join(__dirname, '..', 'Scrapping', 'matched_laptops.json'),
    FINAL_DATA: path.join(__dirname, '..', 'Scrapping', 'final_laptops.json'),

    // Server data files
    SERVER_FINAL_DATA: path.join(__dirname, '..', 'server', 'Data', 'final_laptops.json'),
    SERVER_MATCHED_DATA: path.join(__dirname, '..', 'server', 'Data', 'matched_laptops.json'),

    // Timeouts (in milliseconds)
    AMAZON_TIMEOUT: 3 * 60 * 60 * 1000, // 3 hours
    FLIPKART_TIMEOUT: 3 * 60 * 60 * 1000, // 3 hours
    MATCH_TIMEOUT: 30 * 60 * 1000, // 30 minutes

    // Retry configuration
    MAX_RETRIES: 3,
    RETRY_DELAY: 5 * 60 * 1000, // 5 minutes
};

class ScrapingScheduler {
    constructor() {
        this.logFile = path.join(CONFIG.LOG_DIR, `scraping-${new Date().toISOString().split('T')[0]}.log`);
        this.errors = [];
        this.warnings = [];

        // Ensure directories exist
        this.ensureDirectories();
    }

    ensureDirectories() {
        const dirs = [CONFIG.LOG_DIR, CONFIG.DATA_DIR];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}`;

        console.log(logMessage);

        // Write to log file
        fs.appendFileSync(this.logFile, logMessage + '\n');

        // Track errors and warnings
        if (level === 'ERROR') {
            this.errors.push(message);
        } else if (level === 'WARN') {
            this.warnings.push(message);
        }
    }

    async runCommand(command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            this.log(`Executing: ${command} ${args.join(' ')}`);

            const child = spawn(command, args, {
                stdio: ['inherit', 'pipe', 'pipe'],
                ...options
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                // Log significant output (avoid spam)
                if (output.includes('Found') || output.includes('Completed') || output.includes('Error')) {
                    this.log(`STDOUT: ${output.trim()}`);
                }
            });

            child.stderr.on('data', (data) => {
                const error = data.toString();
                stderr += error;
                this.log(`STDERR: ${error.trim()}`, 'WARN');
            });

            child.on('close', (code) => {
                if (code === 0) {
                    this.log(`Command completed successfully`);
                    resolve({ stdout, stderr, code });
                } else {
                    this.log(`Command failed with code ${code}`, 'ERROR');
                    reject(new Error(`Process exited with code ${code}. STDERR: ${stderr}`));
                }
            });

            child.on('error', (error) => {
                this.log(`Command error: ${error.message}`, 'ERROR');
                reject(error);
            });
        });
    }

    async runWithTimeout(promise, timeout, description) {
        return Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`${description} timed out after ${timeout}ms`)), timeout)
            )
        ]);
    }

    async retryOperation(operation, description, maxRetries = CONFIG.MAX_RETRIES) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.log(`${description} - Attempt ${attempt}/${maxRetries}`);
                const result = await operation();
                this.log(`${description} - Success on attempt ${attempt}`);
                return result;
            } catch (error) {
                this.log(`${description} - Failed on attempt ${attempt}: ${error.message}`, 'ERROR');

                if (attempt === maxRetries) {
                    throw new Error(`${description} failed after ${maxRetries} attempts. Last error: ${error.message}`);
                }

                // Wait before retry
                this.log(`Waiting ${CONFIG.RETRY_DELAY}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
            }
        }
    }

    async scrapeAmazon() {
        this.log('Starting Amazon scraping...');

        // Clean up previous data
        if (fs.existsSync(CONFIG.AMAZON_DATA)) {
            fs.unlinkSync(CONFIG.AMAZON_DATA);
            this.log('Cleaned up previous Amazon data');
        }

        const operation = () => this.runWithTimeout(
            this.runCommand('node', [CONFIG.AMAZON_SCRIPT], { cwd: CONFIG.SCRAPING_DIR }),
            CONFIG.AMAZON_TIMEOUT,
            'Amazon scraping'
        );

        await this.retryOperation(operation, 'Amazon scraping');

        // Verify data was created
        if (!fs.existsSync(CONFIG.AMAZON_DATA)) {
            throw new Error('Amazon data file was not created');
        }

        const stats = fs.statSync(CONFIG.AMAZON_DATA);
        this.log(`Amazon scraping completed. File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }

    async scrapeFlipkart() {
        this.log('Starting Flipkart scraping...');

        // Clean up previous data
        if (fs.existsSync(CONFIG.FLIPKART_DATA)) {
            fs.unlinkSync(CONFIG.FLIPKART_DATA);
            this.log('Cleaned up previous Flipkart data');
        }

        const operation = () => this.runWithTimeout(
            this.runCommand('node', [CONFIG.FLIPKART_SCRIPT], { cwd: CONFIG.SCRAPING_DIR }),
            CONFIG.FLIPKART_TIMEOUT,
            'Flipkart scraping'
        );

        await this.retryOperation(operation, 'Flipkart scraping');

        // Verify data was created
        if (!fs.existsSync(CONFIG.FLIPKART_DATA)) {
            throw new Error('Flipkart data file was not created');
        }

        const stats = fs.statSync(CONFIG.FLIPKART_DATA);
        this.log(`Flipkart scraping completed. File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }

    async matchAndMergeData() {
        this.log('Starting data matching and merging...');

        // Verify input files exist
        if (!fs.existsSync(CONFIG.AMAZON_DATA)) {
            throw new Error('Amazon data file not found');
        }
        if (!fs.existsSync(CONFIG.FLIPKART_DATA)) {
            throw new Error('Flipkart data file not found');
        }

        const operation = () => this.runWithTimeout(
            this.runCommand('node', [CONFIG.MATCH_SCRIPT], { cwd: CONFIG.SCRAPING_DIR }),
            CONFIG.MATCH_TIMEOUT,
            'Data matching'
        );

        await this.retryOperation(operation, 'Data matching and merging');

        // Verify output files were created
        const outputFiles = [CONFIG.MATCHED_DATA, CONFIG.FINAL_DATA];
        for (const file of outputFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Output file not created: ${file}`);
            }
        }

        this.log('Data matching and merging completed successfully');
    }

    async copyDataToServer() {
        this.log('Copying processed data to server directory...');

        const copyOperations = [
            { src: CONFIG.FINAL_DATA, dest: CONFIG.SERVER_FINAL_DATA, name: 'final_laptops.json' },
            { src: CONFIG.MATCHED_DATA, dest: CONFIG.SERVER_MATCHED_DATA, name: 'matched_laptops.json' }
        ];

        for (const op of copyOperations) {
            if (!fs.existsSync(op.src)) {
                throw new Error(`Source file not found: ${op.src}`);
            }

            // Create backup of existing file
            if (fs.existsSync(op.dest)) {
                const backupPath = `${op.dest}.backup.${Date.now()}`;
                fs.copyFileSync(op.dest, backupPath);
                this.log(`Created backup: ${backupPath}`);
            }

            // Copy new file
            fs.copyFileSync(op.src, op.dest);
            this.log(`Copied ${op.name} to server directory`);

            // Verify copy
            const srcStats = fs.statSync(op.src);
            const destStats = fs.statSync(op.dest);
            if (srcStats.size !== destStats.size) {
                throw new Error(`File copy verification failed for ${op.name}`);
            }
        }

        this.log('Data copied to server successfully');
    }

    async updateDatabase() {
        this.log('Updating database...');

        try {
            // Check if server is running
            const healthCheck = await axios.get(`${CONFIG.SERVER_URL}/api/check-auth`);
            this.log('Server is accessible');
        } catch (error) {
            this.log('Server is not accessible, attempting to start...', 'WARN');
            // Note: In production, you might want to start the server here
            throw new Error('Server is not running. Please start the server manually.');
        }

        // Update final laptops data
        try {
            const response = await axios.get(`${CONFIG.SERVER_URL}/api/insertonetime`, {
                timeout: 10 * 60 * 1000 // 10 minutes timeout
            });

            if (response.data.success) {
                this.log(`Database updated successfully: ${response.data.message}`);
            } else {
                throw new Error(`Database update failed: ${response.data.message}`);
            }
        } catch (error) {
            if (error.response) {
                throw new Error(`Database update failed: ${error.response.data.message || error.response.statusText}`);
            } else {
                throw new Error(`Database update failed: ${error.message}`);
            }
        }

        // Update matched laptops data
        try {
            const response = await axios.get(`${CONFIG.SERVER_URL}/api/match/insertonetime`, {
                timeout: 10 * 60 * 1000 // 10 minutes timeout
            });

            if (response.data.success) {
                this.log(`Matched laptops database updated successfully: ${response.data.message}`);
            } else {
                throw new Error(`Matched laptops database update failed: ${response.data.message}`);
            }
        } catch (error) {
            if (error.response) {
                throw new Error(`Matched laptops database update failed: ${error.response.data.message || error.response.statusText}`);
            } else {
                throw new Error(`Matched laptops database update failed: ${error.message}`);
            }
        }

        this.log('Database update completed successfully');
    }

    async cleanupOldFiles() {
        this.log('Cleaning up old files...');

        const cleanupPaths = [
            { dir: CONFIG.LOG_DIR, pattern: /scraping-.*\.log$/, keepDays: 30 },
            { dir: CONFIG.DATA_DIR, pattern: /.*\.backup\.\d+$/, keepDays: 7 }
        ];

        for (const cleanup of cleanupPaths) {
            if (!fs.existsSync(cleanup.dir)) continue;

            const files = fs.readdirSync(cleanup.dir);
            const cutoffTime = Date.now() - (cleanup.keepDays * 24 * 60 * 60 * 1000);

            for (const file of files) {
                if (!cleanup.pattern.test(file)) continue;

                const filePath = path.join(cleanup.dir, file);
                const stats = fs.statSync(filePath);

                if (stats.mtime.getTime() < cutoffTime) {
                    fs.unlinkSync(filePath);
                    this.log(`Deleted old file: ${filePath}`);
                }
            }
        }

        this.log('Cleanup completed');
    }

    async sendNotification(subject, message) {
        // Placeholder for notification system
        // You can implement email, Slack, Discord, etc. notifications here
        this.log(`NOTIFICATION: ${subject} - ${message}`);

        // Example: Send to webhook
        // if (process.env.WEBHOOK_URL) {
        //   try {
        //     await axios.post(process.env.WEBHOOK_URL, {
        //       text: `${subject}: ${message}`
        //     });
        //   } catch (error) {
        //     this.log(`Failed to send notification: ${error.message}`, 'WARN');
        //   }
        // }
    }

    async generateSummaryReport() {
        const totalTime = Date.now() - this.startTime;
        const hours = Math.floor(totalTime / (60 * 60 * 1000));
        const minutes = Math.floor((totalTime % (60 * 60 * 1000)) / (60 * 1000));

        const report = {
            timestamp: new Date().toISOString(),
            duration: `${hours}h ${minutes}m`,
            success: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings,
            dataFiles: {
                amazonData: fs.existsSync(CONFIG.AMAZON_DATA) ? fs.statSync(CONFIG.AMAZON_DATA).size : 0,
                flipkartData: fs.existsSync(CONFIG.FLIPKART_DATA) ? fs.statSync(CONFIG.FLIPKART_DATA).size : 0,
                matchedData: fs.existsSync(CONFIG.MATCHED_DATA) ? fs.statSync(CONFIG.MATCHED_DATA).size : 0,
                finalData: fs.existsSync(CONFIG.FINAL_DATA) ? fs.statSync(CONFIG.FINAL_DATA).size : 0,
            }
        };

        // Save report
        const reportPath = path.join(CONFIG.LOG_DIR, `report-${new Date().toISOString().split('T')[0]}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        return report;
    }

    async run() {
        this.startTime = Date.now();
        this.log('Starting automated scraping process...');

        try {
            // Step 1: Scrape Amazon data
            await this.scrapeAmazon();

            // Step 2: Scrape Flipkart data
            await this.scrapeFlipkart();

            // Step 3: Match and merge data
            await this.matchAndMergeData();

            // Step 4: Copy data to server
            await this.copyDataToServer();

            // Step 5: Update database
            await this.updateDatabase();

            // Step 6: Cleanup old files
            await this.cleanupOldFiles();

            // Generate success report
            const report = await this.generateSummaryReport();

            this.log('Automated scraping process completed successfully!');
            await this.sendNotification('Scraping Success', `Data scraping and update completed successfully in ${report.duration}`);

        } catch (error) {
            this.log(`Automated scraping process failed: ${error.message}`, 'ERROR');

            const report = await this.generateSummaryReport();
            await this.sendNotification('Scraping Failed', `Data scraping failed: ${error.message}. Duration: ${report.duration}`);

            process.exit(1);
        }
    }
}

// Main execution
if (require.main === module) {
    const scheduler = new ScrapingScheduler();
    scheduler.run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = ScrapingScheduler;
