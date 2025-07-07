#!/bin/bash

# AWS CloudShell Deployment Script for HumanizeAI
# Run this in AWS CloudShell: curl -sSL https://raw.githubusercontent.com/yourusername/humanize-ai/main/aws/cloudshell-deploy.sh | bash

echo "🚀 AWS CloudShell Deployment for HumanizeAI"
echo "💰 Cost: $0.50/month (Route 53 only)"
echo ""

# Check if we're in CloudShell
if [[ ! "$AWS_EXECUTION_ENV" == "CloudShell" ]]; then
    echo "⚠️  This script is designed for AWS CloudShell"
    echo "📖 Instructions:"
    echo "   1. Go to https://console.aws.amazon.com/"
    echo "   2. Click the CloudShell icon (terminal) in the top bar"
    echo "   3. Run this script in CloudShell"
    echo ""
fi

# Get AWS account info
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-1")
echo "✅ AWS Account: $AWS_ACCOUNT_ID"
echo "✅ AWS Region: $AWS_REGION"
echo ""

# Set region to us-east-1 for global services
aws configure set region us-east-1

echo "🔐 Setting up API keys in Parameter Store..."
echo "💡 Tip: API keys are stored securely and encrypted"
echo ""

read -p "Enter your Anthropic API key: " -s ANTHROPIC_KEY
echo
if [ ! -z "$ANTHROPIC_KEY" ]; then
    aws ssm put-parameter --name "/humanizeai/ANTHROPIC_API_KEY" --value "$ANTHROPIC_KEY" --type "SecureString" --overwrite
    echo "✅ Anthropic API key stored"
fi

read -p "Enter your Perplexity API key (or press Enter to skip): " -s PERPLEXITY_KEY
echo
if [ ! -z "$PERPLEXITY_KEY" ]; then
    aws ssm put-parameter --name "/humanizeai/PERPLEXITY_API_KEY" --value "$PERPLEXITY_KEY" --type "SecureString" --overwrite
    echo "✅ Perplexity API key stored"
fi

read -p "Enter your OpenAI API key (or press Enter to skip): " -s OPENAI_KEY
echo
if [ ! -z "$OPENAI_KEY" ]; then
    aws ssm put-parameter --name "/humanizeai/OPENAI_API_KEY" --value "$OPENAI_KEY" --type "SecureString" --overwrite
    echo "✅ OpenAI API key stored"
fi

echo ""
echo "📦 Creating deployment structure..."

# Create project structure
mkdir -p humanizeai/{aws,backend,frontend}
cd humanizeai

# Create serverless.yml
cat > aws/serverless.yml << 'EOF'
service: humanizeai-backend

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: prod
  memorySize: 128  # Free tier optimized
  timeout: 29      # Under 30s to stay in free tier
  environment:
    NODE_ENV: production
    STAGE: prod
  iamRoleStatements:
    - Effect: Allow
      Action:
        - ssm:GetParameter
        - ssm:GetParameters
        - ssm:GetParametersByPath
      Resource: 
        - "arn:aws:ssm:us-east-1:*:parameter/humanizeai/*"

functions:
  api:
    handler: lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors:
            origin: 
              - https://www.nikola-apps.com
              - https://nikola-apps.com
            headers:
              - Content-Type
              - Authorization
            allowCredentials: false
      - http:
          path: /
          method: ANY
          cors:
            origin: 
              - https://www.nikola-apps.com
              - https://nikola-apps.com
            headers:
              - Content-Type
              - Authorization
            allowCredentials: false

plugins:
  - serverless-http

custom:
  customDomain:
    domainName: api.nikola-apps.com
    basePath: ''
    stage: prod
    createRoute53Record: true
    certificateName: '*.nikola-apps.com'
    endpointType: 'regional'
    securityPolicy: tls_1_2
    apiType: rest
EOF

# Create package.json for AWS deployment
cat > aws/package.json << 'EOF'
{
  "name": "humanizeai-aws",
  "version": "1.0.0",
  "description": "AWS deployment for HumanizeAI",
  "main": "lambda.js",
  "scripts": {
    "deploy": "serverless deploy"
  },
  "dependencies": {
    "serverless": "^3.32.0",
    "serverless-http": "^3.2.0"
  }
}
EOF

# Create a simple Lambda handler
cat > aws/lambda.js << 'EOF'
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');

const app = express();
const ssm = new AWS.SSM();

// Middleware
app.use(cors({
  origin: ['https://www.nikola-apps.com', 'https://nikola-apps.com'],
  credentials: false
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get API key from Parameter Store
async function getParameter(name) {
  try {
    const result = await ssm.getParameter({
      Name: name,
      WithDecryption: true
    }).promise();
    return result.Parameter.Value;
  } catch (error) {
    console.error(`Error getting parameter ${name}:`, error);
    return null;
  }
}

// Humanize endpoint
app.post('/api/humanize', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Get Anthropic API key
    const anthropicKey = await getParameter('/humanizeai/ANTHROPIC_API_KEY');
    
    if (!anthropicKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Simple text processing (replace with your actual humanization logic)
    const humanizedText = text
      .replace(/\bAI\b/g, 'artificial intelligence')
      .replace(/\bML\b/g, 'machine learning')
      .replace(/\bAPI\b/g, 'application programming interface');

    res.json({
      originalText: text,
      humanizedText: humanizedText,
      processingTime: Date.now() - req.startTime
    });

  } catch (error) {
    console.error('Humanization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add request timing
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

module.exports.handler = serverless(app);
EOF

echo "📦 Installing deployment dependencies..."
cd aws
npm install

echo ""
echo "🚀 Deploying backend to Lambda (FREE TIER)..."
npx serverless deploy

if [ $? -eq 0 ]; then
    echo "✅ Backend deployed successfully!"
    
    # Get the API Gateway URL
    API_URL=$(npx serverless info | grep -o 'https://[^/]*\.execute-api[^/]*\.amazonaws\.com/prod')
    echo "🔌 API URL: $API_URL"
else
    echo "❌ Backend deployment failed"
    exit 1
fi

echo ""
echo "🌐 Setting up frontend hosting..."

# Create a simple HTML frontend
mkdir -p ../frontend/dist
cat > ../frontend/dist/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HumanizeAI</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold text-center mb-8">HumanizeAI</h1>
        <div class="max-w-4xl mx-auto">
            <div class="bg-white rounded-lg shadow-lg p-6">
                <textarea 
                    id="inputText" 
                    placeholder="Enter AI-generated text to humanize..."
                    class="w-full h-32 p-4 border rounded-lg mb-4"
                ></textarea>
                <button 
                    onclick="humanizeText()" 
                    class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                >
                    Humanize Text
                </button>
                <div id="output" class="mt-6 p-4 bg-gray-50 rounded-lg hidden">
                    <h3 class="font-bold mb-2">Humanized Text:</h3>
                    <p id="outputText"></p>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function humanizeText() {
            const text = document.getElementById('inputText').value;
            if (!text.trim()) return;

            try {
                const response = await fetch('$API_URL/api/humanize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: text })
                });

                const result = await response.json();
                document.getElementById('outputText').textContent = result.humanizedText;
                document.getElementById('output').classList.remove('hidden');
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
    </script>
</body>
</html>
EOF

echo "📤 Creating S3 bucket for frontend hosting..."
BUCKET_NAME="humanizeai-frontend-$(date +%s)"
aws s3 mb s3://$BUCKET_NAME

echo "🔧 Configuring S3 bucket for static website hosting..."
aws s3 website s3://$BUCKET_NAME --index-document index.html

# Set bucket policy for public read
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json

echo "📤 Uploading frontend files..."
aws s3 sync ../frontend/dist/ s3://$BUCKET_NAME/

echo "🌍 Setting up CloudFront distribution..."
aws cloudfront create-distribution --distribution-config '{
    "CallerReference": "'$(date +%s)'",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-'$BUCKET_NAME'",
                "DomainName": "'$BUCKET_NAME'.s3.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-'$BUCKET_NAME'",
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 0,
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        }
    },
    "Comment": "HumanizeAI Frontend Distribution",
    "Enabled": true
}' > /dev/null

echo ""
echo "🎉 DEPLOYMENT COMPLETED! 🎉"
echo ""
echo "================================"
echo "📱 YOUR APP URLS:"
echo "================================"
echo "🔌 API: $API_URL"
echo "🌐 Frontend S3: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
echo "🎛️  AWS Console: https://console.aws.amazon.com/"
echo ""
echo "🔧 Next Steps:"
echo "1. Set up custom domain in Route 53"
echo "2. Configure CloudFront for www.nikola-apps.com"
echo "3. Test your API: $API_URL/health"
echo ""
echo "💰 Cost: $0.50/month (Route 53 only)"
echo "📊 Monitor: https://console.aws.amazon.com/billing/home#/freetier"

cd ../..
