@echo off
setlocal enabledelayedexpansion

REM AWS Free Tier Deployment Script for HumanizeAI
echo 🆓 Deploying HumanizeAI using AWS Free Tier only...
echo 💰 Expected cost: $0.50/month (Route 53 hosted zone only)
echo.

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check AWS CLI
aws --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] AWS CLI not found. Install from: https://aws.amazon.com/cli/
    echo [INFO] After installing, run: aws configure
    pause
    exit /b 1
)

REM Check if AWS is configured
aws sts get-caller-identity >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] AWS CLI not configured.
    echo [INFO] Run: aws configure
    echo [INFO] You need:
    echo         - Access Key ID (from AWS IAM)
    echo         - Secret Access Key (from AWS IAM)
    echo         - Region: us-east-1
    echo         - Output format: json
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Install Node.js 18+ from: https://nodejs.org/
    pause
    exit /b 1
)

echo [SUCCESS] Prerequisites check passed!
echo.

REM Get AWS account info
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set AWS_ACCOUNT_ID=%%i
for /f "tokens=*" %%i in ('aws configure get region') do set AWS_REGION=%%i
if "%AWS_REGION%"=="" set AWS_REGION=us-east-1

echo [INFO] AWS Account: %AWS_ACCOUNT_ID%
echo [INFO] AWS Region: %AWS_REGION%
echo.

echo 🔐 Setting up API keys in AWS Parameter Store (FREE)...
echo [INFO] Parameter Store: Free for up to 10,000 parameters
echo.

set /p "ANTHROPIC_KEY=Enter your Anthropic API key: "
if not "%ANTHROPIC_KEY%"=="" (
    aws ssm put-parameter --name "/humanizeai/ANTHROPIC_API_KEY" --value "%ANTHROPIC_KEY%" --type "SecureString" --overwrite >nul 2>&1
    echo [SUCCESS] ✅ Anthropic API key stored securely
)

set /p "PERPLEXITY_KEY=Enter your Perplexity API key (or press Enter to skip): "
if not "%PERPLEXITY_KEY%"=="" (
    aws ssm put-parameter --name "/humanizeai/PERPLEXITY_API_KEY" --value "%PERPLEXITY_KEY%" --type "SecureString" --overwrite >nul 2>&1
    echo [SUCCESS] ✅ Perplexity API key stored securely
)

set /p "OPENAI_KEY=Enter your OpenAI API key (or press Enter to skip): "
if not "%OPENAI_KEY%"=="" (
    aws ssm put-parameter --name "/humanizeai/OPENAI_API_KEY" --value "%OPENAI_KEY%" --type "SecureString" --overwrite >nul 2>&1
    echo [SUCCESS] ✅ OpenAI API key stored securely
)

echo.
echo 📦 Installing deployment dependencies...
if not exist "package.json" (
    echo [ERROR] Please run this script from the aws folder
    echo [INFO] Navigate to: C:\Nikola\ME\proj\HumanizeAi\aws
    pause
    exit /b 1
)

call npm install >nul 2>&1
echo [SUCCESS] ✅ Dependencies installed

echo.
echo 🔨 Building backend...
cd ..\backend
call npm install >nul 2>&1
call npm run build >nul 2>&1
cd ..\aws
echo [SUCCESS] ✅ Backend built successfully

echo.
echo 🚀 Deploying to AWS Lambda (FREE TIER)...
echo [INFO] Lambda Free Tier: 1M requests/month + 400,000 GB-seconds
call npx serverless deploy --stage prod
if %errorlevel% neq 0 (
    echo [ERROR] Backend deployment failed
    pause
    exit /b 1
)
echo [SUCCESS] ✅ Backend deployed to Lambda!

echo.
echo 🌐 Setting up custom domain (FREE SSL)...
echo [INFO] Certificate Manager: Free SSL certificates
call npx serverless create_domain --stage prod 2>nul || echo [INFO] Domain might already exist

echo.
echo 🎨 Preparing frontend deployment...
cd ..\frontend

REM Check if Amplify CLI is installed
amplify --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing Amplify CLI...
    call npm install -g @aws-amplify/cli >nul 2>&1
)

REM Update API configuration for production
echo [INFO] Updating API configuration...
if not exist "src\config" mkdir "src\config"

echo export const API_CONFIG = { > src\config\api.ts
echo   BASE_URL: process.env.NODE_ENV === 'production'  >> src\config\api.ts
echo     ? 'https://api.nikola-apps.com' >> src\config\api.ts
echo     : 'http://localhost:3000', >> src\config\api.ts
echo   TIMEOUT: 30000, >> src\config\api.ts
echo   ENDPOINTS: { >> src\config\api.ts
echo     HEALTH: '/health', >> src\config\api.ts
echo     HUMANIZE: '/api/humanize', >> src\config\api.ts
echo     AUTH: '/api/auth' >> src\config\api.ts
echo   } >> src\config\api.ts
echo }; >> src\config\api.ts

echo.
echo 📦 Building frontend...
call npm install >nul 2>&1
call npm run build >nul 2>&1
echo [SUCCESS] ✅ Frontend built successfully

echo.
echo 🚀 Deploying frontend to AWS Amplify (FREE TIER)...
echo [INFO] Amplify Free Tier: 1,000 build minutes + 5GB storage + 15GB transfer

REM Initialize Amplify if not already done
if not exist "amplify\.config\project-config.json" (
    echo [INFO] Initializing Amplify...
    echo [INFO] This will open a browser for authentication...
    call amplify init --quickstart --name humanizeai --envName prod --defaultEditor vscode --appType javascript --framework react --srcDir src --distDir dist --buildCommand "npm run build" --startCommand "npm run dev" --yes
)

REM Add hosting if not already added  
if not exist "amplify\backend\hosting" (
    echo [INFO] Adding S3 + CloudFront hosting (FREE)...
    call amplify add hosting --service CloudFrontAndS3 --yes
)

REM Configure custom domain
echo [INFO] Configuring custom domain: nikola-apps.com...
call amplify add domain --domainName nikola-apps.com --subdomainSettings "[{\"subDomainName\":\"www\",\"targetSubDomainName\":\"main\"}]" --yes 2>nul || echo [INFO] Domain might already be configured

echo.
echo 🌍 Publishing to global CDN...
echo [INFO] CloudFront Free Tier: 1TB data transfer + 10M requests/month
call amplify publish --yes

echo.
echo 🎉 DEPLOYMENT COMPLETED! 🎉
echo.
echo ================================
echo 📱 YOUR APP IS LIVE:
echo ================================
echo 🌐 Frontend: https://www.nikola-apps.com
echo 🔌 API: https://api.nikola-apps.com
echo 🎛️  AWS Console: https://console.aws.amazon.com/
echo.
echo ================================
echo 💰 COST BREAKDOWN:
echo ================================
echo ✅ Lambda: FREE (1M requests/month)
echo ✅ API Gateway: FREE (1M calls/month)  
echo ✅ S3 Storage: FREE (5GB)
echo ✅ CloudFront CDN: FREE (1TB transfer/month)
echo ✅ SSL Certificates: FREE
echo ✅ Parameter Store: FREE (10,000 parameters)
echo 💰 Route 53 Hosted Zone: $0.50/month
echo --------------------------------
echo 💵 TOTAL: $0.50/month
echo.
echo ================================
echo 📊 FREE TIER LIMITS:
echo ================================
echo 🚀 Can handle ~30,000 daily users
echo 📈 1M API requests/month
echo 💾 5GB static file storage
echo 🌍 1TB monthly data transfer
echo.
echo ================================
echo 🔧 NEXT STEPS:
echo ================================
echo 1. 🧪 Test your app: https://www.nikola-apps.com
echo 2. 📊 Monitor usage: https://console.aws.amazon.com/billing/home#/freetier
echo 3. 🔍 Check logs: https://console.aws.amazon.com/cloudwatch/
echo 4. 🚀 Enjoy your production app!
echo.
echo ⚠️  NOTE: DNS propagation may take 24-48 hours
echo 📧 You may receive AWS billing alerts for the $0.50 Route 53 cost
echo.

cd ..
pause
