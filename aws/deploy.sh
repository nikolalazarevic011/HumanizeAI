#!/bin/bash

# AWS Deployment Script for HumanizeAI
set -e

echo "🚀 Deploying HumanizeAI to AWS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found. Please install it first."
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI not configured. Run 'aws configure' first."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js 18+."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please install npm."
    exit 1
fi

print_success "Prerequisites check passed!"

# Get AWS account info
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-1")
print_status "AWS Account: $AWS_ACCOUNT_ID"
print_status "AWS Region: $AWS_REGION"

# Step 1: Store API keys in Parameter Store
print_status "Setting up API keys in AWS Parameter Store..."

read -p "Enter your Anthropic API key: " -s ANTHROPIC_KEY
echo
if [ ! -z "$ANTHROPIC_KEY" ]; then
    aws ssm put-parameter --name "/humanizeai/ANTHROPIC_API_KEY" --value "$ANTHROPIC_KEY" --type "SecureString" --overwrite
    print_success "Anthropic API key stored"
fi

read -p "Enter your Perplexity API key (or press Enter to skip): " -s PERPLEXITY_KEY
echo
if [ ! -z "$PERPLEXITY_KEY" ]; then
    aws ssm put-parameter --name "/humanizeai/PERPLEXITY_API_KEY" --value "$PERPLEXITY_KEY" --type "SecureString" --overwrite
    print_success "Perplexity API key stored"
fi

read -p "Enter your OpenAI API key (or press Enter to skip): " -s OPENAI_KEY
echo
if [ ! -z "$OPENAI_KEY" ]; then
    aws ssm put-parameter --name "/humanizeai/OPENAI_API_KEY" --value "$OPENAI_KEY" --type "SecureString" --overwrite
    print_success "OpenAI API key stored"
fi

# Step 2: Install dependencies and build
print_status "Installing AWS deployment dependencies..."
cd aws
npm install

# Step 3: Build backend
print_status "Building backend..."
cd ../backend
npm install
npm run build
cd ../aws

# Step 4: Deploy backend to Lambda
print_status "Deploying backend to AWS Lambda..."
npx serverless deploy --stage prod

# Get the API Gateway URL
API_URL=$(npx serverless info --stage prod --verbose | grep "ServiceEndpoint:" | awk '{print $2}')
print_success "Backend deployed! API URL: $API_URL"

# Step 5: Create custom domain (if not exists)
print_status "Setting up custom domain..."
npx serverless create_domain --stage prod || print_warning "Domain might already exist"

# Step 6: Deploy frontend
print_status "Setting up frontend deployment..."
cd ../frontend

# Install Amplify CLI if not installed
if ! command -v amplify &> /dev/null; then
    print_status "Installing Amplify CLI..."
    npm install -g @aws-amplify/cli
fi

# Update API endpoint in frontend config
print_status "Updating frontend configuration..."
cat > src/config/api.ts << EOF
export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.nikola-apps.com'
    : 'http://localhost:3000',
  TIMEOUT: 30000,
  ENDPOINTS: {
    HEALTH: '/health',
    HUMANIZE: '/api/humanize',
    AUTH: '/api/auth'
  }
};
EOF

# Build frontend
print_status "Building frontend..."
npm install
npm run build

# Step 7: Initialize Amplify (if not already done)
if [ ! -f "amplify/.config/project-config.json" ]; then
    print_status "Initializing Amplify..."
    amplify init --yes \
        --name humanizeai \
        --envName prod \
        --defaultEditor vscode \
        --appType javascript \
        --framework react \
        --srcDir src \
        --distDir dist \
        --buildCommand "npm run build" \
        --startCommand "npm run dev"
fi

# Add hosting if not already added
if [ ! -d "amplify/backend/hosting" ]; then
    print_status "Adding Amplify hosting..."
    amplify add hosting --yes \
        --service CloudFrontAndS3 \
        --bucketName humanizeai-hosting-$(date +%s)
fi

# Step 8: Configure custom domain
print_status "Configuring custom domain..."
amplify add domain --yes \
    --domainName nikola-apps.com \
    --subdomainSettings '[{"subDomainName":"www","targetSubDomainName":"main"}]' || print_warning "Domain might already be configured"

# Step 9: Deploy frontend
print_status "Deploying frontend to Amplify..."
amplify publish --yes

print_success "🎉 Deployment completed!"
echo
echo "📱 Your app URLs:"
echo "   Frontend: https://www.nikola-apps.com"
echo "   API: https://api.nikola-apps.com"
echo "   AWS Console: https://console.aws.amazon.com/"
echo
echo "🔧 Next steps:"
echo "   1. Verify SSL certificates in Certificate Manager"
echo "   2. Check DNS propagation (may take 24-48 hours)"
echo "   3. Test your application"
echo "   4. Monitor CloudWatch logs for any issues"
echo
echo "💰 Estimated monthly cost: $5-15 for small usage"
echo "📊 Monitor usage in AWS Cost Explorer"

cd ..
