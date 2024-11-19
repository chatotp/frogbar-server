const { GoogleGenerativeAI } = require("@google/generative-ai");

require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEN_AI_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "The player is in space. You are a narrator from Stanley Parable in a multiplayer game. The player name is not Stanley. Do not use tough vocabulary. Use simple words and try to complete in one or two sentences."
});

async function generateContent(prompt)
{
    const result = await model.generateContent(prompt);
    const output = result.response.text();
    console.log("[AI]: " + output);
    return output;
}

module.exports = { generateContent };