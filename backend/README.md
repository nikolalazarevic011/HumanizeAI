# HumanizeAI Backend

Express.js backend API for the HumanizeAI text processing service.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Redis server

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file and configure:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. Start development server:
```bash
npm run dev
```

The server will start on http://localhost:3000

## 📁 Project Structure

```
src/
├── config/          # Configuration and environment variables
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── routes/          # API route definitions
├── services/        # Business logic and external API clients
├── utils/           # Utility functions and helpers
├── types/           # TypeScript type definitions
├── tests/           # Test files
├── app.ts           # Express application setup
└── index.ts         # Application entry point
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run type-check` - Run TypeScript type checking

## 🌍 Environment Variables

### Required
- `OPENAI_API_KEY` - OpenAI API key for text humanization
- `REDIS_URL` - Redis connection URL

### Optional
- `NODE_ENV` - Environment (development/production/test)
- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - CORS origin URL (default: http://localhost:5173)
- `CLAUDE_API_KEY` - Claude API key (fallback LLM)
- `GPTZERO_API_KEY` - GPTZero API key for detection
- `WINSTON_AI_API_KEY` - Winston AI API key for detection
- `ORIGINALITY_AI_API_KEY` - Originality.AI API key for detection

See `.env.example` for complete list.

## 🛡️ Security Features

- **Rate Limiting**: IP-based rate limiting with configurable limits
- **Input Validation**: Comprehensive input validation and sanitization
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configurable CORS policy
- **Request Size Limits**: Protection against large payloads
- **Error Handling**: Secure error responses without information leakage

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Test Structure
- Unit tests for utilities and services
- Integration tests for API endpoints
- Middleware tests for validation and security
- Error handling tests

## 📊 Monitoring

### Health Checks
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system information

### Logging
- Structured JSON logging in production
- Console logging in development
- Request/response logging
- Error tracking
- Performance monitoring

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production Redis instance
3. Set up monitoring and logging
4. Configure reverse proxy (nginx/Apache)
5. Set up SSL certificates

### Docker Support (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔗 API Documentation

The API follows RESTful conventions with JSON request/response format.

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://api.humanizeai.com/api`

### Authentication
Currently uses IP-based rate limiting. Premium features may require API keys.

### Response Format
```json
{
  "success": boolean,
  "data": object | null,
  "error": {
    "code": string,
    "message": string,
    "details": string[]
  } | null,
  "timestamp": string
}
```

## 🏗️ Architecture

### Middleware Stack
1. Security headers (Helmet)
2. CORS handling
3. Request compression
4. Request parsing
5. Rate limiting
6. Input validation
7. Request logging
8. Route handlers
9. Error handling

### External Dependencies
- **OpenAI API**: Primary LLM for text humanization
- **Claude API**: Fallback LLM
- **Detection APIs**: GPTZero, Winston AI, Originality.AI
- **Redis**: Caching and rate limiting
- **External Monitoring**: Sentry, Analytics

## 📈 Performance

### Optimization Features
- Response compression (gzip)
- Redis caching for expensive operations
- Request timeout handling
- Memory usage monitoring
- Connection pooling

### Performance Targets
- Response time < 3 seconds for humanization
- Response time < 5 seconds for detection
- 99.9% uptime
- < 1% error rate

## 🐛 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server is running
   - Verify REDIS_URL in environment

2. **OpenAI API Errors**
   - Verify API key is valid
   - Check rate limits and quotas
   - Monitor API status

3. **High Memory Usage**
   - Check for memory leaks
   - Monitor text processing sizes
   - Review caching strategy

4. **Rate Limiting Issues**
   - Adjust rate limit configuration
   - Check IP detection accuracy
   - Monitor abuse patterns

### Debug Mode
Set `LOG_LEVEL=debug` for verbose logging.

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Follow git commit conventions
5. Run linting and type checking

## 📄 License

MIT License - see LICENSE file for details.
