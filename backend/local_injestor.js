import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// --- YOUR SUPABASE CREDENTIALS ---
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

const repoPath = './LeetCode-main'; // Point this to the extracted GitHub folder
const metadataPath = './aggregated_metadata.json'; // The file we made from the CSVs

const runLocalIngestion = async () => {
    console.log("🚀 Starting Local CodeRace Data Ingestion...");
    
    // Load Company Tags
    let companyData = [];
    if (fs.existsSync(metadataPath)) {
        companyData = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        console.log(`Loaded company tags for ${companyData.length} problems.`);
    } else {
        console.warn("aggregated_metadata.json not found. Problems will be uploaded without company tags.");
    }

    const folders = fs.readdirSync(repoPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
        .map(dirent => dirent.name);

    console.log(`Found ${folders.length} problem folders. Processing...`);

    let successCount = 0;

    for (const folder of folders) {
        // The folder names often have numbers in them (e.g., "0015-3sum"). We need to strip the numbers to match our slugs.
        const titleSlug = folder.replace(/^\d+-/, '').toLowerCase();
        
        const readmePath = path.join(repoPath, folder, 'README.md');
        const cppPath = path.join(repoPath, folder, `${folder}.cpp`) || path.join(repoPath, folder, `${titleSlug}.cpp`);

        if (!fs.existsSync(readmePath)) continue;

        try {
            const readmeContent = fs.readFileSync(readmePath, 'utf-8');
            
            // Extract the title (usually in the first <h2> tag in these sync repos)
            const titleMatch = readmeContent.match(/<h2><a[^>]*>(.*?)<\/a><\/h2>/) || readmeContent.match(/<h2>(.*?)<\/h2>/);
            // Fallback: Clean up the slug to make a title if regex fails
            const title = titleMatch ? titleMatch[1].replace(/^\d+\.\s*/, '') : titleSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            // Clean up the description
            const description = readmeContent
                .replace(/<h2>.*?<\/h2>/g, '') // Remove title header
                .replace(/<h3>.*?<\/h3>/g, '') // Remove difficulty header
                .replace(/<hr>/g, '')
                .trim();

            // Extract the C++ solution if it exists
            let cppSolution = "// Solution not found locally";
            if (fs.existsSync(cppPath)) {
                cppSolution = fs.readFileSync(cppPath, 'utf-8');
            }

            // Find matching company tags from our CSV aggregator
            const matchedCompanyData = companyData.find(p => p.id === titleSlug);
            const companies = matchedCompanyData ? matchedCompanyData.companies : [];
            const difficulty = matchedCompanyData ? matchedCompanyData.difficulty : 'medium';

            // Push to Supabase
            const { error: dbError } = await supabase
                .from('problems')
                .upsert({
                    id: titleSlug,
                    title: title,
                    difficulty: difficulty,
                    companies: companies,
                    description: description,
                    function_name: 'solve', // Default wrapper function name
                    initial_code: {
                        "cpp": "class Solution {\npublic:\n    // Write your code here\n};",
                        "javascript": "function solve() {\n  // Write your code here\n}",
                        "python": "def solve():\n    # Write your code here",
                        "java": "class Solution {\n    public void solve() {\n        // Write your code here\n    }\n}"
                    },
                    // Since test cases aren't easily parsed from markdown, we insert a placeholder to prevent DB constraints from failing
                    test_cases: [{ "inputs": ["placeholder"], "expected": "placeholder" }]
                });

            if (dbError) throw dbError;
            
            successCount++;
            process.stdout.write(`\r✅ Uploaded: ${successCount}/${folders.length} `);

        } catch (error) {
            console.log(`\n❌ Failed on ${folder}: ${error.message}`);
        }
    }
    
    console.log(`\n🎉 Local Ingestion Complete! Successfully added ${successCount} questions to your database.`);
};

runLocalIngestion();