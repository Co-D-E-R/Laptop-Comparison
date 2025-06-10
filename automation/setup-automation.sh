#!/bin/bash

# Laptop Comparison Scraping Automation Setup Script
# This script sets up cron jobs and environment for automated scraping

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NODE_PATH="$(which node)"
CRON_LOG="/var/log/laptop-scraping-cron.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root (needed for cron setup)
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. Cron jobs will be set up for root user."
        CRON_USER="root"
    else
        log "Running as regular user: $(whoami)"
        CRON_USER="$(whoami)"
    fi
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    success "Node.js found: $NODE_VERSION"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    success "npm found: $NPM_VERSION"
    
    # Check if project dependencies are installed
    if [ ! -d "$PROJECT_DIR/node_modules" ]; then
        warning "Node modules not found. Installing dependencies..."
        cd "$PROJECT_DIR" && npm install
    fi
    
    # Check automation dependencies
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        log "Installing automation dependencies..."
        cd "$SCRIPT_DIR" && npm install
    fi
    
    success "All dependencies checked"
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..."
    
    DIRS=(
        "$SCRIPT_DIR/logs"
        "$PROJECT_DIR/server/Data"
        "$PROJECT_DIR/Scrapping/backups"
    )
    
    for dir in "${DIRS[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log "Created directory: $dir"
        fi
    done
    
    success "Directories setup completed"
}

# Create environment file
create_env_file() {
    log "Creating environment configuration..."
    
    ENV_FILE="$SCRIPT_DIR/.env"
    
    if [ ! -f "$ENV_FILE" ]; then
        cat > "$ENV_FILE" << EOF
# Laptop Scraping Automation Environment
NODE_ENV=production
SERVER_URL=http://localhost:8080
WEBHOOK_URL=
EMAIL_NOTIFICATIONS=false
EMAIL_TO=
EMAIL_FROM=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EOF
        success "Environment file created: $ENV_FILE"
        warning "Please edit $ENV_FILE to configure your settings"
    else
        log "Environment file already exists: $ENV_FILE"
    fi
}

# Create wrapper script for cron
create_cron_wrapper() {
    log "Creating cron wrapper script..."
    
    WRAPPER_SCRIPT="$SCRIPT_DIR/run-scraping.sh"
    
    cat > "$WRAPPER_SCRIPT" << EOF
#!/bin/bash

# Laptop Scraping Cron Wrapper Script
# This script is called by cron to run the scraping automation

# Set environment
export PATH="/usr/local/bin:/usr/bin:/bin:\$PATH"
export NODE_PATH="$NODE_PATH"

# Change to script directory
cd "$SCRIPT_DIR"

# Load environment variables
if [ -f ".env" ]; then
    source .env
fi

# Logging
LOG_FILE="$SCRIPT_DIR/logs/cron-\$(date +%Y-%m-%d).log"
echo "\$(date '+%Y-%m-%d %H:%M:%S') - Starting scheduled scraping..." >> "\$LOG_FILE"

# Run the scraping script
"$NODE_PATH" "$SCRIPT_DIR/scrape-scheduler.js" >> "\$LOG_FILE" 2>&1

# Capture exit code
EXIT_CODE=\$?

if [ \$EXIT_CODE -eq 0 ]; then
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - Scraping completed successfully" >> "\$LOG_FILE"
else
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - Scraping failed with exit code \$EXIT_CODE" >> "\$LOG_FILE"
fi

# Rotate logs (keep last 30 days)
find "$SCRIPT_DIR/logs" -name "cron-*.log" -mtime +30 -delete 2>/dev/null

exit \$EXIT_CODE
EOF

    chmod +x "$WRAPPER_SCRIPT"
    success "Cron wrapper script created: $WRAPPER_SCRIPT"
}

# Setup cron job
setup_cron_job() {
    log "Setting up cron job..."
    
    # Cron job runs every 3 days at 2 AM
    CRON_SCHEDULE="0 2 */3 * *"
    CRON_COMMAND="$SCRIPT_DIR/run-scraping.sh"
    CRON_ENTRY="$CRON_SCHEDULE $CRON_COMMAND"
    
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "$SCRIPT_DIR/run-scraping.sh"; then
        warning "Cron job already exists for this script"
        return
    fi
    
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
    
    if [ $? -eq 0 ]; then
        success "Cron job added successfully"
        log "Schedule: Every 3 days at 2:00 AM"
        log "Command: $CRON_COMMAND"
    else
        error "Failed to add cron job"
        exit 1
    fi
}

# Create monitoring script
create_monitoring_script() {
    log "Creating monitoring script..."
    
    MONITOR_SCRIPT="$SCRIPT_DIR/monitor-scraping.sh"
    
    cat > "$MONITOR_SCRIPT" << EOF
#!/bin/bash

# Laptop Scraping Monitoring Script
# Check the status of scraping automation

SCRIPT_DIR="$SCRIPT_DIR"
LOG_DIR="\$SCRIPT_DIR/logs"

echo "=== Laptop Scraping Automation Status ==="
echo

# Check cron job
echo "Cron Job Status:"
if crontab -l 2>/dev/null | grep -q "\$SCRIPT_DIR/run-scraping.sh"; then
    echo "✅ Cron job is configured"
    crontab -l | grep "\$SCRIPT_DIR/run-scraping.sh"
else
    echo "❌ Cron job not found"
fi
echo

# Check recent logs
echo "Recent Activity:"
if [ -d "\$LOG_DIR" ]; then
    LATEST_LOG=\$(ls -t "\$LOG_DIR"/cron-*.log 2>/dev/null | head -1)
    if [ -n "\$LATEST_LOG" ]; then
        echo "Latest log: \$LATEST_LOG"
        echo "Last 10 lines:"
        tail -10 "\$LATEST_LOG"
    else
        echo "No cron logs found"
    fi
else
    echo "Log directory not found"
fi
echo

# Check data files
echo "Data Files Status:"
DATA_FILES=(
    "$PROJECT_DIR/server/Data/final_laptops.json"
    "$PROJECT_DIR/server/Data/matched_laptops.json"
)

for file in "\${DATA_FILES[@]}"; do
    if [ -f "\$file" ]; then
        SIZE=\$(ls -lh "\$file" | awk '{print \$5}')
        MODIFIED=\$(ls -l "\$file" | awk '{print \$6, \$7, \$8}')
        echo "✅ \$(basename "\$file"): \$SIZE (modified: \$MODIFIED)"
    else
        echo "❌ \$(basename "\$file"): Not found"
    fi
done
echo

# Check if server is running
echo "Server Status:"
if curl -s "http://localhost:8080/api/check-auth" > /dev/null 2>&1; then
    echo "✅ Server is running"
else
    echo "❌ Server is not responding"
fi
echo

# Show next scheduled run
echo "Next Scheduled Runs:"
if command -v at &> /dev/null; then
    echo "Cron schedule for \$(whoami):"
    crontab -l 2>/dev/null | grep "\$SCRIPT_DIR/run-scraping.sh" | while read line; do
        echo "  \$line"
    done
fi
EOF

    chmod +x "$MONITOR_SCRIPT"
    success "Monitoring script created: $MONITOR_SCRIPT"
}

# Create uninstall script
create_uninstall_script() {
    log "Creating uninstall script..."
    
    UNINSTALL_SCRIPT="$SCRIPT_DIR/uninstall-automation.sh"
    
    cat > "$UNINSTALL_SCRIPT" << EOF
#!/bin/bash

# Laptop Scraping Automation Uninstall Script

SCRIPT_DIR="$SCRIPT_DIR"

echo "=== Uninstalling Laptop Scraping Automation ==="
echo

# Remove cron job
echo "Removing cron job..."
if crontab -l 2>/dev/null | grep -q "\$SCRIPT_DIR/run-scraping.sh"; then
    crontab -l | grep -v "\$SCRIPT_DIR/run-scraping.sh" | crontab -
    echo "✅ Cron job removed"
else
    echo "ℹ️  No cron job found"
fi

# Ask about keeping logs and data
echo
read -p "Do you want to remove logs and backup data? (y/N): " -n 1 -r
echo
if [[ \$REPLY =~ ^[Yy]\$ ]]; then
    rm -rf "\$SCRIPT_DIR/logs"
    rm -rf "\$PROJECT_DIR/Scrapping/backups"
    echo "✅ Logs and backups removed"
fi

echo
echo "✅ Automation uninstalled successfully"
echo "Note: The main scraping scripts and data files are preserved"
EOF

    chmod +x "$UNINSTALL_SCRIPT"
    success "Uninstall script created: $UNINSTALL_SCRIPT"
}

# Test the setup
test_setup() {
    log "Testing the setup..."
    
    # Test Node.js script syntax
    if "$NODE_PATH" -c "$SCRIPT_DIR/scrape-scheduler.js" 2>/dev/null; then
        success "Scraping script syntax is valid"
    else
        error "Scraping script has syntax errors"
        return 1
    fi
    
    # Test wrapper script
    if bash -n "$SCRIPT_DIR/run-scraping.sh" 2>/dev/null; then
        success "Wrapper script syntax is valid"
    else
        error "Wrapper script has syntax errors"
        return 1
    fi
    
    success "Setup test completed successfully"
}

# Display setup summary
show_summary() {
    echo
    echo "=== Setup Complete ==="
    echo
    success "Laptop scraping automation has been configured successfully!"
    echo
    echo "📋 Summary:"
    echo "  • Cron job scheduled to run every 3 days at 2:00 AM"
    echo "  • Logs will be stored in: $SCRIPT_DIR/logs/"
    echo "  • Data will be updated in: $PROJECT_DIR/server/Data/"
    echo
    echo "🔧 Management Commands:"
    echo "  • Monitor status: $SCRIPT_DIR/monitor-scraping.sh"
    echo "  • View cron jobs: crontab -l"
    echo "  • Edit cron jobs: crontab -e"
    echo "  • Uninstall: $SCRIPT_DIR/uninstall-automation.sh"
    echo
    echo "📁 Files Created:"
    echo "  • $SCRIPT_DIR/scrape-scheduler.js (main script)"
    echo "  • $SCRIPT_DIR/run-scraping.sh (cron wrapper)"
    echo "  • $SCRIPT_DIR/monitor-scraping.sh (monitoring)"
    echo "  • $SCRIPT_DIR/.env (configuration)"
    echo
    echo "⚠️  Important Notes:"
    echo "  • Make sure your server is running before the scheduled time"
    echo "  • Check logs regularly for any issues"
    echo "  • Configure notifications in .env file"
    echo "  • The first run is scheduled for the next occurrence"
    echo
    warning "To run immediately for testing: $SCRIPT_DIR/run-scraping.sh"
}

# Main execution
main() {
    log "Starting Laptop Comparison Scraping Automation Setup"
    echo
    
    check_permissions
    check_dependencies
    setup_directories
    create_env_file
    create_cron_wrapper
    setup_cron_job
    create_monitoring_script
    create_uninstall_script
    test_setup
    
    if [ $? -eq 0 ]; then
        show_summary
    else
        error "Setup failed. Please check the errors above."
        exit 1
    fi
}

# Run main function
main "$@"
