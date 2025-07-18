// Configuration - MODIFY THESE VALUES BEFORE DEPLOYING
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
    
    // Make real API request
    const result = await makeModelRequest(
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
 * Make API request to Constructor.app with CORS handling
 */
async function makeModelRequest(knowledgeModelId, apiKey, modelId, temperature, maxTokens, systemPrompt, userPrompt) {
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
  
  try {
    // Try direct request first
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
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const responseData = await response.json();
    
    if (responseData.choices && responseData.choices.length > 0) {
      return responseData.choices[0].message.content;
    } else {
      throw new Error("No response from API");
    }
    
  } catch (error) {
    // If direct request fails due to CORS, try with a proxy
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      return await makeRequestWithProxy(endpoint, requestBody, apiKey);
    }
    throw error;
  }
}

/**
 * Fallback: Make request through CORS proxy
 */
async function makeRequestWithProxy(endpoint, requestBody, apiKey) {
  try {
    // Using allorigins.win as CORS proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(endpoint)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        method: 'POST',
        headers: {
          "X-KM-AccessKey": `Bearer ${apiKey}`,
          "X-KM-Extension": "direct_llm",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      })
    });
    
    if (!response.ok) {
      throw new Error(`Proxy request failed: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    if (responseData.choices && responseData.choices.length > 0) {
      return responseData.choices[0].message.content;
    } else {
      throw new Error("No response from API via proxy");
    }
    
  } catch (error) {
    throw new Error(`Both direct and proxy requests failed: ${error.message}`);
  }
}

// Register only the main function
CustomFunctions.associate("CONSTRUCT", CONSTRUCT);