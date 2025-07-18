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
    
    // Check if we have required config
    if (!CONFIG.apiKey || CONFIG.apiKey === "YOUR_API_KEY_HERE") {
      return "ERROR: API key not configured";
    }
    
    if (!CONFIG.knowledgeModelId || CONFIG.knowledgeModelId === "YOUR_KNOWLEDGE_MODEL_ID_HERE") {
      return "ERROR: Knowledge model ID not configured";
    }
    
    // Make API request with better error handling
    const result = await makeModelRequestWithRetry(
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
 * Make API request with retry logic and better error handling
 */
async function makeModelRequestWithRetry(knowledgeModelId, apiKey, modelId, temperature, maxTokens, systemPrompt, userPrompt, retries = 2) {
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
  
  const requestOptions = {
    method: 'POST',
    headers: {
      "X-KM-AccessKey": `Bearer ${apiKey}`,
      "X-KM-Extension": "direct_llm",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody),
    mode: 'cors', // Explicitly set CORS mode
    credentials: 'omit' // Don't send credentials
  };
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(endpoint, requestOptions);
      
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
      if (attempt === retries) {
        // Last attempt failed
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error: Check your internet connection and API endpoint. CORS may be blocking the request.');
        }
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

// Register the custom function
CustomFunctions.associate("CONSTRUCT", CONSTRUCT);