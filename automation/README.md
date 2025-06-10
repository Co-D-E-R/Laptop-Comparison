# Laptop Data Scraping Automation

This automation system handles the complete data pipeline for the Laptop Comparison application, including scraping Amazon and Flipkart data, matching and merging datasets, and updating the server database automatically every 3 days.

## Features

- **Automated Scraping**: Runs Amazon and Flipkart scrapers automatically
- **Data Processing**: Matches and merges scraped data
- **Database Updates**: Automatically updates the server database
- **Error Handling**: Comprehensive retry logic and error reporting
- **Logging**: Detailed logging with automatic cleanup
- **Monitoring**: Built-in status monitoring and reporting
- **Cross-Platform**: Works on both Windows and Linux/macOS
- **Notifications**: Optional webhook and email notifications

## Setup

### Prerequisites

- Node.js 16+ installed
- Server running on localhost:8080 (or configured URL)
- All scraping dependencies installed in the main project

### Quick Setup

#### Windows

```bash
# Run as Administrator
cd automation
setup-automation.bat
```

#### Linux/macOS

```bash
cd automation
chmod +x setup-automation.sh
sudo ./setup-automation.sh
```

### Manual Setup

1. **Install Dependencies**

   ```bash
   cd automation
   npm install
   ```

2. **Configure Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Setup Cron Job (Linux/macOS)**

   ```bash
   # Add to crontab (runs every 3 days at 2 AM)
   0 2 */3 * * /path/to/automation/run-scraping.sh
   ```

4. **Setup Scheduled Task (Windows)**
   ```cmd
   schtasks /create /tn "LaptopScrapingAutomation" /tr "C:\path\to\automation\run-scraping.bat" /sc daily /mo 3 /st 02:00
   ```

## Configuration

### Environment Variables (.env)

```bash
# Server Configuration
NODE_ENV=production
SERVER_URL=http://localhost:8080

# Notification Settings
WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
EMAIL_NOTIFICATIONS=true
EMAIL_TO=admin@yoursite.com
EMAIL_FROM=noreply@yoursite.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Advanced Settings
MAX_RETRIES=3
RETRY_DELAY=300000          # 5 minutes
AMAZON_TIMEOUT=10800000     # 3 hours
FLIPKART_TIMEOUT=10800000   # 3 hours
MATCH_TIMEOUT=1800000       # 30 minutes

# Logging
LOG_LEVEL=INFO
KEEP_LOGS_DAYS=30
KEEP_BACKUPS_DAYS=7
```

## Usage

### Manual Execution

```bash
# Run the complete pipeline
node scrape-scheduler.js

# Or use the wrapper script
./run-scraping.sh    # Linux/macOS
run-scraping.bat     # Windows
```

### Monitoring

```bash
# Check status
./monitor-scraping.sh    # Linux/macOS
monitor-scraping.bat     # Windows

# View logs
tail -f logs/cron-$(date +%Y-%m-%d).log
```

### Uninstalling

```bash
./uninstall-automation.sh    # Linux/macOS
uninstall-automation.bat     # Windows
```

## Process Flow

1. **Data Scraping**

   - Runs `AmazonFinal.js` to scrape Amazon laptop data
   - Runs `Flip.js` to scrape Flipkart laptop data
   - Each scraper has retry logic and timeout protection

2. **Data Processing**

   - Runs `matchFin.js` to match and merge Amazon/Flipkart data
   - Creates `matched_laptops.json` and `final_laptops.json`

3. **Database Update**

   - Copies processed data to server Data directory
   - Calls server APIs to update database
   - Updates both main and matched laptop collections

4. **Cleanup**
   - Removes old log files (30+ days)
   - Removes old backup files (7+ days)
   - Generates summary reports

## File Structure

```
automation/
├── scrape-scheduler.js     # Main automation script
├── setup-automation.sh     # Linux/macOS setup script
├── setup-automation.bat    # Windows setup script
├── run-scraping.sh         # Linux/macOS cron wrapper
├── run-scraping.bat        # Windows task wrapper
├── monitor-scraping.sh     # Linux/macOS monitoring
├── monitor-scraping.bat    # Windows monitoring
├── package.json            # Dependencies
├── .env.example            # Environment template
├── .env                    # Your configuration
├── logs/                   # Log files
│   ├── cron-YYYY-MM-DD.log
│   ├── scraping-YYYY-MM-DD.log
│   └── report-YYYY-MM-DD.json
└── README.md               # This file
```

## Logging

The system generates several types of logs:

- **Cron Logs** (`cron-YYYY-MM-DD.log`): Wrapper script execution logs
- **Scraping Logs** (`scraping-YYYY-MM-DD.log`): Detailed scraping process logs
- **Summary Reports** (`report-YYYY-MM-DD.json`): JSON reports with statistics

### Log Levels

- `INFO`: General information
- `WARN`: Warning messages (non-fatal)
- `ERROR`: Error messages (may cause failure)

## Error Handling

The system includes comprehensive error handling:

- **Retry Logic**: Failed operations are retried up to 3 times
- **Timeouts**: Long-running processes have configurable timeouts
- **Graceful Failure**: Partial failures don't stop the entire process
- **Notifications**: Errors are reported via configured channels

## Monitoring and Alerts

### Built-in Monitoring

- Process execution status
- Data file verification
- Server connectivity checks
- Log file analysis

### Notification Options

- **Webhooks**: Slack, Discord, etc.
- **Email**: SMTP-based email notifications
- **Custom**: Extend the notification system

### Health Checks

```bash
# Check if automation is working
./monitor-scraping.sh

# Check cron job status
crontab -l | grep scraping

# Check recent logs
tail -20 logs/cron-$(date +%Y-%m-%d).log
```

## Troubleshooting

### Common Issues

1. **Node.js Not Found**

   ```bash
   # Ensure Node.js is in PATH
   which node
   node --version
   ```

2. **Permission Denied**

   ```bash
   # Make scripts executable
   chmod +x *.sh
   ```

3. **Server Not Running**

   ```bash
   # Check server status
   curl http://localhost:8080/api/check-auth
   ```

4. **Database Connection Issues**

   - Verify MongoDB is running
   - Check server environment variables
   - Verify network connectivity

5. **Scraping Failures**
   - Check internet connectivity
   - Verify scraping scripts work manually
   - Review site-specific errors in logs

### Log Analysis

```bash
# Find errors in logs
grep -i error logs/*.log

# Check specific scraping step
grep -i "amazon\|flipkart\|matching" logs/*.log

# View recent activity
tail -50 logs/scraping-$(date +%Y-%m-%d).log
```

## Performance Considerations

- **Memory Usage**: Scraping large datasets requires sufficient RAM
- **Disk Space**: Log files and data backups consume disk space
- **Network**: Scraping requires stable internet connection
- **CPU**: Data processing can be CPU-intensive

### Optimization Tips

- Run during off-peak hours (default: 2 AM)
- Monitor disk space regularly
- Adjust timeouts based on your system performance
- Consider running on dedicated server for production

## Security

- **Environment Variables**: Keep sensitive data in `.env`
- **File Permissions**: Restrict access to log files and scripts
- **Network Security**: Secure server endpoints
- **Data Privacy**: Handle scraped data responsibly

## Contributing

To modify the automation system:

1. Test changes manually first
2. Update configuration documentation
3. Test on both Windows and Linux if possible
4. Update version in `package.json`

## License

This automation system is part of the Laptop Comparison project and follows the same license terms.
