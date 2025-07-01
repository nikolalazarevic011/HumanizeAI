#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing HumanizeAI Backend...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/api/health`);
    console.log('✅ Health check passed');
    console.log(`   Status: ${healthResponse.data.data.status}`);
    console.log(`   Uptime: ${Math.floor(healthResponse.data.data.uptime)}s\n`);

    // Test 2: Basic API info
    console.log('2. Testing root endpoint...');
    const rootResponse = await axios.get(API_BASE);
    console.log('✅ Root endpoint working');
    console.log(`   Message: ${rootResponse.data.data.message}\n`);

    // Test 3: Get available styles
    console.log('3. Testing styles endpoint...');
    const stylesResponse = await axios.get(`${API_BASE}/api/humanize/styles`);
    console.log('✅ Styles endpoint working');
    console.log(`   Available styles: ${stylesResponse.data.data.styles.length}`);
    console.log(`   Available intensities: ${stylesResponse.data.data.intensities.length}\n`);

    // Test 4: Humanize text
    console.log('4. Testing text humanization...');
    const testText = 'This is a test sentence that will be processed by the humanization service to make it sound more natural.';
    
    const humanizeResponse = await axios.post(`${API_BASE}/api/humanize`, {
      text: testText,
      style: 'casual',
      intensity: 'moderate'
    });

    console.log('✅ Text humanization working');
    console.log(`   Original: "${humanizeResponse.data.data.originalText.substring(0, 50)}..."`);
    console.log(`   Humanized: "${humanizeResponse.data.data.humanizedText.substring(0, 50)}..."`);
    console.log(`   Processing time: ${humanizeResponse.data.data.processingTime}s`);
    console.log(`   Changes made: ${humanizeResponse.data.data.statistics.changesCount}\n`);

    // Test 5: Error handling
    console.log('5. Testing error handling...');
    try {
      await axios.post(`${API_BASE}/api/humanize`, {
        text: 'Short', // Too short
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation error handling working');
        console.log(`   Error code: ${error.response.data.error.code}\n`);
      } else {
        throw error;
      }
    }

    console.log('🎉 All tests passed! Backend is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    process.exit(1);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get(`${API_BASE}/api/health`, { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const isRunning = await checkServer();
  
  if (!isRunning) {
    console.error('❌ Server not running on http://localhost:3000');
    console.error('   Please start the server with: npm run dev');
    process.exit(1);
  }

  await testAPI();
}

main();