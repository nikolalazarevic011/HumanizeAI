@echo off
setlocal enabledelayedexpansion

REM AWS Deployment Script for HumanizeAI (Windows)
echo 🚀 Deploying HumanizeAI to AWS...

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check AWS CLI
aws --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] AWS CLI not found. Please install it first.
    pause
    exit /b 1
)

REM Check if AWS is configured
aws sts get-caller-identity >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] AWS CLI not configured. Run 'aws configure' first.
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 18+.
    pause
    exit /b 1
)

echo [SUCCESS] Prerequisites check passed!

REM Get AWS account info
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set AWS_ACCOUNT_ID=%%i
echo [INFO] AWS Account: %AWS_ACCOUNT_ID%

REM Step 1: Store API keys in Parameter Store
echo [INFO] Setting up API keys in AWS Parameter Store...

set /p ANTHROPIC_KEY="Enter your Anthropic API key: "
if not "%ANTHROPIC_KEY%"=="" (
    aws ssm put-parameter --name "/humanizeai/ANTHROPIC_API_KEY" --value "%ANTHROPIC_KEY%" --type "SecureString" --overwrite
    echo [SUCCESS] Anthropic API key stored
)

set /p PERPLEXITY_KEY="Enter your Perplexity API key (or press Enter to skip): "
if not "%PERPLEXITY_KEY%"=="" (
    aws ssm put-parameter --name "/humanizeai/PERPLEXITY_API_KEY" --value "%PERPLEXITY_KEY%" --type "SecureString" --overwrite
    echo [SUCCESS] Perplexity API key stored
)

set /p OPENAI_KEY="Enter your OpenAI API key (or press Enter to skip): "
if not "%OPENAI_KEY%"=="" (
    aws ssm put-parameter --name "/humanizeai/OPENAI_API_KEY" --value "%OPENAI_KEY%" --type "SecureString" --overwrite
    echo [SUCCESS] OpenAI API key stored
)

REM Step 2: Install dependencies and build
echo [INFO] Installing AWS deployment dependencies...
cd aws
call npm install

REM Step 3: Build backend
echo [INFO] Building backend...
cd ..\backend
call npm install
call npm run build
cd ..\aws

REM Step 4: Deploy backend to Lambda
echo [INFO] Deploying backend to AWS Lambda...
call npx serverless deploy --stage prod

echo [SUCCESS] Backend deployed!

REM Step 5: Create custom domain
echo [INFO] Setting up custom domain...
call npx serverless create_domain --stage prod

REM Step 6: Deploy frontend
echo [INFO] Setting up frontend deployment...
cd ..\frontend

REM Install Amplify CLI if not installed
amplify --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing Amplify CLI...
    call npm install -g @aws-amplify/cli
)

REM Build frontend
echo [INFO] Building frontend...
call npm install
call npm run build

REM Initialize Amplify if needed
if not exist "amplify\.config\project-config.json" (
    echo [INFO] Initializing Amplify...
    echo Please follow the Amplify setup prompts...
    call amplify init
)

REM Add hosting if not already added
if not exist "amplify\backend\hosting" (
    echo [INFO] Adding Amplify hosting...
    call amplify add hosting
)

REM Deploy frontend
echo [INFO] Deploying frontend to Amplify...
call amplify publish

echo.
echo 🎉 Deployment completed!
echo.
echo 📱 Your app URLs:
echo    Frontend: https://www.nikola-apps.com
echo    API: https://api.nikola-apps.com
echo    AWS Console: https://console.aws.amazon.com/
echo.
echo 🔧 Next steps:
echo    1. Verify SSL certificates in Certificate Manager
echo    2. Check DNS propagation (may take 24-48 hours)
echo    3. Test your application
echo    4. Monitor CloudWatch logs for any issues
echo.
echo 💰 Estimated monthly cost: $5-15 for small usage

cd ..
pause
