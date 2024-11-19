const axios = require('axios');

require("dotenv").config();

// Use the fine-tuned GPT-2 model from Hugging Face community
const MODEL_URL = 'https://api-inference.huggingface.co/models/openai-community/gpt2';

const initial_prompt = "You are in a free world where the rules are simple: shoot or be shot to survive. The environment is harsh, but you are the guide. As the guide, you must lead the survivors through dangerous territories, explain the choices they face, and help them navigate the perils of this ruthless world. Describe the scene and the decisions that need to be made, as if you are a narrator guiding them through the experience."

async function generateContent(prompt) {
  try {
    // Send the POST request to Hugging Face API with the prompt
    const response = await axios.post(
      MODEL_URL,
      { inputs: initial_prompt + prompt },
      { headers: { Authorization: `Bearer ${process.env.HG_AI_KEY}` } }
    );

    // Output the generated text
    const output = response.data[0]['generated_text'];
    console.log('Model Output:', output);
    return output;

  } catch (error) {
    console.error('Error calling the model:', error.response ? error.response.data : error.message);
  }
}

module.exports = { generateContent }
