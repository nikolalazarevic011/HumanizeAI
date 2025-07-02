// Quick test for WordsAPI integration
const axios = require('axios');

const testWordsAPI = async () => {
  const apiKey = 'key';
  const word = 'important';
  
  try {
    console.log(`Testing WordsAPI with word: "${word}"`);
    
    const response = await axios.get(`https://wordsapiv1.p.rapidapi.com/words/${word}/synonyms`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
      },
      timeout: 10000,
    });

    console.log('✅ WordsAPI Response:', response.data);
    
    if (response.data && response.data.synonyms) {
      console.log(`📝 Found ${response.data.synonyms.length} synonyms:`, response.data.synonyms.slice(0, 5));
    }
    
  } catch (error) {
    console.error('❌ WordsAPI Error:', error.response?.data || error.message);
  }
};

testWordsAPI();
