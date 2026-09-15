import { GoogleGenerativeAI } from "@google/generative-ai";
import supabase from "../config/supabase.js";
import cron from "node-cron";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateTestCasesForProblem() {
  try {
    // 1. Pick a random problem that is active
    const { data: problems, error } = await supabase
      .from("problems")
      .select("id, title, description, test_cases")
      .eq("available", true)
      .limit(50); // Fetch a batch to randomly select from
      
    if (error || !problems || problems.length === 0) {
      console.error("No problems found for auto-generation.");
      return;
    }

    // Pick one random problem from the batch
    const problem = problems[Math.floor(Math.random() * problems.length)];
    console.log(`\n🤖 Auto-Generator analyzing problem: ${problem.title}...`);

    // 2. Ask Gemini to generate exactly 3 tricky test cases
    const prompt = `
      You are an expert algorithm competitive programmer.
      Read the following coding problem and its existing test cases.
      Generate 3 BRAND NEW, highly tricky edge-case inputs and expected outputs that will challenge a coder's solution.
      
      Problem Title: ${problem.title}
      Description: ${problem.description}
      Existing Test Cases (Do not duplicate these): ${JSON.stringify(problem.test_cases)}
      
      OUTPUT FORMAT REQUIREMENTS:
      You must respond with ONLY valid JSON (no markdown wrapping like \`\`\`json, no backticks, no explanations).
      Return a JSON array of 3 objects. 
      Each object must have exactly two keys: "input" (stringified representation) and "expected" (stringified representation).
      
      Example of desired valid JSON output:
      [
        { "input": "[1,2,3]\\n5", "expected": "8" },
        { "input": "[]\\n0", "expected": "0" },
        { "input": "[9,9,9]\\n1", "expected": "1" }
      ]
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    let rawText = result.response.text();
    
    // Clean up markdown if the AI includes it by mistake
    rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    let newCases = [];
    try {
      newCases = JSON.parse(rawText);
    } catch (e) {
      console.error("Failed to parse AI test cases:", rawText);
      return;
    }

    if (!Array.isArray(newCases) || newCases.length === 0) {
      console.error("AI returned empty or invalid cases format.");
      return;
    }

    // 3. Append and save to database
    const updatedTestCases = [...(problem.test_cases || []), ...newCases];
    
    const { error: updateError } = await supabase
      .from("problems")
      .update({ test_cases: updatedTestCases })
      .eq("id", problem.id);

    if (updateError) throw updateError;

    console.log(`✅ Automatically generated and added ${newCases.length} new test cases for ${problem.title}. (Total: ${updatedTestCases.length})`);

  } catch (err) {
    console.error("Cron Generator Error:", err.message);
  }
}

// Export the init function that schedules the cron
export function initCronJobs() {
  // Run every night at midnight Server Time
  cron.schedule("0 0 * * *", () => {
    console.log("⏰ Running daily automated test case generator...");
    generateTestCasesForProblem();
  });
  console.log("⏰ Auto-generator cron job initialized (runs every midnight).");
}
