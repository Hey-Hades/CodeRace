import { GoogleGenerativeAI } from "@google/generative-ai";
import asyncHandler from "express-async-handler";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getCodeReview = asyncHandler(async (req, res) => {
  // 👉 1. Catch the didIWin variable
  const { code, problemTitle, didIWin } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code provided for review." });
  }

  // ── Input Validation ──────────────────────────────────────────────────────
  const MAX_CODE_BYTES = 30 * 1024; // 30 KB — more than enough for a contest solution
  if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) {
    return res.status(400).json({ error: "Code is too large to review." });
  }

  // Sanitise problemTitle to prevent prompt injection — strip to 100 chars of plain text
  const safeTitle = typeof problemTitle === "string"
    ? problemTitle.replace(/[^a-zA-Z0-9 _\-().]/g, "").slice(0, 100)
    : "a coding challenge";
  // ──────────────────────────────────────────────────────────────────────────

  // 👉 2. Dynamic context-aware prompt
  const prompt = `
    You are an expert technical interviewer. The candidate was working on the coding problem "${safeTitle}".
    Match outcome: ${didIWin ? "The candidate won and successfully solved the problem." : "The candidate lost the match (the opponent finished first), so their code might be incomplete or just the default starting template."}
    
    Here is their code at the end of the match:
    \n\n${code}\n\n
    
    Provide a very brief (4 to 5 sentences maximum) review of this code. 
    If the code is mostly empty or unattempted, gently encourage them and tell them they will get it next time. 
    If there is actual logic written, mention the likely Time and Space complexity, and give one quick tip for improvement or praise for good structure. 
    Keep it conversational, punchy, and direct. Do not use markdown formatting.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent(prompt);
    const review = result.response.text();

    res.status(200).json({ review });
  } catch (error) {
    console.error("AI Review Error:", error.message || error);
    
    // 👉 3. THE FIX: Catch the rate limit error specifically and pass it to the frontend!
    if (error.status === 429 || (error.message && error.message.includes("429"))) {
      return res.status(429).json({ 
        error: "🏎️ Pit stop! The AI engines are running too hot. Try your request again in 60 seconds." 
      });
    }

    // Default error for anything else
    res.status(500).json({ error: "Failed to generate AI review. Please try again later." });
  }
});