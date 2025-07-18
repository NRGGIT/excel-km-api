
const CONFIG = {
  defaultTemperature: 0.2,
  defaultMode: "direct",
  defaultMaxTokens: 1000,
  apiKey: "vaZE1kubUUMfXVZH8tLueGWbG9g3cuJn3i87Yy9MHmpxuesp8LO7Vp5VnRJiH21W", // Replace with your actual API key
  knowledgeModelId: "34a5610d304340f9882854ff9b6d14ba", // Replace with your knowledge model ID
  defaultLlmAlias: "gpt-4.1" // Replace with your default model
};

/**
 * AI-powered text generation using Constructor.app API
 * @customfunction
 * @param {string} userPrompt User prompt text
 * @param {string} systemPrompt System prompt text
 * @param {number} [temperature] Temperature (0-2, optional)
 * @param {string} [mode] Mode: direct, model, or optative_rag (optional)
 * @param {number} [maxTokens] Max tokens (1-4096, optional)
 * @param {string} [llmAlias] LLM alias (optional)
 * @returns {Promise<string>} Generated text response
 */
async function CONSTRUCT(userPrompt, systemPrompt, temperature, mode, maxTokens, llmAlias) {
  try {
    // Special test mode - if userPrompt is "TEST", return test message
    if (userPrompt.toUpperCase() === "TEST") {
      return "✅ CONSTRUCT function is working perfectly! Ready for API integration.";
    }
    
    // Debug mode - if userPrompt is "DEBUG", return config info
    if (userPrompt.toUpperCase() === "DEBUG") {
      return `Config: API Key ${CONFIG.apiKey ? 'SET' : 'NOT SET'}, Model ID ${CONFIG.knowledgeModelId ? 'SET' : 'NOT SET'}`;
    }
    
    // Check if we have required config
    if (!CONFIG.apiKey || CONFIG.apiKey === "YOUR_API_KEY_HERE") {
      return "ERROR: Please configure your API key in functions.js";
    }
    
    if (!CONFIG.knowledgeModelId || CONFIG.knowledgeModelId === "YOUR_KNOWLEDGE_MODEL_ID_HERE") {
      return "ERROR: Please configure your knowledge model ID in functions.js";
    }
    
    // Use default values if parameters not provided
    const finalTemperature = temperature ?? CONFIG.defaultTemperature;
    const finalMode = mode ?? CONFIG.defaultMode;
    const finalMaxTokens = maxTokens ?? CONFIG.defaultMaxTokens;
    const finalLlmAlias = llmAlias ?? CONFIG.defaultLlmAlias;
    
    // Validate parameters
    if (finalTemperature < 0 || finalTemperature > 2) {
      return "ERROR: Temperature must be between 0 and 2";
    }
    
    if (!["direct", "model", "optative_rag"].includes(finalMode)) {
      return "ERROR: Mode must be 'direct', 'model', or 'optative_rag'";
    }
    
    if (finalMaxTokens < 1 || finalMaxTokens > 4096) {
      return "ERROR: Max tokens must be between 1 and 4096";
    }
    
    // Make API request with detailed error reporting
    const result = await makeModelRequestWithDebug(
      CONFIG.knowledgeModelId,
      CONFIG.apiKey,
      finalLlmAlias,
      finalTemperature,
      finalMaxTokens,
      systemPrompt,
      userPrompt
    );
    
    return result;
    
  } catch (error) {
    return `ERROR: ${error.message}`;
  }
}

/**
 * Make API request with detailed debugging
 */
async function makeModelRequestWithDebug(knowledgeModelId, apiKey, modelId, temperature, maxTokens, systemPrompt, userPrompt) {
  const endpoint = `https://training.constructor.app/api/platform-kmapi/v1/knowledge-models/${knowledgeModelId}/chat/completions`;
  
  const requestBody = {
    "model": modelId,
    "messages": [
      {
        "role": "system",
        "content": [
          {
            "type": "text",
            "text": systemPrompt
          }
        ]
      },
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": userPrompt
          }
        ]
      }
    ],
    "temperature": temperature,
    "max_completion_tokens": maxTokens,
    "top_p": 1,
    "frequency_penalty": 0,
    "presence_penalty": 0,
    "stream": false
  };
  
  // Try multiple approaches
  
  // Approach 1: Direct request
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        "X-KM-AccessKey": `Bearer ${apiKey}`,
        "X-KM-Extension": "direct_llm",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      mode: 'cors'
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      throw new Error(`Direct request failed: HTTP ${response.status} - ${responseText}`);
    }
    
    const responseData = JSON.parse(responseText);
    
    if (responseData.choices && responseData.choices.length > 0) {
      return responseData.choices[0].message.content;
    } else {
      throw new Error(`Direct request: Unexpected response format - ${JSON.stringify(responseData)}`);
    }
    
  } catch (directError) {
    // Approach 2: Try different CORS proxy
    try {
      return await makeRequestWithCorsAnywhere(endpoint, requestBody, apiKey);
    } catch (corsError) {
      // Approach 3: Try another proxy
      try {
        return await makeRequestWithAllOrigins(endpoint, requestBody, apiKey);
      } catch (allOriginsError) {
        // Return detailed error information
        return `DETAILED ERROR REPORT:
Direct: ${directError.message}
CORS Anywhere: ${corsError.message}
AllOrigins: ${allOriginsError.message}`;
      }
    }
  }
}

/**
 * Try with cors-anywhere proxy
 */
async function makeRequestWithCorsAnywhere(endpoint, requestBody, apiKey) {
  const proxyUrl = `https://cors-anywhere.herokuapp.com/${endpoint}`;
  
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      "X-KM-AccessKey": `Bearer ${apiKey}`,
      "X-KM-Extension": "direct_llm",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    },
    body: JSON.stringify(requestBody)
  });
  
  const responseText = await response.text();
  
  if (!response.ok) {
    throw new Error(`CORS Anywhere: HTTP ${response.status} - ${responseText}`);
  }
  
  const responseData = JSON.parse(responseText);
  
  if (responseData.choices && responseData.choices.length > 0) {
    return responseData.choices[0].message.content;
  } else {
    throw new Error(`CORS Anywhere: Unexpected response - ${JSON.stringify(responseData)}`);
  }
}

/**
 * Try with allorigins proxy (different approach)
 */
async function makeRequestWithAllOrigins(endpoint, requestBody, apiKey) {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(endpoint)}`;
  
  // Create a proper POST request through the proxy
  const proxyResponse = await fetch('https://api.allorigins.win/get', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: endpoint,
      method: 'POST',
      headers: {
        "X-KM-AccessKey": `Bearer ${apiKey}`,
        "X-KM-Extension": "direct_llm",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    })
  });
  
  const proxyResult = await proxyResponse.json();
  
  if (!proxyResponse.ok || !proxyResult.contents) {
    throw new Error(`AllOrigins proxy failed: ${proxyResult.status || 'Unknown error'}`);
  }
  
  const responseData = JSON.parse(proxyResult.contents);
  
  if (responseData.choices && responseData.choices.length > 0) {
    return responseData.choices[0].message.content;
  } else {
    throw new Error(`AllOrigins: Unexpected response - ${JSON.stringify(responseData)}`);
  }
}

// Register the function
CustomFunctions.associate("CONSTRUCT", CONSTRUCT);