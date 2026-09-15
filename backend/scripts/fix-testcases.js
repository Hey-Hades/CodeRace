import { GoogleGenerativeAI } from "@google/generative-ai";
import supabase from "../config/supabase.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const problemTitle = process.argv[2];

if (!problemTitle) {
  console.log("❌ Please provide a problem title to fix!");
  console.log('Usage: node scripts/fix-testcases.js "Two Sum"');
  process.exit(1);
}

async function fixTestCases(title) {
  try {
    console.log(`\n🔍 Searching for problem: "${title}"...`);

    const { data: problems, error } = await supabase
      .from("problems")
      .select("id, title, description, test_cases")
      .ilike("title", `%${title}%`);

    if (error) throw error;
    
    if (!problems || problems.length === 0) {
      console.log(`❌ No problem found matching "${title}"`);
      process.exit(1);
    }
    
    const problem = problems[0];
    console.log(`✅ Found: ${problem.title} (ID: ${problem.id})`);
    console.log(`Current Test Cases count: ${problem.test_cases?.length || 0}`);
    console.log("🤖 Asking AI to completely regenerate correct test cases...");

    const prompt = `
      You are an expert algorithm competitive programmer.
      The following coding problem currently has BROKEN or INCORRECT test cases in the database.
      I need you to generate a completely fresh, 100% correct set of 5 test cases for it. Include normal cases and edge cases.
      
      Problem Title: ${problem.title}
      Description: ${problem.description}
      
      OUTPUT FORMAT REQUIREMENTS:
      You must respond with ONLY valid JSON (no markdown wrapping like \`\`\`json, no backticks, no explanations).
      Return a JSON array of 5 objects. 
      Each object must have exactly two keys: "input" (stringified representation) and "expected" (stringified representation).
      
      Example of desired valid JSON output:
      [
        { "input": "[1,2,3]\\n5", "expected": "8" },
        { "input": "[]\\n0", "expected": "0" }
      ]
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    let rawText = result.response.text();
    
    rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    let newCases = [];
    try {
      newCases = JSON.parse(rawText);
    } catch (e) {
      console.error("❌ Failed to parse AI test cases. AI responded with:");
      console.log(rawText);
      process.exit(1);
    }

    if (!Array.isArray(newCases) || newCases.length === 0) {
      console.error("❌ AI returned empty or invalid cases format.");
      process.exit(1);
    }

    console.log(`✅ Generated ${newCases.length} completely new, correct test cases.`);

    const { error: updateError } = await supabase
      .from("problems")
      .update({ test_cases: newCases })
      .eq("id", problem.id);

    if (updateError) throw updateError;

    console.log(`🎉 Successfully FIXED test cases for "${problem.title}"!`);
    console.log(`The new cases are now live in the database.`);
    
    process.exit(0);

  } catch (err) {
    console.error("❌ Script Error:", err.message);
    process.exit(1);
  }
}

fixTestCases(problemTitle);
