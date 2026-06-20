/**
 * Helper to convert JSON arrays/primitives into C++ syntax.
 * Example: [1, 2, 3] -> std::vector<int>{1, 2, 3}
 */
const toCppFormat = (val) => {
    if (Array.isArray(val)) {
        return `std::vector<int>{${val.map(toCppFormat).join(', ')}}`;
    }
    if (typeof val === 'string') return `"${val}"`;
    return val; 
};

/**
 * Helper to convert JSON arrays/primitives into Java syntax.
 * Example: [1, 2, 3] -> new int[]{1, 2, 3}
 */
const toJavaFormat = (val) => {
    if (Array.isArray(val)) {
        return `new int[]{${val.map(toJavaFormat).join(', ')}}`;
    }
    if (typeof val === 'string') return `"${val}"`;
    return val;
};

// Use ES Module export!
export const generatePayload = (language, userCode, functionName, testCases) => {
    const totalCases = testCases.length;

    // ---------------------------------------------------------
    // 1. PYTHON HARNESS
    // ---------------------------------------------------------
    if (language === 'python') {
        return `
${userCode}

import json
test_cases = ${JSON.stringify(testCases)}
passed = 0

for i, tc in enumerate(test_cases):
    try:
        result = ${functionName}(*tc['inputs'])
        if result == tc['expected']:
            passed += 1
    except Exception as e:
        pass

print(f"RESULT|{passed}/${totalCases}")
`;
    } 
    
    // ---------------------------------------------------------
    // 2. JAVASCRIPT HARNESS
    // ---------------------------------------------------------
    if (language === 'javascript' || language === 'js' || language === 'nodejs') {
        return `
${userCode}

const testCases = ${JSON.stringify(testCases)};
let passed = 0;

testCases.forEach((tc, i) => {
    try {
        const result = ${functionName}(...tc.inputs);
        if (JSON.stringify(result) === JSON.stringify(tc.expected)) {
            passed++;
        }
    } catch (e) {
        // ignore crash for this specific test case
    }
});

console.log(\`RESULT|\${passed}/${totalCases}\`);
`;
    }

    // ---------------------------------------------------------
    // 3. C++ HARNESS
    // ---------------------------------------------------------
    if (language === 'cpp' || language === 'c++') {
        let assertions = '';
        testCases.forEach((tc) => {
            const inputsStr = tc.inputs.map(toCppFormat).join(', ');
            const expectedStr = toCppFormat(tc.expected);
            assertions += `    try { if (${functionName}(${inputsStr}) == ${expectedStr}) passed++; } catch(...) {}\n`;
        });

        return `
#include <iostream>
#include <vector>
#include <string>

${userCode}

int main() {
    int passed = 0;
${assertions}
    std::cout << "RESULT|" << passed << "/${totalCases}" << std::endl;
    return 0;
}
`;
    }

    // ---------------------------------------------------------
    // 4. JAVA HARNESS
    // ---------------------------------------------------------
    if (language === 'java') {
        let assertions = '';
        testCases.forEach((tc) => {
            const inputsStr = tc.inputs.map(toJavaFormat).join(', ');
            const expectedStr = toJavaFormat(tc.expected);
            assertions += `        try { 
            if (java.util.Arrays.equals(sol.${functionName}(${inputsStr}), ${expectedStr})) passed++; 
        } catch(Exception e) {}\n`;
        });

        return `
import java.util.*;

${userCode}

public class Main {
    public static void main(String[] args) {
        int passed = 0;
        Solution sol = new Solution();
${assertions}
        System.out.println("RESULT|" + passed + "/${totalCases}");
    }
}
`;
    }

    throw new Error(`Language ${language} harness not implemented yet.`);
};