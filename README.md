# HumanizeAI

A web application that transforms AI-generated text into human-like content using WordsAPI synonym replacement.

## 🚀 Features

- **Text Humanization**: Transform AI-generated content into natural, human-like text using WordsAPI synonyms
- **Professional Style**: Optimized for professional writing with aggressive synonym replacement
- **Privacy-First**: No text storage - all processing happens in memory
- **Real-time Processing**: Fast and efficient text transformation with WordsAPI integration
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- **React 18+** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **WordsAPI** for synonym replacement
- **Rate limiting** and security middleware
- **Professional style with aggressive intensity only**

## 📁 Project Structure

```
humanize-ai/
├── frontend/          # React frontend application
├── backend/           # Node.js backend API
├── shared/            # Shared types and utilities
├── research/          # Research documents and findings
└── docs/              # Documentation
```

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Redis (for caching)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/humanize-ai.git
cd humanize-ai
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Start development servers:
```bash
npm run dev
```

This will start both frontend (http://localhost:5173) and backend (http://localhost:3000) in development mode.

## ⚙️ Environment Variables

```env
# API Keys
OPENAI_API_KEY=your_openai_api_key
GPTZERO_API_KEY=your_gptzero_api_key
WINSTON_AI_API_KEY=your_winston_ai_api_key
ORIGINALITY_AI_API_KEY=your_originality_ai_api_key

# Database
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run frontend tests
npm run test:frontend

# Run backend tests  
npm run test:backend

# Run tests in watch mode
npm run test:watch
```

## 🏗️ Building for Production

```bash
# Build both frontend and backend
npm run build

# Build frontend only
npm run build:frontend

# Build backend only
npm run build:backend
```

## 📝 Scripts

- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## 🔧 Development Workflow

1. **Code Quality**: ESLint + Prettier for consistent code style
2. **Type Safety**: Full TypeScript support across frontend and backend
3. **Git Hooks**: Husky + lint-staged for pre-commit checks
4. **Testing**: Jest + React Testing Library + Supertest
5. **CI/CD**: GitHub Actions for automated testing and deployment

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Frontend Guide](./frontend/README.md)
- [Backend Guide](./backend/README.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 🔒 Security

- Input validation and sanitization
- Rate limiting and DDoS protection
- HTTPS enforcement
- No text storage policy
- Security headers and CSRF protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- AI detection services: GPTZero, Winston AI, Originality.AI
- The open-source community for amazing tools and libraries

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check our [documentation](./docs)
- Contact us at support@humanizeai.com

---

Made with ❤️ by the HumanizeAI team
