const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  try {
    let requestData;
    
    if (event.httpMethod === 'GET') {
      // Handle GET request with query parameters
      const params = event.queryStringParameters;
      requestData = {
        knowledgeModelId: params.modelId,
        apiKey: params.apiKey,
        model: params.llmAlias || 'gpt-4',
        messages: [
          {
            role: "system",
            content: [{ type: "text", text: params.systemPrompt }]
          },
          {
            role: "user",
            content: [{ type: "text", text: params.userPrompt }]
          }
        ],
        temperature: parseFloat(params.temperature) || 0.7,
        max_completion_tokens: parseInt(params.maxTokens) || 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false
      };
    } else if (event.httpMethod === 'POST') {
      // Handle POST request
      const body = JSON.parse(event.body);
      requestData = body;
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
    
    const { knowledgeModelId, apiKey, ...apiRequestBody } = requestData;
    
    const endpoint = `https://training.constructor.app/api/platform-kmapi/v1/knowledge-models/${knowledgeModelId}/chat/completions`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-KM-AccessKey': `Bearer ${apiKey}`,
        'X-KM-Extension': 'direct_llm',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiRequestBody)
    });
    
    const responseData = await response.json();
    
    // Return just the content for easier parsing in Excel
    if (responseData.choices && responseData.choices[0] && responseData.choices[0].message) {
      return {
        statusCode: 200,
        headers,
        body: responseData.choices[0].message.content
      };
    } else if (responseData.error) {
      return {
        statusCode: 400,
        headers,
        body: `ERROR: ${responseData.error.message || JSON.stringify(responseData.error)}`
      };
    } else {
      return {
        statusCode: 500,
        headers,
        body: `ERROR: Unexpected response format`
      };
    }
    
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: `ERROR: ${error.message}`
    };
  }
};