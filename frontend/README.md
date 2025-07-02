# HumanizeAI Frontend

React frontend for the HumanizeAI text humanization service.

## Features

- 🎨 Clean, modern UI with TailwindCSS
- ⚡ Fast development with Vite
- 📱 Responsive design (works on mobile and desktop)
- 🔄 Real-time text processing
- 📋 Copy-to-clipboard functionality
- 📊 Processing statistics display
- ⚙️ Style and intensity controls
- ❌ Error handling and loading states

## Quick Start

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Open browser:**
Navigate to http://localhost:5173

## Usage

1. **Paste AI-generated text** in the input area
2. **Choose style**: Casual, Professional, Academic, or Creative
3. **Select intensity**: Subtle, Moderate, or Aggressive
4. **Click "Humanize Text"** to process
5. **Copy the result** with the copy button

## Features

### Text Processing
- Supports 10-3000 characters
- Real-time character counting
- Example text for testing
- Preserve formatting option

### Styles Available
- **Casual**: Conversational and friendly
- **Professional**: Business-appropriate
- **Academic**: Scholarly language
- **Creative**: Engaging and expressive

### Statistics Display
- Number of changes made
- Word count before/after
- Readability score (0-10)
- Processing time

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Lint code
npm run lint
```

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **Lucide React** for icons
- **Axios** for API calls

## API Integration

The frontend connects to the backend API at `http://localhost:3000/api`:

- `POST /humanize` - Process text
- `GET /humanize/styles` - Get available options
- `GET /health` - Health check

## File Structure

```
src/
├── components/          # React components
│   ├── HumanizeApp.tsx # Main application component
│   ├── CopyButton.tsx  # Copy to clipboard component
│   └── LoadingSpinner.tsx # Loading indicator
├── services/           # API services
│   └── api.ts         # API client and methods
├── types/             # TypeScript types
│   └── index.ts       # Shared type definitions
├── App.tsx            # Root component
├── main.tsx           # Application entry point
└── index.css          # Global styles and Tailwind
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory and can be served by any static file server.

## Environment Variables

No environment variables needed for frontend. The API URL is configured in `src/services/api.ts`.

## Troubleshooting

**API Connection Issues:**
- Make sure the backend is running on port 3000
- Check browser console for CORS errors
- Verify API endpoints are accessible

**Development Issues:**
- Clear browser cache
- Delete `node_modules` and reinstall
- Check console for TypeScript errors
