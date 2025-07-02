// Test the new WordsAPI-based humanization service
const axios = require('axios');

const testText = `The implementation of this advanced artificial intelligence system demonstrates significant improvements in operational efficiency and effectiveness. Furthermore, the comprehensive methodology utilized in this research provides substantial evidence for the viability of the proposed technological approach. Therefore, this study contributes meaningfully to the existing academic literature on machine learning and artificial intelligence applications. It is important to note that the results obtained through this investigation establish a foundation for future developments in the field.`;

const testHumanization = async () => {
  console.log('🧪 Testing HumanizeAI with WordsAPI integration');
  console.log('📝 Original text:', testText);
  console.log('⚙️  Using: Professional style, Aggressive intensity\n');

  try {
    const response = await axios.post('http://localhost:3000/api/humanize', {
      text: testText,
      style: 'professional',
      intensity: 'aggressive',
      preserveFormatting: false
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000
    });

    if (response.data && response.data.success && response.data.data) {
      const result = response.data.data;
      
      console.log('✅ Humanization successful!');
      console.log('📄 Humanized text:', result.humanizedText);
      console.log('\n📊 Statistics:');
      console.log(`   • Original words: ${result.statistics.originalWordCount}`);
      console.log(`   • Humanized words: ${result.statistics.humanizedWordCount}`);
      console.log(`   • Changes made: ${result.statistics.changesCount}`);
      console.log(`   • Readability score: ${result.statistics.readabilityScore.toFixed(1)}/10`);
      console.log(`   • Processing time: ${result.processingTime.toFixed(2)}s`);
      console.log(`   • Style: ${result.style}`);
      console.log(`   • Intensity: ${result.intensity}`);
      
      // Calculate change percentage
      const changePercentage = ((result.statistics.changesCount / result.statistics.originalWordCount) * 100).toFixed(1);
      console.log(`   • Change percentage: ${changePercentage}%`);
      
    } else {
      console.error('❌ Unexpected response format:', response.data);
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused. Make sure the backend server is running on localhost:3000');
      console.log('💡 Start the backend with: cd backend && npm run dev');
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
};

// Test health endpoint first
const testHealth = async () => {
  try {
    console.log('🏥 Testing health endpoint...');
    const response = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Health check passed:', response.data.data.status);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.code === 'ECONNREFUSED' ? 'Server not running' : error.message);
    return false;
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting HumanizeAI WordsAPI Integration Tests\n');
  
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('\n💡 Please start the backend server first:');
    console.log('   cd backend && npm run dev');
    return;
  }
  
  console.log('');
  await testHumanization();
  
  console.log('\n🎉 Test completed!');
};

runTests();
