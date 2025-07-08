#!/usr/bin/env node

// Quick TypeScript compilation test
const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Testing TypeScript compilation...');
  
  // Change to backend directory
  process.chdir('C:\\Nikola\\ME\\proj\\HumanizeAi\\backend');
  
  // Run TypeScript compiler
  const result = execSync('npx tsc --noEmit', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ TypeScript compilation successful!');
  console.log(result);
  
} catch (error) {
  console.log('❌ TypeScript compilation failed:');
  console.log(error.stdout || error.message);
  console.log(error.stderr);
}
