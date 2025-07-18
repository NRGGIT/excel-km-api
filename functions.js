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
 * Test version of CONSTRUCT function - No API calls
 * @customfunction
 * @param {string} userPrompt User prompt text
 * @param {string} systemPrompt System prompt text
 * @param {number} [temperature] Temperature (0-2, optional)
 * @param {string} [mode] Mode: direct, model, or optative_rag (optional)
 * @param {number} [maxTokens] Max tokens (1-4096, optional)
 * @param {string} [llmAlias] LLM alias (optional)
 * @returns {string} Mock response for testing
 */
function CONSTRUCT(userPrompt, systemPrompt, temperature, mode, maxTokens, llmAlias) {
  try {
    // Use default values if parameters not provided
    const finalTemperature = temperature ?? 0.7;
    const finalMode = mode ?? "direct";
    const finalMaxTokens = maxTokens ?? 1000;
    const finalLlmAlias = llmAlias ?? "gpt-4";
    
    // Validate parameters (same validation as real function)
    if (finalTemperature < 0 || finalTemperature > 2) {
      return "ERROR: Temperature must be between 0 and 2";
    }
    
    if (!["direct", "model", "optative_rag"].includes(finalMode)) {
      return "ERROR: Mode must be 'direct', 'model', or 'optative_rag'";
    }
    
    if (finalMaxTokens < 1 || finalMaxTokens > 4096) {
      return "ERROR: Max tokens must be between 1 and 4096";
    }
    
    // Return mock response with all parameters
    return `🤖 MOCK RESPONSE:
User: "${userPrompt}"
System: "${systemPrompt}"
Settings: temp=${finalTemperature}, mode=${finalMode}, tokens=${finalMaxTokens}, model=${finalLlmAlias}
✅ Add-in is working! Ready for real API integration.`;
    
  } catch (error) {
    return `ERROR: ${error.toString()}`;
  }
}

/**
 * Simple test function
 * @customfunction
 */
function HELLO_WORLD() {
  return "Hello from Excel Custom Function! 🎉";
}

/**
 * Function to test with parameters
 * @customfunction
 * @param {string} name Your name
 * @returns {string} Greeting message
 */
function GREET(name) {
  return `Hello ${name}! The custom function is working perfectly! 👋`;
}

// Register the custom functions
CustomFunctions.associate("CONSTRUCT", CONSTRUCT);
CustomFunctions.associate("HELLO_WORLD", HELLO_WORLD);
CustomFunctions.associate("GREET", GREET);