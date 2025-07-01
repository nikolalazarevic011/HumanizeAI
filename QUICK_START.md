# Quick Start Guide for HumanizeAI (Personal Use)

## Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Create environment file:**
```bash
cp .env.example .env
```

3. **Optional - Add OpenAI API Key:**
   - Get a free API key from https://platform.openai.com/api-keys
   - Add it to your `.env` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
   - Note: The app will work without an API key using simple rule-based text transformation

4. **Start the server:**
```bash
npm run dev
```

## Testing

1. **Check if server is running:**
```bash
curl http://localhost:3000/api/health
```

2. **Test text humanization:**
```bash
curl -X POST http://localhost:3000/api/humanize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a test sentence that will be humanized to sound more natural and engaging.",
    "style": "casual",
    "intensity": "moderate"
  }'
```

3. **Get available styles:**
```bash
curl http://localhost:3000/api/humanize/styles
```

## Quick Test

You can also test manually by opening your browser and going to:
- http://localhost:3000 (Basic API info)
- http://localhost:3000/api/health (Health check)

## Troubleshooting

- **Port already in use:** Change the PORT in your `.env` file
- **OpenAI errors:** Check your API key or test without it (app has fallback)
- **Dependencies issues:** Delete `node_modules` and run `npm install` again

## What's Working

✅ Backend server with Express.js
✅ Text humanization API (with or without OpenAI)
✅ Health check endpoints
✅ Basic security and validation
✅ Simple rule-based humanization as fallback
✅ Relaxed rate limiting for personal use

## Next Steps

- Frontend React app (coming next)
- Simple UI for text input/output
- Copy-to-clipboard functionality