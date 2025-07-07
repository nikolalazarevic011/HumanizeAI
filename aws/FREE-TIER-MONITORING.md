# AWS Free Tier Monitoring Dashboard

## 🆓 Free Tier Usage Monitoring

### Quick Links:
- **Free Tier Dashboard**: https://console.aws.amazon.com/billing/home#/freetier
- **CloudWatch Dashboard**: https://console.aws.amazon.com/cloudwatch/
- **Cost Explorer**: https://console.aws.amazon.com/cost-management/home

## Key Metrics to Monitor (All Free)

### 1. Lambda Function Metrics
- **Invocations**: Stay under 1M/month
- **Duration**: Monitor total compute time
- **Errors**: Track error rates
- **Memory Usage**: Optimize to stay efficient

### 2. API Gateway Metrics  
- **Requests**: Stay under 1M/month
- **Latency**: Monitor response times
- **4XX/5XX Errors**: Track error rates
- **Cache Hit Ratio**: Optimize for performance

### 3. S3 Storage Metrics
- **Storage Size**: Stay under 5GB
- **GET Requests**: Stay under 20,000/month
- **PUT Requests**: Stay under 2,000/month

### 4. CloudFront CDN Metrics
- **Data Transfer**: Stay under 1TB/month
- **Requests**: Stay under 10M/month
- **Origin Requests**: Monitor cache efficiency

## Free Tier Alerts Setup

### Billing Alerts (Free):
1. Go to CloudWatch → Billing
2. Create alarm for "EstimatedCharges"
3. Set threshold: $1.00 (safety buffer)
4. Add email notification

### Usage Alerts (Free):
1. Lambda invocations > 800,000 (80% of limit)
2. API Gateway requests > 800,000 (80% of limit)
3. S3 storage > 4GB (80% of limit)
4. CloudFront transfer > 800GB (80% of limit)

## Free Tier Optimization Tips

### Lambda Optimization:
```yaml
# In serverless.yml
memorySize: 128        # Minimum memory (cheapest)
timeout: 29           # Under 30s threshold  
runtime: nodejs18.x   # Latest runtime
```

### API Gateway Optimization:
- Enable response compression
- Use caching when possible (reduces Lambda calls)
- Implement request validation

### S3 Optimization:
- Enable gzip compression
- Use appropriate content types
- Set cache headers

### CloudFront Optimization:
- Configure proper TTL values
- Use compression
- Optimize cache behaviors

## Monthly Usage Estimates

### Small App (100 daily users):
- **Lambda**: ~3,000 invocations (0.3% of limit)
- **API Gateway**: ~3,000 requests (0.3% of limit)
- **S3**: ~50MB storage (1% of limit)
- **CloudFront**: ~10GB transfer (1% of limit)

### Medium App (1,000 daily users):
- **Lambda**: ~30,000 invocations (3% of limit)
- **API Gateway**: ~30,000 requests (3% of limit)
- **S3**: ~200MB storage (4% of limit)
- **CloudFront**: ~100GB transfer (10% of limit)

### Large App (10,000 daily users):
- **Lambda**: ~300,000 invocations (30% of limit)
- **API Gateway**: ~300,000 requests (30% of limit)
- **S3**: ~1GB storage (20% of limit)
- **CloudFront**: ~500GB transfer (50% of limit)

## Cost Breakdown (After Free Tier)

If you exceed free tier limits:

### Lambda Overage:
- $0.20 per 1M additional requests
- $0.0000166667 per GB-second

### API Gateway Overage:
- $3.50 per 1M additional requests
- $0.09 per GB data transfer

### S3 Overage:
- $0.023 per GB per month (storage)
- $0.0004 per 1,000 GET requests
- $0.005 per 1,000 PUT requests

### CloudFront Overage:
- $0.085 per GB (first 10TB)
- $0.0075 per 10,000 HTTPS requests

## Scaling Strategy

### When approaching limits:
1. **Optimize code** (reduce execution time)
2. **Implement caching** (reduce API calls)
3. **Compress assets** (reduce data transfer)
4. **Consider paid tier** (still very cheap)

### Growth path:
- Free tier → $5-10/month → $20-50/month (for significant traffic)

## Monitoring Commands

### Check current usage:
```bash
# Lambda invocations this month
aws logs describe-metric-filters --log-group-name "/aws/lambda/humanizeai-backend-prod-api"

# API Gateway requests
aws apigateway get-usage --usage-plan-id YOUR_PLAN_ID --key-id YOUR_KEY_ID

# S3 storage
aws s3 ls s3://your-bucket-name --recursive --human-readable --summarize
```

### Set up monitoring script:
```bash
#!/bin/bash
echo "Free Tier Usage Check:"
echo "1. Lambda: $(aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Invocations --start-time $(date -d '1 month ago' -u +%Y-%m-%dT%H:%M:%S) --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 86400 --statistics Sum --dimensions Name=FunctionName,Value=humanizeai-backend-prod-api --query 'Datapoints[*].Sum' --output text | awk '{sum+=$1} END {print sum}')"
echo "2. Check AWS Console for detailed breakdown"
```

Your app is optimized to stay well within free tier limits! 🎉
