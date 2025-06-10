/**
 * Automated Laptop Data Pipeline with Cron Jobs
 * 
 * This script sets up and manages the complete data pipeline:
 * 1. Database optimization
 * 2. Data scraping from Amazon and Flipkart
 * 3. Data matching and processing
 * 4. Database updates
 * 5. Error handling and logging
 * 
 * Runs every 3 days via cron job
 */

const cron = require('node-cron');
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

    // Scripts
    AMAZON_SCRIPT: path.join(__dirname, '..', 'Scrapping', 'AmazonFinal.js'),
    FLIPKART_SCRIPT: path.join(__dirname, '..', 'Scrapping', 'Flip.js'),
    MATCH_SCRIPT: path.join(__dirname, '..', 'Scrapping', 'matchFin.js'),
    DB_OPTIMIZE_SCRIPT: path.join(__dirname, '..', 'server', 'optimize-database.js'),

    // Data files
    AMAZON_DATA: path.join(__dirname, '..', 'Scrapping', 'amazon_complete_data.json'),
    FLIPKART_DATA: path.join(__dirname, '..', 'Scrapping', 'flipkart_complete_data.json'),
    MATCHED_DATA: path.join(__dirname, '..', 'Scrapping', 'matched_laptops.json'),
    FINAL_DATA: path.join(__dirname, '..', 'Scrapping', 'final_laptops.json'),

    // Server data files
    SERVER_FINAL_DATA: path.join(__dirname, '..', 'server', 'Data', 'final_laptops.json'),
    SERVER_MATCHED_DATA: path.join(__dirname, '..', 'server', 'Data', 'matched_laptops.json'),

    // Timeouts (in milliseconds)
    AMAZON_TIMEOUT: 4 * 60 * 60 * 1000, // 4 hours
    FLIPKART_TIMEOUT: 4 * 60 * 60 * 1000, // 4 hours
    MATCH_TIMEOUT: 45 * 60 * 1000, // 45 minutes
    DB_TIMEOUT: 15 * 60 * 1000, // 15 minutes

    // Retry configuration
    MAX_RETRIES: 2,
    RETRY_DELAY: 10 * 60 * 1000, // 10 minutes

    // Email configuration (optional)
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT || 587,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    NOTIFY_EMAIL: process.env.NOTIFY_EMAIL,
};

class DataPipelineManager {
    constructor() {
        this.logFile = path.join(CONFIG.LOG_DIR, `pipeline-${new Date().toISOString().split('T')[0]}.log`);
        this.errors = [];
        this.warnings = [];
        this.startTime = null;
        this.stats = {
            amazonProducts: 0,
            flipkartProducts: 0,
            matchedProducts: 0,
            finalProducts: 0,
            dbUpdated: false
        };

        this.ensureDirectories();
    }

    ensureDirectories() {
        const dirs = [CONFIG.LOG_DIR, CONFIG.DATA_DIR];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                this.log(`Created directory: ${dir}`);
            }
        });
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}`;

        console.log(logMessage);
        fs.appendFileSync(this.logFile, logMessage + '\n');

        if (level === 'ERROR') {
            this.errors.push(message);
        } else if (level === 'WARN') {
            this.warnings.push(message);
        }
    }

    async runScript(scriptPath, args = [], timeout = 60000, description = '') {
        return new Promise((resolve, reject) => {
            this.log(`Starting ${description || path.basename(scriptPath)}`);

            const child = spawn('node', [scriptPath, ...args], {
                stdio: ['inherit', 'pipe', 'pipe'],
                cwd: path.dirname(scriptPath)
            });

            let stdout = '';
            let stderr = '';
            let timedOut = false;

            // Set timeout
            const timeoutId = setTimeout(() => {
                timedOut = true;
                child.kill('SIGTERM');
                this.log(`Script ${description} timed out after ${timeout}ms`, 'ERROR');
            }, timeout);

            child.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;

                // Log important outputs
                const lines = output.split('\n').filter(line => line.trim());
                lines.forEach(line => {
                    if (line.includes('Found') || line.includes('Completed') ||
                        line.includes('Error') || line.includes('Success') ||
                        line.includes('products') || line.includes('laptops')) {
                        this.log(`${description}: ${line.trim()}`);
                    }
                });
            });

            child.stderr.on('data', (data) => {
                const error = data.toString();
                stderr += error;
                this.log(`${description} STDERR: ${error.trim()}`, 'WARN');
            });

            child.on('close', (code) => {
                clearTimeout(timeoutId);

                if (timedOut) {
                    reject(new Error(`Script timed out`));
                } else if (code === 0) {
                    this.log(`${description} completed successfully`);
                    resolve({ stdout, stderr, code });
                } else {
                    this.log(`${description} failed with code ${code}`, 'ERROR');
                    reject(new Error(`Process exited with code ${code}`));
                }
            });

            child.on('error', (error) => {
                clearTimeout(timeoutId);
                this.log(`${description} error: ${error.message}`, 'ERROR');
                reject(error);
            });
        });
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
                    throw error;
                } else {
                    this.log(`Waiting ${CONFIG.RETRY_DELAY}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
                }
            }
        }
    }

    async optimizeDatabase() {
        this.log('Starting database optimization...');

        try {
            await this.runScript(
                CONFIG.DB_OPTIMIZE_SCRIPT,
                [],
                CONFIG.DB_TIMEOUT,
                'Database Optimization'
            );
            this.log('Database optimization completed');
        } catch (error) {
            this.log(`Database optimization failed: ${error.message}`, 'WARN');
            // Don't fail the entire pipeline for optimization issues
        }
    }

    async scrapeAmazon() {
        this.log('Starting Amazon scraping...');

        const result = await this.retryOperation(
            () => this.runScript(
                CONFIG.AMAZON_SCRIPT,
                [],
                CONFIG.AMAZON_TIMEOUT,
                'Amazon Scraping'
            ),
            'Amazon Scraping'
        );

        // Count products
        if (fs.existsSync(CONFIG.AMAZON_DATA)) {
            const data = JSON.parse(fs.readFileSync(CONFIG.AMAZON_DATA, 'utf8'));
            this.stats.amazonProducts = Array.isArray(data) ? data.length : 0;
            this.log(`Amazon scraping completed: ${this.stats.amazonProducts} products`);
        }

        return result;
    }

    async scrapeFlipkart() {
        this.log('Starting Flipkart scraping...');

        const result = await this.retryOperation(
            () => this.runScript(
                CONFIG.FLIPKART_SCRIPT,
                [],
                CONFIG.FLIPKART_TIMEOUT,
                'Flipkart Scraping'
            ),
            'Flipkart Scraping'
        );

        // Count products
        if (fs.existsSync(CONFIG.FLIPKART_DATA)) {
            const data = JSON.parse(fs.readFileSync(CONFIG.FLIPKART_DATA, 'utf8'));
            this.stats.flipkartProducts = Array.isArray(data) ? data.length : 0;
            this.log(`Flipkart scraping completed: ${this.stats.flipkartProducts} products`);
        }

        return result;
    }

    async matchAndMergeData() {
        this.log('Starting data matching and merging...');

        const result = await this.retryOperation(
            () => this.runScript(
                CONFIG.MATCH_SCRIPT,
                [],
                CONFIG.MATCH_TIMEOUT,
                'Data Matching'
            ),
            'Data Matching'
        );

        // Count matched products
        if (fs.existsSync(CONFIG.MATCHED_DATA)) {
            const data = JSON.parse(fs.readFileSync(CONFIG.MATCHED_DATA, 'utf8'));
            this.stats.matchedProducts = Array.isArray(data) ? data.length : 0;
            this.log(`Data matching completed: ${this.stats.matchedProducts} matched products`);
        }

        if (fs.existsSync(CONFIG.FINAL_DATA)) {
            const data = JSON.parse(fs.readFileSync(CONFIG.FINAL_DATA, 'utf8'));
            this.stats.finalProducts = Array.isArray(data) ? data.length : 0;
            this.log(`Final data prepared: ${this.stats.finalProducts} products`);
        }

        return result;
    }

    async copyDataToServer() {
        this.log('Copying data files to server directory...');

        const filesToCopy = [
            { src: CONFIG.FINAL_DATA, dest: CONFIG.SERVER_FINAL_DATA },
            { src: CONFIG.MATCHED_DATA, dest: CONFIG.SERVER_MATCHED_DATA }
        ];

        for (const { src, dest } of filesToCopy) {
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, dest);
                this.log(`Copied ${path.basename(src)} to server directory`);
            } else {
                throw new Error(`Source file not found: ${src}`);
            }
        }
    }

    async updateDatabase() {
        this.log('Updating database...');

        try {
            // Update main laptop collection
            const finalResponse = await axios.get(`${CONFIG.SERVER_URL}/api/insertonetime`, {
                timeout: 5 * 60 * 1000 // 5 minutes
            });

            if (finalResponse.data.success) {
                this.log('Successfully updated main laptop collection');
            } else {
                throw new Error('Failed to update main laptop collection');
            }

            // Update matched laptop collection
            const matchedResponse = await axios.get(`${CONFIG.SERVER_URL}/api/match/insertonetime`, {
                timeout: 5 * 60 * 1000 // 5 minutes
            });

            if (matchedResponse.data.success) {
                this.log('Successfully updated matched laptop collection');
                this.stats.dbUpdated = true;
            } else {
                throw new Error('Failed to update matched laptop collection');
            }

        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Server is not running. Please start the server first.');
            }
            throw error;
        }
    }

    async sendNotification() {
        if (!CONFIG.NOTIFY_EMAIL || !CONFIG.SMTP_HOST) {
            this.log('Email notifications not configured, skipping...');
            return;
        }

        try {
            const nodemailer = require('nodemailer');

            const transporter = nodemailer.createTransporter({
                host: CONFIG.SMTP_HOST,
                port: CONFIG.SMTP_PORT,
                secure: CONFIG.SMTP_PORT === 465,
                auth: {
                    user: CONFIG.SMTP_USER,
                    pass: CONFIG.SMTP_PASS
                }
            });

            const duration = Date.now() - this.startTime;
            const status = this.errors.length > 0 ? 'FAILED' : 'SUCCESS';

            const emailContent = `
Laptop Data Pipeline Report
==========================

Status: ${status}
Duration: ${Math.round(duration / 1000 / 60)} minutes
Timestamp: ${new Date().toISOString()}

Statistics:
- Amazon products: ${this.stats.amazonProducts}
- Flipkart products: ${this.stats.flipkartProducts}
- Matched products: ${this.stats.matchedProducts}
- Final products: ${this.stats.finalProducts}
- Database updated: ${this.stats.dbUpdated ? 'Yes' : 'No'}

${this.errors.length > 0 ? `
Errors (${this.errors.length}):
${this.errors.map(err => `- ${err}`).join('\n')}
` : ''}

${this.warnings.length > 0 ? `
Warnings (${this.warnings.length}):
${this.warnings.map(warn => `- ${warn}`).join('\n')}
` : ''}

Log file: ${this.logFile}
            `;

            await transporter.sendMail({
                from: CONFIG.SMTP_USER,
                to: CONFIG.NOTIFY_EMAIL,
                subject: `Laptop Data Pipeline ${status}`,
                text: emailContent
            });

            this.log('Notification email sent successfully');
        } catch (error) {
            this.log(`Failed to send notification: ${error.message}`, 'WARN');
        }
    }

    async runFullPipeline() {
        this.startTime = Date.now();
        this.log('🚀 Starting full data pipeline...');

        try {
            // Step 1: Optimize database
            await this.optimizeDatabase();

            // Step 2: Scrape data from both sources in parallel
            this.log('Starting parallel data scraping...');
            const [amazonResult, flipkartResult] = await Promise.allSettled([
                this.scrapeAmazon(),
                this.scrapeFlipkart()
            ]);

            // Check if at least one scraping succeeded
            if (amazonResult.status === 'rejected' && flipkartResult.status === 'rejected') {
                throw new Error('Both Amazon and Flipkart scraping failed');
            }

            if (amazonResult.status === 'rejected') {
                this.log('Amazon scraping failed, continuing with Flipkart data only', 'WARN');
            }
            if (flipkartResult.status === 'rejected') {
                this.log('Flipkart scraping failed, continuing with Amazon data only', 'WARN');
            }

            // Step 3: Match and merge data
            await this.matchAndMergeData();

            // Step 4: Copy data to server
            await this.copyDataToServer();

            // Step 5: Update database
            await this.updateDatabase();

            const duration = Date.now() - this.startTime;
            this.log(`✅ Pipeline completed successfully in ${Math.round(duration / 1000 / 60)} minutes`);

            // Send success notification
            await this.sendNotification();

        } catch (error) {
            const duration = Date.now() - this.startTime;
            this.log(`❌ Pipeline failed after ${Math.round(duration / 1000 / 60)} minutes: ${error.message}`, 'ERROR');

            // Send failure notification
            await this.sendNotification();

            throw error;
        }
    }
}

// Cron job setup
function setupCronJobs() {
    const manager = new DataPipelineManager();

    // Run every 3 days at 2:00 AM
    const cronExpression = '0 2 */3 * *';

    console.log(`🔄 Setting up cron job with expression: ${cronExpression}`);
    console.log('Schedule: Every 3 days at 2:00 AM');

    cron.schedule(cronExpression, async () => {
        console.log('🚀 Cron job triggered - Starting data pipeline...');

        try {
            await manager.runFullPipeline();
        } catch (error) {
            console.error('❌ Cron job failed:', error.message);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata" // Adjust timezone as needed
    });

    console.log('✅ Cron job scheduled successfully');
}

// Manual execution support
async function runManually() {
    console.log('🔧 Running pipeline manually...');
    const manager = new DataPipelineManager();

    try {
        await manager.runFullPipeline();
        process.exit(0);
    } catch (error) {
        console.error('❌ Manual run failed:', error.message);
        process.exit(1);
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--manual') || args.includes('-m')) {
        runManually();
    } else {
        setupCronJobs();

        // Keep the process running
        console.log('🔄 Cron scheduler is running. Press Ctrl+C to stop.');

        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n👋 Shutting down cron scheduler...');
            process.exit(0);
        });
    }
}

module.exports = { DataPipelineManager, setupCronJobs };
