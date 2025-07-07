#!/bin/bash

# AWS CloudShell Deployment Script for HumanizeAI (WordsAPI only)
echo "🚀 Deploying HumanizeAI to AWS (Free Tier)"
echo "💰 Cost: $0.50/month (Route 53 only)"
echo ""

# Check AWS account info
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-1")
echo "✅ AWS Account: $AWS_ACCOUNT_ID"
echo "✅ AWS Region: $AWS_REGION"
echo ""

# Set region to us-east-1 for global services
aws configure set region us-east-1

echo "🔐 Setting up WordsAPI key in Parameter Store..."
echo ""

read -p "Enter your WordsAPI key: " -s WORDS_API_KEY
echo
if [ ! -z "$WORDS_API_KEY" ]; then
    aws ssm put-parameter --name "/humanizeai/WORDS_API_KEY" --value "$WORDS_API_KEY" --type "SecureString" --overwrite
    echo "✅ WordsAPI key stored securely"
else
    echo "❌ WordsAPI key is required for the app to work"
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building the application..."

# Create a simplified Lambda handler for WordsAPI
cat > lambda.js << 'EOF'
const AWS = require('aws-sdk');
const https = require('https');

const ssm = new AWS.SSM();

// Get API key from Parameter Store
async function getWordsAPIKey() {
  try {
    const result = await ssm.getParameter({
      Name: '/humanizeai/WORDS_API_KEY',
      WithDecryption: true
    }).promise();
    return result.Parameter.Value;
  } catch (error) {
    console.error('Error getting WordsAPI key:', error);
    return null;
  }
}

// Call WordsAPI
function callWordsAPI(word, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'wordsapiv1.p.rapidapi.com',
      path: `/words/${word}/synonyms`,
      method: 'GET',
      headers: {
        'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
        'X-RapidAPI-Key': apiKey
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Lambda handler
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Health check
  if (event.path === '/health' && event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'HumanizeAI WordsAPI Backend'
      })
    };
  }

  // Humanize endpoint
  if (event.path === '/api/humanize' && event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { text } = body;

      if (!text) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Text is required' })
        };
      }

      // Get WordsAPI key
      const apiKey = await getWordsAPIKey();
      if (!apiKey) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'WordsAPI key not configured' })
        };
      }

      // Simple word replacement logic
      const words = text.split(/\s+/);
      const processedWords = [];

      for (const word of words) {
        const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
        
        if (cleanWord.length > 3) {
          try {
            const synonymData = await callWordsAPI(cleanWord, apiKey);
            if (synonymData.synonyms && synonymData.synonyms.length > 0) {
              // Use first synonym
              const synonym = synonymData.synonyms[0];
              processedWords.push(word.replace(cleanWord, synonym));
            } else {
              processedWords.push(word);
            }
          } catch (error) {
            // If API call fails, keep original word
            processedWords.push(word);
          }
        } else {
          processedWords.push(word);
        }
      }

      const humanizedText = processedWords.join(' ');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          originalText: text,
          humanizedText: humanizedText,
          wordsProcessed: words.length,
          timestamp: new Date().toISOString()
        })
      };

    } catch (error) {
      console.error('Error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  // 404 for other routes
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Not found' })
  };
};
EOF

# Update serverless.yml for simpler deployment
cat > serverless.yml << 'EOF'
service: humanizeai-backend

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: prod
  memorySize: 128  # Free tier optimized
  timeout: 29      # Under 30s for free tier
  iamRoleStatements:
    - Effect: Allow
      Action:
        - ssm:GetParameter
      Resource: 
        - "arn:aws:ssm:us-east-1:*:parameter/humanizeai/*"

functions:
  api:
    handler: lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - http:
          path: /
          method: ANY
          cors: true

plugins:
  - serverless-domain-manager

custom:
  customDomain:
    domainName: api.nikola-apps.com
    basePath: ''
    stage: prod
    createRoute53Record: true
    endpointType: 'regional'
    securityPolicy: tls_1_2
    apiType: rest
EOF

echo ""
echo "🚀 Deploying to AWS Lambda..."
npx serverless deploy --verbose

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Backend deployed successfully!"
    
    # Get the API Gateway URL
    API_URL=$(npx serverless info --verbose | grep -o 'https://[^/]*\.execute-api[^/]*\.amazonaws\.com/prod')
    echo "🔌 API URL: $API_URL"
    
    echo ""
    echo "🧪 Testing the API..."
    curl -X GET "$API_URL/health"
    echo ""
    
    echo ""
    echo "🌐 Setting up custom domain..."
    npx serverless create_domain || echo "⚠️ Domain setup might need manual configuration"
    
    echo ""
    echo "🎉 DEPLOYMENT COMPLETED!"
    echo ""
    echo "================================"
    echo "📱 YOUR API:"
    echo "================================"
    echo "🔌 API URL: $API_URL"
    echo "🏥 Health Check: $API_URL/health"
    echo "🤖 Humanize: $API_URL/api/humanize"
    echo ""
    echo "💰 Cost: $0.50/month (Route 53 only)"
    echo "📊 Monitor: https://console.aws.amazon.com/billing/home#/freetier"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Test API: curl -X GET '$API_URL/health'"
    echo "2. Set up frontend hosting"
    echo "3. Configure custom domain in Route 53"
    
else
    echo "❌ Deployment failed"
    exit 1
fi
EOF
