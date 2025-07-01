# API Specifications

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://api.humanizeai.com/api`

## Authentication
Currently, the API does not require authentication for public endpoints. Rate limiting is applied based on IP address.

## Rate Limiting
- Free tier: 100 requests per hour per IP
- Premium tier: 1000 requests per hour per API key

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2025-07-01T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": []
  },
  "timestamp": "2025-07-01T12:00:00.000Z"
}
```

## Endpoints

### 1. Health Check
**GET** `/health`

Check API health status.

#### Response
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 3600
  }
}
```

### 2. Humanize Text
**POST** `/humanize`

Transform AI-generated text into human-like content.

#### Request Body
```json
{
  "text": "string (required, 50-5000 characters)",
  "style": "academic | casual | professional | creative (optional, default: casual)",
  "intensity": "subtle | moderate | aggressive (optional, default: moderate)",
  "preserveFormatting": "boolean (optional, default: false)"
}
```

#### Request Validation
- `text`: Required, minimum 50 characters, maximum 5000 characters
- `style`: Optional, must be one of the predefined styles
- `intensity`: Optional, must be one of the predefined intensities
- `preserveFormatting`: Optional boolean

#### Response
```json
{
  "success": true,
  "data": {
    "originalText": "Original AI-generated text...",
    "humanizedText": "Humanized version of the text...",
    "style": "casual",
    "intensity": "moderate",
    "processingTime": 2.5,
    "statistics": {
      "originalWordCount": 150,
      "humanizedWordCount": 155,
      "changesCount": 12,
      "readabilityScore": 8.2
    }
  }
}
```

#### Error Responses
- `400`: Invalid input (text too short/long, invalid style/intensity)
- `429`: Rate limit exceeded
- `500`: Internal server error

### 3. AI Detection
**POST** `/detect`

Analyze text for AI generation probability using multiple detection services.

#### Request Body
```json
{
  "text": "string (required, 300-5000 characters)"
}
```

#### Request Validation
- `text`: Required, minimum 300 characters, maximum 5000 characters

#### Response
```json
{
  "success": true,
  "data": {
    "text": "Analyzed text...",
    "overallScore": {
      "aiProbability": 0.85,
      "confidence": 0.92,
      "classification": "likely_ai"
    },
    "detectors": [
      {
        "name": "GPTZero",
        "score": 0.88,
        "confidence": 0.94,
        "details": {
          "perplexity": 12.5,
          "burstiness": 0.3
        }
      },
      {
        "name": "Winston AI",
        "score": 0.82,
        "confidence": 0.90,
        "details": {
          "humanScore": 0.18,
          "readabilityScore": 7.8
        }
      }
    ],
    "recommendations": [
      "Consider adding more varied sentence lengths",
      "Include more conversational elements"
    ],
    "processingTime": 3.2
  }
}
```

#### Error Responses
- `400`: Invalid input (text too short/long)
- `429`: Rate limit exceeded
- `503`: Detection service unavailable

### 4. Feedback
**POST** `/feedback`

Submit user feedback on humanization quality.

#### Request Body
```json
{
  "sessionId": "string (required)",
  "rating": "number (required, 1-5)",
  "originalText": "string (required)",
  "humanizedText": "string (required)",
  "comments": "string (optional)",
  "detectionScoreBefore": "number (optional)",
  "detectionScoreAfter": "number (optional)"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "feedbackId": "feedback_12345",
    "message": "Thank you for your feedback"
  }
}
```

### 5. Usage Statistics
**GET** `/stats`

Get API usage statistics (for monitoring).

#### Response
```json
{
  "success": true,
  "data": {
    "totalRequests": 15420,
    "requestsToday": 342,
    "averageProcessingTime": 2.8,
    "successRate": 0.987,
    "popularStyles": {
      "casual": 0.45,
      "professional": 0.30,
      "academic": 0.15,
      "creative": 0.10
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `TEXT_TOO_SHORT` | Text below minimum length |
| `TEXT_TOO_LONG` | Text exceeds maximum length |
| `INVALID_STYLE` | Unsupported style parameter |
| `INVALID_INTENSITY` | Unsupported intensity parameter |
| `SERVICE_UNAVAILABLE` | External service temporarily unavailable |
| `PROCESSING_ERROR` | Error during text processing |
| `INTERNAL_ERROR` | Unexpected server error |

## Status Codes

- `200`: Success
- `400`: Bad Request
- `429`: Too Many Requests
- `500`: Internal Server Error
- `503`: Service Unavailable

## Request Headers

### Required Headers
- `Content-Type: application/json` (for POST requests)

### Optional Headers
- `X-API-Key: your_api_key` (for premium tier)
- `User-Agent: your_app_name/version`

## Response Headers

### Standard Headers
- `Content-Type: application/json`
- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 95`
- `X-RateLimit-Reset: 1625097600`

## Caching Strategy

### Response Caching
- Detection results: Cached for 24 hours based on text hash
- Humanization results: Not cached (always fresh generation)
- Static responses (health, stats): Cached for 5 minutes

### Cache Headers
- `Cache-Control: public, max-age=300` (for stats)
- `Cache-Control: private, max-age=86400` (for detection)
- `Cache-Control: no-cache` (for humanization)

## Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  External APIs  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ User Input  │ │───▶│ │ Validation  │ │    │ │ OpenAI API  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │        │        │    │        ▲        │
│ ┌─────────────┐ │    │        ▼        │    │        │        │
│ │ Display     │ │◀───│ ┌─────────────┐ │    │        │        │
│ │ Results     │ │    │ │ Humanization│ │────┼────────┘        │
│ └─────────────┘ │    │ │ Engine      │ │    │                 │
│                 │    │ └─────────────┘ │    │ ┌─────────────┐ │
│ ┌─────────────┐ │    │        │        │    │ │ GPTZero     │ │
│ │ Detection   │ │◀───│        ▼        │    │ │ Winston AI  │ │
│ │ Scores      │ │    │ ┌─────────────┐ │    │ │ Originality │ │
│ └─────────────┘ │    │ │ AI Detection│ │────┼▶│ APIs        │ │
│                 │    │ │ Service     │ │    │ └─────────────┘ │
└─────────────────┘    │ └─────────────┘ │    └─────────────────┘
                       │        │        │
                       │        ▼        │    ┌─────────────────┐
                       │ ┌─────────────┐ │    │     Redis       │
                       │ │ Response    │ │───▶│    Cache        │
                       │ │ Formation   │ │    └─────────────────┘
                       │ └─────────────┘ │
                       └─────────────────┘
```

## Security Considerations

### Input Validation
- Strict character limits on all text inputs
- Content-type validation
- Rate limiting per IP and per API key
- Request size limits

### Data Protection
- No persistent storage of user text
- Memory-only processing
- Secure API key management
- HTTPS enforcement in production

### Monitoring
- Request logging (without sensitive content)
- Error tracking and alerting
- Performance monitoring
- Unusual usage pattern detection

## OpenAPI 3.0 Specification

```yaml
openapi: 3.0.3
info:
  title: HumanizeAI API
  description: API for transforming AI-generated text into human-like content
  version: 1.0.0
  contact:
    name: HumanizeAI Support
    email: support@humanizeai.com

servers:
  - url: http://localhost:3000/api
    description: Development server
  - url: https://api.humanizeai.com/api
    description: Production server

paths:
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'

  /humanize:
    post:
      summary: Humanize AI-generated text
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/HumanizeRequest'
      responses:
        '200':
          description: Text successfully humanized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HumanizeResponse'
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /detect:
    post:
      summary: Detect AI-generated content
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DetectRequest'
      responses:
        '200':
          description: Detection analysis completed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DetectResponse'

components:
  schemas:
    HumanizeRequest:
      type: object
      required:
        - text
      properties:
        text:
          type: string
          minLength: 50
          maxLength: 5000
        style:
          type: string
          enum: [academic, casual, professional, creative]
          default: casual
        intensity:
          type: string
          enum: [subtle, moderate, aggressive]
          default: moderate
        preserveFormatting:
          type: boolean
          default: false

    HumanizeResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            originalText:
              type: string
            humanizedText:
              type: string
            style:
              type: string
            intensity:
              type: string
            processingTime:
              type: number
            statistics:
              type: object

    DetectRequest:
      type: object
      required:
        - text
      properties:
        text:
          type: string
          minLength: 300
          maxLength: 5000

    DetectResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            text:
              type: string
            overallScore:
              type: object
            detectors:
              type: array
            recommendations:
              type: array

    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: array

    HealthResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            status:
              type: string
            version:
              type: string
            uptime:
              type: number
```
