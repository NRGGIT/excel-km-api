exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }
  
  try {
    const { knowledgeModelId, apiKey, ...requestBody } = JSON.parse(event.body);
    
    const endpoint = `https://training.constructor.app/api/platform-kmapi/v1/knowledge-models/${knowledgeModelId}/chat/completions`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        "X-KM-AccessKey": `Bearer ${apiKey}`,
        "X-KM-Extension": "direct_llm",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(data)
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};