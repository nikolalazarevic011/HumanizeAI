#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up HumanizeAI with WordsAPI integration...\n');

// Check if backend .env file exists
const backendEnvPath = path.join(__dirname, 'backend', '.env');

if (fs.existsSync(backendEnvPath)) {
  console.log('✅ Backend .env file already exists');
  
  // Read and check if WORDS_API_KEY is present
  const envContent = fs.readFileSync(backendEnvPath, 'utf8');
  if (envContent.includes('WORDS_API_KEY')) {
    console.log('✅ WORDS_API_KEY is configured');
  } else {
    console.log('⚠️  WORDS_API_KEY not found in .env file');
    console.log('💡 Please add: WORDS_API_KEY=your_rapidapi_key_here');
  }
} else {
  console.log('⚠️  Backend .env file not found');
  console.log('💡 Creating .env file from template...');
  
  const envTemplate = `# HumanizeAI Backend Environment Variables
WORDS_API_KEY=your_rapidapi_key_here
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
`;

  fs.writeFileSync(backendEnvPath, envTemplate);
  console.log('✅ Created backend/.env file');
  console.log('💡 Please update WORDS_API_KEY with your RapidAPI key');
}

console.log('\n📋 Setup checklist:');
console.log('  1. ✅ Install dependencies: npm install');
console.log('  2. ⚙️  Configure WordsAPI key in backend/.env');
console.log('  3. 🔧 Test WordsAPI: npm run test:wordsapi');
console.log('  4. 🚀 Start development: npm run dev');

console.log('\n🔗 Useful commands:');
console.log('  • npm run dev           - Start both frontend and backend');
console.log('  • npm run test:wordsapi  - Test WordsAPI connection');
console.log('  • npm run test:humanize  - Test humanization endpoint');

console.log('\n🎯 Current configuration:');
console.log('  • Style: Professional only');
console.log('  • Intensity: Aggressive only (with WordsAPI synonyms)');
console.log('  • API: WordsAPI for synonym replacement');

console.log('\n✨ Setup complete! Replace the API key and you\'re ready to go.');
