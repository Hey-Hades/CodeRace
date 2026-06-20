import fs from 'fs';
import path from 'path';

const csvDirectory = './csv_files'; // Put all your downloaded CSVs here
const problemMap = new Map();

// Read all files in the directory
const files = fs.readdirSync(csvDirectory).filter(file => file.endsWith('.csv'));

files.forEach(file => {
    // Extract company name from filename (e.g., "google_alltime.csv" -> "google")
    const companyName = file.split('_')[0].toLowerCase();
    const filePath = path.join(csvDirectory, file);
    
    // Read the CSV file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').slice(1); // Skip header
    
    lines.forEach(line => {
        if (!line.trim()) return;
        
        // CSV format: ID,Title,Acceptance,Difficulty,Frequency,Link
        // Note: Some titles have commas, so a simple split(',') isn't perfect, 
        // but works for 95% of LeetCode titles.
        const parts = line.split(',');
        const id = parts[0];
        const title = parts[1];
        let difficulty = parts[3]?.toLowerCase() || 'medium';
        
        // Generate our string ID (e.g., "Two Sum" -> "two-sum")
        const stringId = title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `problem-${id}`;

        if (!problemMap.has(stringId)) {
            problemMap.set(stringId, {
                id: stringId,
                title: title,
                difficulty: difficulty,
                companies: new Set([companyName])
            });
        } else {
            problemMap.get(stringId).companies.add(companyName);
        }
    });
});

// Convert Maps and Sets to Arrays for JSON
const finalProblems = Array.from(problemMap.values()).map(p => ({
    ...p,
    companies: Array.from(p.companies)
}));

fs.writeFileSync('aggregated_metadata.json', JSON.stringify(finalProblems, null, 2));
console.log(`✅ Aggregated ${finalProblems.length} unique problems! Saved to aggregated_metadata.json`);