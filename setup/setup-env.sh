#!/bin/bash

# Audit Service Environment Setup
# This script sets up the audit service for any environment by reading from .env files

set -e

SERVICE_NAME="audit-service"
SERVICE_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Default environment
ENV_NAME="development"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENV_NAME="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  -e, --env ENV_NAME    Environment name (default: development)"
            echo "                        Looks for .env.ENV_NAME file"
            echo "  -h, --help           Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                   # Uses .env (development)"
            echo "  $0 -e production     # Uses .env.production"
            echo "  $0 -e staging        # Uses .env.staging"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

echo "🚀 Setting up $SERVICE_NAME for $ENV_NAME environment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# Function to load environment variables from .env file
load_env_file() {
    local env_file=""
    
    if [ "$ENV_NAME" = "development" ]; then
        env_file="$SERVICE_PATH/.env.development"
    else
        env_file="$SERVICE_PATH/.env.$ENV_NAME"
    fi
    
    log_info "Loading environment variables from $(basename $env_file)..."
    
    if [ ! -f "$env_file" ]; then
        log_error "Environment file not found: $env_file"
        log_info "Available environment files:"
        ls -la "$SERVICE_PATH"/.env* 2>/dev/null || log_info "No .env files found"
        exit 1
    fi
    
    # Load environment variables
    set -a  # automatically export all variables
    
    # Source the file while filtering out comments and empty lines
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
            # Export the variable if it contains an equals sign
            if [[ "$line" =~ ^[^=]+= ]]; then
                export "$line"
            fi
        fi
    done < "$env_file"
    
    set +a  # stop automatically exporting
    
    log_success "Environment variables loaded from $(basename $env_file)"
    
    # Validate required variables
    local required_vars=("DB_NAME" "DB_USER" "DB_PASSWORD" "PORT" "NODE_ENV")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        log_info "Please ensure these variables are set in $env_file"
        exit 1
    fi
    
    log_info "Environment: $NODE_ENV"
    log_info "Port: $PORT"
    log_info "Database: $DB_NAME"
    log_info "Database User: $DB_USER"
}

# Check for Node.js
check_nodejs() {
    log_info "Checking Node.js installation..."
    
    if command_exists node; then
        NODE_VERSION=$(node --version | sed 's/v//')
        log_success "Node.js $NODE_VERSION is installed"
        
        # Check if version is 18 or higher
        if [[ $(echo "$NODE_VERSION" | cut -d. -f1) -lt 18 ]]; then
            log_warning "Node.js version 18+ is recommended. Current version: $NODE_VERSION"
        fi
    else
        log_error "Node.js is not installed. Please install Node.js 18+ and npm"
        exit 1
    fi
    
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        log_success "npm $NPM_VERSION is installed"
    else
        log_error "npm is not installed. Please install npm"
        exit 1
    fi
}

# Check for PostgreSQL
check_postgresql() {
    log_info "Checking PostgreSQL installation..."
    
    if command_exists psql; then
        POSTGRES_VERSION=$(psql --version | awk '{print $3}' | sed 's/,.*//g')
        log_success "PostgreSQL $POSTGRES_VERSION is installed"
    else
        log_error "PostgreSQL is not installed. Please install PostgreSQL 12+"
        exit 1
    fi
}

# Install Node.js dependencies
install_dependencies() {
    log_info "Installing Node.js dependencies..."
    
    cd "$SERVICE_PATH"
    
    if [ -f "package.json" ]; then
        npm install
        log_success "Dependencies installed successfully"
    else
        log_error "package.json not found in $SERVICE_PATH"
        exit 1
    fi
}

# Setup database
setup_database() {
    log_info "Setting up database: $DB_NAME"
    
    # Check if database exists and create if not
    if ! psql -h ${DB_HOST:-localhost} -U postgres -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        log_info "Creating database: $DB_NAME"
        createdb -h ${DB_HOST:-localhost} -U postgres "$DB_NAME"
        log_success "Database created successfully"
    else
        log_info "Database $DB_NAME already exists"
    fi
    
    # Create user if not exists
    psql -h ${DB_HOST:-localhost} -U postgres -d postgres -c "
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
                CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
            END IF;
        END
        \$\$;
        
        GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
    " > /dev/null 2>&1
    
    log_success "Database user configured"
}

# Run database setup scripts
run_database_scripts() {
    if [ -d "$SERVICE_PATH/database" ]; then
        log_info "Running database setup scripts..."
        cd "$SERVICE_PATH"
        
        if [ -f "database/scripts/setup.js" ]; then
            log_info "Running database setup..."
            node database/scripts/setup.js
            log_success "Database setup completed"
        else
            log_warning "Database setup script not found"
        fi
    else
        log_warning "Database directory not found"
    fi
}

# Validate setup
validate_setup() {
    log_info "Validating setup..."
    
    # Check if we can connect to database
    if command_exists psql; then
        if psql -h ${DB_HOST:-localhost} -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
            log_success "Database connection successful"
        else
            log_error "Database connection failed"
            return 1
        fi
    fi
    
    # Check if Node.js dependencies are installed
    if [ -d "$SERVICE_PATH/node_modules" ]; then
        log_success "Node.js dependencies are installed"
    else
        log_error "Node.js dependencies not found"
        return 1
    fi
    
    return 0
}

# Create environment file if it doesn't exist
create_env_template() {
    local env_file=""
    
    if [ "$ENV_NAME" = "development" ]; then
        env_file="$SERVICE_PATH/.env.development"
    else
        env_file="$SERVICE_PATH/.env.$ENV_NAME"
    fi
    
    if [ ! -f "$env_file" ]; then
        log_info "Creating environment template: $(basename $env_file)"
        
        cat > "$env_file" << EOF
# Audit Service Environment Configuration - $ENV_NAME

# Server Configuration
NODE_ENV=$ENV_NAME
PORT=3007
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=audit_db
DB_USER=audit_user
DB_PASSWORD=audit_password
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10

# Elasticsearch Configuration
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_INDEX=audit_logs
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=audit-service
KAFKA_TOPIC_PREFIX=audit
KAFKA_GROUP_ID=audit-service-group

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-audit-service-$ENV_NAME
JWT_EXPIRES_IN=24h

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/audit-service.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
LOG_DATE_PATTERN=YYYY-MM-DD

# Audit Configuration
AUDIT_RETENTION_DAYS=365
AUDIT_BATCH_SIZE=1000
AUDIT_EXPORT_FORMAT=json,csv
AUDIT_COMPRESSION_ENABLED=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200

# Service Discovery
SERVICE_REGISTRY_URL=http://localhost:8761/eureka
SERVICE_NAME=audit-service
SERVICE_VERSION=1.0.0

# Health Check Configuration
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000

# Data Collection Configuration
COLLECT_REQUEST_HEADERS=true
COLLECT_RESPONSE_HEADERS=false
COLLECT_REQUEST_BODY=false
COLLECT_RESPONSE_BODY=false
COLLECT_USER_AGENT=true
COLLECT_IP_ADDRESS=true

# Cleanup Configuration
CLEANUP_ENABLED=true
CLEANUP_SCHEDULE=0 2 * * *
CLEANUP_BATCH_SIZE=10000

# Export Configuration
EXPORT_ENABLED=true
EXPORT_SCHEDULE=0 1 * * 0
EXPORT_RETENTION_DAYS=30

# External Service URLs
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002

# Security Configuration
ENCRYPT_SENSITIVE_DATA=true
ENCRYPTION_ALGORITHM=aes-256-gcm
ENCRYPTION_KEY=your-32-character-encryption-key

# Performance Configuration
ASYNC_PROCESSING=true
QUEUE_SIZE=10000
WORKER_THREADS=4
EOF
        
        log_success "Environment template created: $(basename $env_file)"
        log_warning "Please review and update the configuration values as needed"
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "📋 Audit Service Environment Setup"
    echo "=========================================="
    
    OS=$(detect_os)
    log_info "Detected OS: $OS"
    log_info "Target Environment: $ENV_NAME"
    
    # Create environment file if it doesn't exist
    create_env_template
    
    # Load environment variables
    load_env_file
    
    # Check prerequisites
    check_nodejs
    check_postgresql
    
    # Install dependencies
    install_dependencies
    
    # Setup database
    setup_database
    
    # Run database scripts
    run_database_scripts
    
    # Validate setup
    if validate_setup; then
        echo "=========================================="
        log_success "✅ Audit Service setup completed successfully!"
        echo "=========================================="
        echo ""
        echo "📋 Setup Summary:"
        echo "  • Environment: $NODE_ENV"
        echo "  • Port: $PORT"
        echo "  • Database: $DB_NAME"
        echo "  • Health Check: http://localhost:$PORT/health"
        echo "  • API Base: http://localhost:$PORT/api"
        echo ""
        echo "📚 Database Commands:"
        echo "   • npm run db:setup              # Complete database setup"
        echo "   • npm run db:seed               # Load sample data into database"  
        echo "   • npm run db:clear              # Clear database data"
        echo "   • npm run db:clear -- --full       # Clear all data including config"
        echo "   • npm run db:clear -- --drop-schema # Drop all tables and schema"
        echo ""
        echo "🚀 Next Steps:"
        echo "  1. Review and update .env file if needed"
        echo "  2. Start the service: npm run dev"
        echo "  3. Run tests: npm test"
        echo ""
    else
        log_error "Setup validation failed"
        exit 1
    fi
}

# Run main function
main "$@"
