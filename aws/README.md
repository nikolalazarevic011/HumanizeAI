# AWS Deployment Guide for HumanizeAI

## Prerequisites
- AWS Account with admin access
- AWS CLI installed and configured
- Domain: nikola-apps.com (already in Route 53)
- Node.js 18+ installed locally

## Architecture
- **Frontend**: AWS Amplify + CloudFront
- **Backend**: AWS Lambda + API Gateway
- **DNS**: Route 53 (already configured)
- **Secrets**: AWS Systems Manager Parameter Store
- **Monitoring**: CloudWatch

## Step-by-Step Deployment

### Step 1: Install AWS CLI and Configure
```bash
# Install AWS CLI (if not already installed)
# Download from: https://aws.amazon.com/cli/

# Configure AWS CLI
aws configure
# Enter your Access Key ID
# Enter your Secret Access Key
# Default region: us-east-1 (recommended for CloudFront)
# Default output format: json
```

### Step 2: Set Up Environment Variables in AWS
```bash
# Store API keys securely in AWS Parameter Store
aws ssm put-parameter --name "/humanizeai/ANTHROPIC_API_KEY" --value "your_key_here" --type "SecureString"
aws ssm put-parameter --name "/humanizeai/PERPLEXITY_API_KEY" --value "your_key_here" --type "SecureString"
aws ssm put-parameter --name "/humanizeai/OPENAI_API_KEY" --value "your_key_here" --type "SecureString"
aws ssm put-parameter --name "/humanizeai/GOOGLE_API_KEY" --value "your_key_here" --type "SecureString"
# Add other API keys as needed
```

### Step 3: Deploy Backend to AWS Lambda

#### 3.1: Install Serverless Framework
```bash
npm install -g serverless
npm install -g serverless-webpack serverless-offline
```

#### 3.2: Deploy Backend
```bash
cd aws
serverless deploy --stage prod
```

### Step 4: Deploy Frontend to AWS Amplify

#### 4.1: Install Amplify CLI
```bash
npm install -g @aws-amplify/cli
amplify configure
```

#### 4.2: Initialize Amplify
```bash
cd ../frontend
amplify init
# Choose:
# - Project name: humanizeai
# - Environment: prod
# - Default editor: Visual Studio Code
# - App type: javascript
# - Framework: react
# - Source directory: src
# - Build directory: dist
# - Build command: npm run build
# - Start command: npm run dev
```

#### 4.3: Add Hosting
```bash
amplify add hosting
# Choose: Amazon CloudFront and S3
# Select the bucket name: humanizeai-hosting
```

#### 4.4: Configure Custom Domain
```bash
amplify add domain
# Domain name: nikola-apps.com
# Subdomain: www (optional)
```

#### 4.5: Deploy Frontend
```bash
amplify publish
```

### Step 5: Configure Route 53 for Custom Domain

1. **Go to Route 53 Console**
2. **Select your hosted zone**: `nikola-apps.com`
3. **Create A record**:
   - Name: `www` (or leave blank for root domain)
   - Type: `A`
   - Alias: `Yes`
   - Alias Target: Select your CloudFront distribution
4. **Create CNAME for API**:
   - Name: `api`
   - Type: `CNAME` 
   - Value: Your API Gateway URL

### Step 6: SSL Certificate Setup

AWS Amplify automatically provisions SSL certificates, but verify:

1. **Go to Certificate Manager**
2. **Check certificate status** for `nikola-apps.com`
3. **If not auto-created**, request a new certificate:
   - Domain: `*.nikola-apps.com` and `nikola-apps.com`
   - Validation: DNS validation
   - Add CNAME records to Route 53 as shown

### Step 7: Update Frontend Configuration

Update your frontend API endpoint to use the custom domain:
```javascript
// In your frontend config
const API_BASE_URL = 'https://api.nikola-apps.com'
```

### Step 8: Monitor and Test

1. **Visit**: `https://www.nikola-apps.com`
2. **Test API**: `https://api.nikola-apps.com/health`
3. **Check CloudWatch logs** for any issues

## Environment URLs
- **Frontend**: https://www.nikola-apps.com
- **API**: https://api.nikola-apps.com
- **Admin**: AWS Console

## Cost Optimization
- **Amplify**: ~$1-5/month for small apps
- **Lambda**: Pay per request (very cheap for small usage)
- **API Gateway**: ~$3.50 per million requests
- **Route 53**: $0.50 per hosted zone per month
- **CloudFront**: Free tier covers most small apps

## Troubleshooting

### Common Issues:
1. **Certificate pending**: DNS validation can take 30 minutes
2. **Domain not resolving**: DNS propagation takes 24-48 hours
3. **API CORS errors**: Check CORS configuration in serverless.yml
4. **Lambda timeout**: Increase timeout in serverless.yml

### Getting Help:
- Check CloudWatch logs
- Use AWS Support (if you have a support plan)
- AWS documentation: https://docs.aws.amazon.com/

## Security Best Practices
- ✅ API keys stored in Parameter Store (encrypted)
- ✅ HTTPS enforced everywhere
- ✅ CORS properly configured
- ✅ Rate limiting on API Gateway
- ✅ CloudFront for DDoS protection

## Scaling
- **Lambda**: Automatically scales to handle traffic
- **CloudFront**: Global CDN for fast loading
- **API Gateway**: Handles high request volumes
- **Amplify**: Automatically scales frontend hosting
