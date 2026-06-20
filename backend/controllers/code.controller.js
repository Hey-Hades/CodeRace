import asyncHandler from "express-async-handler";
import axios from "axios";
import supabase from "../config/supabase.js"; 
import { generatePayload } from "../utils/harnessGenerator.js";
import { declareWinner } from './match.controller.js';

// Map your frontend language selectors to OneCompiler's language IDs
const oneCompilerLanguageMap = {
    'javascript': 'nodejs',
    'python': 'python',
    'cpp': 'cpp',
    'java': 'java'
};

// @desc   Execute code on OneCompiler with Photo Finish logic
// @route  POST /api/code/execute
// @access Public
export const executeCode = asyncHandler(async (req, res) => {
    // 1. THE PHOTO FINISH TIMESTAMP: Mark exactly when the request hit your server
    const submissionTime = Date.now(); 

    const { code, language, problemId, roomId, userId } = req.body;

    if (!code || !language || !problemId) {
        res.status(400);
        throw new Error("Please provide code, language, and problemId");
    }

    console.log(`⚡ Received ${language} submission from user ${userId || 'Anonymous'} for ${problemId}`);

    // --- 2. FETCH PROBLEM & TEST CASES DYNAMICALLY FROM SUPABASE ---
    const { data: problem, error: dbError } = await supabase
        .from('problems')
        .select('function_name, test_cases')
        .eq('id', problemId)
        .single();

    if (dbError || !problem) {
        console.error("Database fetch error:", dbError.message);
        return res.status(404).json({ success: false, error: "Problem not found in database." });
    }

    // 3. WRAP THE CODE IN THE HARNESS
    const finalScript = generatePayload(language, code, problem.function_name, problem.test_cases);

    try {
        // 4. SEND TO ONECOMPILER API
        const response = await axios.post(
            'https://onecompiler-apis.p.rapidapi.com/api/v1/run', 
            {
                language: oneCompilerLanguageMap[language] || language,
                stdin: "",
                files: [
                    {
                        name: `index.${language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'cpp' ? 'cpp' : 'java'}`,
                        content: finalScript
                    }
                ]
            },
            {
                headers: {
                    'content-type': 'application/json',
                    // Using RAPIDAPI_KEY to match your earlier configuration, with fallback
                    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || process.env.ONECOMPILER_API_KEY, 
                    'X-RapidAPI-Host': 'onecompiler-apis.p.rapidapi.com'
                }
            }
        );

        const runResult = response.data;

        // Handle structural crashes (timeouts, memory limits)
        if (runResult.status !== 'success' && !runResult.stdout) {
            return res.json({ success: false, error: runResult.exception || runResult.stderr || 'Execution Error' });
        }

        const stdout = runResult.stdout ? runResult.stdout.trim() : "";
        
        // 5. PARSE DETERMINISTIC TOKEN (RESULT|X/Y)
        const resultMatch = stdout.match(/RESULT\|(\d+)\/(\d+)/);
        
        if (resultMatch) {
            const passedCases = parseInt(resultMatch[1]);
            const totalCases = parseInt(resultMatch[2]);
            const allPassed = passedCases === totalCases;

            // 6. THE RACE LOGIC (If they passed everything, check if they won!)
            if (allPassed && roomId) {
                const executionTimeMs = Date.now() - submissionTime;
                
                // Attempt to declare winner in the DB securely from the backend
                const matchResult = await declareWinner(roomId, userId, problemId, executionTimeMs);
                
                if (matchResult.success) {
                    // YOU WON! Tell the global socket instance to broadcast to the opponent
                    if (global.io) {
                        global.io.to(roomId).emit('match_over', { 
                            winnerId: userId, 
                            pointsExchanged: matchResult.pointsExchanged 
                        });
                    }
                } else {
                    console.log(`⏱️ Player ${userId} passed, but missed the photo finish.`);
                }
            }

            res.status(200).json({ 
                success: true, 
                passedCount: passedCases, 
                totalCount: totalCases,
                allPassed: allPassed,
                executionTimeMs: Date.now() - submissionTime 
            });
            
        } else {
            res.status(200).json({ 
                success: false, 
                error: 'Could not parse execution result. Did your code crash?',
                details: runResult.stderr || stdout
            });
        }

    } catch (error) {
        console.error("OneCompiler Execution Error:", error.response ? error.response.data : error.message);
        res.status(500);
        throw new Error("Compilation Error or API unreachable.");
    }
});