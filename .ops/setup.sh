#!/bin/bash

# Audit Service Environment Setup
# This script sets up the audit service for any environment by reading from .env files

set -e

SERVICE_NAME="audit-service"
SERVICE_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  -h, --help           Show this help message"
            echo ""
            echo "This script sets up the audit service for development."
            echo "Uses .env file for configuration."
            echo "Database and dependencies are managed via Docker Compose."
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

echo "🚀 Setting up $SERVICE_NAME for development..."

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
    local env_file="$SERVICE_PATH/.env"
    
    log_info "Loading environment variables from .env..."
    
    if [ ! -f "$env_file" ]; then
        log_error "Environment file not found: $env_file"
        log_info "Please ensure .env file exists in the service root directory"
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
    
    log_success "Environment variables loaded from .env"
    
    # Validate required variables
    local required_vars=("NODE_ENV" "PORT")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        log_info "Please ensure these variables are set in .env"
        exit 1
    fi
    
    log_info "Environment: $NODE_ENV"
    log_info "Port: $PORT"
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

# Check for Docker
check_docker() {
    log_info "Checking Docker installation..."
    
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
        log_success "Docker $DOCKER_VERSION is installed"
        
        # Check if Docker is running
        if docker info > /dev/null 2>&1; then
            log_success "Docker daemon is running"
        else
            log_error "Docker daemon is not running. Please start Docker."
            exit 1
        fi
    else
        log_error "Docker is not installed. Please install Docker"
        exit 1
    fi
    
    if command_exists docker-compose; then
        COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
        log_success "Docker Compose $COMPOSE_VERSION is installed"
    else
        log_error "Docker Compose is not installed. Please install Docker Compose"
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

# Build Docker image
build_docker_image() {
    log_info "Building Docker image for $SERVICE_NAME..."
    
    cd "$SERVICE_PATH"
    
    if [ -f "Dockerfile" ]; then
        docker build -t "$SERVICE_NAME" .
        log_success "Docker image built successfully"
    else
        log_error "Dockerfile not found in $SERVICE_PATH"
        exit 1
    fi
}

# Database setup (handled by Docker)
setup_database_info() {
    if [ -d "$SERVICE_PATH/database" ]; then
        log_info "Database setup scripts will run via Docker Compose..."
        log_info "Database initialization handled by containerized services"
    else
        log_info "No database directory found - using Docker managed database"
    fi
}

# Validate setup
validate_setup() {
    log_info "Validating setup..."
    
    # Check if Node.js dependencies are installed
    if [ -d "$SERVICE_PATH/node_modules" ]; then
        log_success "Node.js dependencies are installed"
    else
        log_error "Node.js dependencies not found"
        return 1
    fi
    
    # Check if Docker image exists
    if docker image inspect "$SERVICE_NAME" > /dev/null 2>&1; then
        log_success "Docker image is built"
    else
        log_error "Docker image not found"
        return 1
    fi
    
    return 0
}

# Main execution
main() {
    echo "=========================================="
    echo "📋 Audit Service Environment Setup"
    echo "=========================================="
    
    OS=$(detect_os)
    log_info "Detected OS: $OS"
    
    # Load environment variables
    load_env_file
    
    # Check prerequisites
    check_nodejs
    check_docker
    
    # Install dependencies
    install_dependencies
    
    # Build Docker image
    build_docker_image
    
    # Validate setup
    if validate_setup; then
        echo "=========================================="
        log_success "✅ Audit Service setup completed successfully!"
        echo "=========================================="
        echo ""
        
        # Start services with Docker Compose
        log_info "� Starting services with Docker Compose..."
        if docker-compose up -d; then
            log_success "Services started successfully"
            echo ""
            log_info "⏳ Waiting for services to be ready..."
            sleep 10
            
            # Check service health
            if docker-compose ps | grep -q "Up.*healthy"; then
                log_success "Services are healthy and ready"
            else
                log_warning "Services may still be starting up"
            fi
        else
            log_error "Failed to start services with Docker Compose"
            return 1
        fi
        echo ""
        
        echo "�📋 Setup Summary:"
        echo "  • Environment: $NODE_ENV"
        echo "  • Port: $PORT"
        echo "  • Docker image: $SERVICE_NAME"
        echo ""
        echo "🚀 Service is now running:"
        echo "  • View status: docker-compose ps"
        echo "  • View logs: docker-compose logs -f"
        echo "  • Stop services: bash .ops/teardown.sh"
        echo "  • Service endpoint: http://localhost:$PORT"
        echo ""
    else
        log_error "Setup validation failed"
        exit 1
    fi
}

# Run main function
main "$@"
