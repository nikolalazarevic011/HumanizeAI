# 🚀 Quick AWS Deployment Guide for HumanizeAI (FREE TIER ONLY)

## Overview
Your app will be deployed using **AWS Free Tier** services only:
- **Domain**: www.nikola-apps.com (frontend)
- **API**: api.nikola-apps.com (backend)
- **SSL**: Automatic HTTPS certificates
- **Cost**: **$0.50/month** (only Route 53 hosted zone - unavoidable)

## AWS Free Tier Services Used 🆓

### ✅ Always Free:
- **Lambda**: 1M requests/month + 400,000 GB-seconds compute
- **API Gateway**: 1M API calls/month
- **CloudFront**: 1TB data transfer + 10M requests/month
- **Certificate Manager**: Free SSL certificates
- **S3**: 5GB storage + 20,000 GET requests + 2,000 PUT requests
- **CloudWatch**: 10 custom metrics + 5GB log ingestion

### 💰 Minimal Cost:
- **Route 53**: $0.50/month per hosted zone (unavoidable for custom domain)
- **Amplify**: Free tier: 1,000 build minutes + 5GB storage + 15GB transfer

**Total Monthly Cost: ~$0.50** (just the domain hosting)

## Prerequisites ✅

1. **AWS Account** with admin access
2. **AWS CLI** installed and configured
3. **Domain** nikola-apps.com in Route 53 (✅ You have this)
4. **Node.js 18+** installed

## Step 1: Install AWS CLI (if needed)

### Windows:
Download and install from: https://aws.amazon.com/cli/

### Configure AWS CLI:
```bash
aws configure
```
Enter:
- Access Key ID: (from AWS IAM)
- Secret Access Key: (from AWS IAM) 
- Default region: `us-east-1`
- Default output format: `json`

## Step 2: One-Click Deployment

### Option A: Windows (Easy)
Double-click: `aws/deploy-free.bat`

### Option B: Manual Commands
```bash
cd "C:\Nikola\ME\proj\HumanizeAi\aws"
./deploy-free.bat
```

## Step 3: What the Script Does

1. **Stores API keys** securely in AWS Parameter Store (free)
2. **Deploys backend** to Lambda (free tier: 1M requests/month)
3. **Creates API Gateway** (free tier: 1M calls/month)
4. **Sets up CloudFront CDN** (free tier: 1TB transfer/month)
5. **Configures SSL certificates** (completely free)
6. **Deploys frontend** to S3 + CloudFront (free tier: 5GB storage)
7. **Configures Route 53** DNS (only $0.50/month cost)

## Step 4: Monitor Free Tier Usage

### AWS Free Tier Dashboard:
1. Go to: https://console.aws.amazon.com/billing/home#/freetier
2. Monitor your usage to stay within limits

### Key Limits to Watch:
- **Lambda**: 1M requests/month (very generous)
- **API Gateway**: 1M calls/month
- **S3**: 5GB storage (plenty for static files)
- **CloudFront**: 1TB transfer/month (very generous)

## Step 5: Expected Usage for Small App

For a typical small app with ~100 daily users:
- **Lambda requests**: ~3,000/month (well under 1M limit)
- **API Gateway calls**: ~3,000/month (well under 1M limit)
- **S3 storage**: ~50MB (well under 5GB limit)
- **CloudFront transfer**: ~10GB/month (well under 1TB limit)

**Result**: $0.50/month total cost! 🎉

## Architecture (Free Tier Optimized)

```
Internet → Route 53 ($0.50/month) 
    ↓
CloudFront CDN (Free: 1TB/month)
    ↓
S3 Static Hosting (Free: 5GB)
    ↓
API Gateway (Free: 1M calls/month)
    ↓
Lambda Function (Free: 1M requests/month)
    ↓
Parameter Store (Free: 10,000 params)
```

## Free Tier Optimization Tips

### 1. Lambda Optimization:
- Use efficient code (your app is already optimized)
- Enable X-Ray tracing (free tier: 100,000 traces/month)

### 2. API Gateway Optimization:
- Cache responses when possible (reduces Lambda calls)
- Use compression

### 3. S3 Optimization:
- Enable compression for static files
- Use CloudFront for global distribution

### 4. Monitoring (Free):
- CloudWatch logs (5GB/month free)
- Basic metrics and alarms

## Scaling Within Free Tier

Your free tier limits can handle:
- **Up to 30,000 daily users** (with typical usage patterns)
- **Up to 1M API requests per month**
- **Static files up to 5GB total**
- **1TB monthly data transfer**

## What Happens After Free Tier?

If you exceed free tier limits, costs are very low:
- **Lambda**: $0.20 per 1M additional requests
- **API Gateway**: $3.50 per 1M additional requests
- **S3**: $0.023 per GB per month
- **CloudFront**: $0.085 per GB transfer

## Deployment URLs

After deployment:
- **Frontend**: https://www.nikola-apps.com
- **API**: https://api.nikola-apps.com
- **AWS Console**: https://console.aws.amazon.com/

## Troubleshooting

### If you get billing alerts:
1. Check Free Tier Dashboard
2. Most likely cause: Route 53 hosted zone ($0.50/month)
3. All other services should be free for small usage

### Performance:
- Lambda cold starts: ~1-2 seconds (normal for free tier)
- CloudFront global CDN: Fast worldwide
- S3 static hosting: Very fast

## Next Steps After Deployment

1. **Test your app**: Visit https://www.nikola-apps.com
2. **Monitor usage**: Check Free Tier Dashboard weekly
3. **Optimize**: Use CloudWatch to identify bottlenecks
4. **Scale**: You can handle significant traffic on free tier

## Security (All Free)

- ✅ HTTPS everywhere (free SSL certificates)
- ✅ API keys encrypted in Parameter Store
- ✅ CloudFront DDoS protection
- ✅ IAM security policies
- ✅ VPC isolation for Lambda

**Your app is production-ready and secure on the free tier!** 🔒
