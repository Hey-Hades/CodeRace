import axios from "axios";

const judge0Url = process.env.JUDGE0_URL;
const judge0ApiKey = process.env.JUDGE0_API_KEY;
const judge0ApiHost = process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com";
const useJudge0 = Boolean(judge0Url && judge0ApiKey);

const languageIds = {
  javascript: 63,
  python: 71,
  cpp: 54
};

export async function judgeSubmission({ problem, code, language }) {
  if (useJudge0) {
    try {
      return await judgeWithJudge0({ problem, code, language });
    } catch (error) {
      console.error("Judge0 error, falling back to local demo judge:", error.message);
    }
  }

  return judgeWithLocalDemo({ problem, code, language });
}

async function judgeWithJudge0({ problem, code, language }) {
  const languageId = languageIds[language];
  if (!languageId) throw new Error(`Unsupported language for Judge0: ${language}`);

  let passedTests = 0;
  let lastStatus = "Wrong Answer";

  for (const testCase of problem.testCases) {
    const result = await runJudge0Submission({
      sourceCode: code,
      languageId,
      stdin: testCase.input
    });

    const stdout = result.stdout || "";
    const stderr = result.stderr || result.compile_output || "";
    lastStatus = result.status?.description || "Unknown";

    if (stderr) {
      return {
        passedTests,
        totalTests: problem.testCases.length,
        accepted: false,
        status: lastStatus,
        error: stderr.slice(0, 500),
        source: "judge0"
      };
    }

    if (normalize(stdout) === normalize(testCase.expectedOutput)) {
      passedTests += 1;
    }
  }

  return {
    passedTests,
    totalTests: problem.testCases.length,
    accepted: passedTests === problem.testCases.length,
    status: passedTests === problem.testCases.length ? "Accepted" : lastStatus,
    source: "judge0"
  };
}

async function runJudge0Submission({ sourceCode, languageId, stdin }) {
  const response = await axios.post(
    `${judge0Url.replace(/\/$/, "")}/submissions`,
    {
      source_code: sourceCode,
      language_id: languageId,
      stdin
    },
    {
      params: {
        base64_encoded: "false",
        wait: "true"
      },
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": judge0ApiKey,
        "X-RapidAPI-Host": judge0ApiHost
      },
      timeout: 20000
    }
  );

  return response.data;
}

function judgeWithLocalDemo({ problem, code, language }) {
  const results = problem.testCases.map((testCase) => {
    const output = runDemoJudge({ input: testCase.input, code, language, strategy: problem.judgeStrategy });
    return normalize(output) === normalize(testCase.expectedOutput);
  });

  const passedTests = results.filter(Boolean).length;

  return {
    passedTests,
    totalTests: problem.testCases.length,
    accepted: passedTests === problem.testCases.length,
    status: passedTests === problem.testCases.length ? "Accepted" : "Wrong Answer",
    source: "local"
  };
}

function runDemoJudge({ input, code, language, strategy }) {
  if (codeLooksEmpty(code)) return "";

  if (language === "javascript" && code.includes("console.log(solve(input))") && code.includes("return \"\"")) {
    return "";
  }

  return runStrategy({ input, code, language, strategy });
}

function runStrategy({ input, code, language, strategy }) {
  const inferredStrategy = inferStrategy(code);
  if (inferredStrategy === "none") return "";

  if (strategy === "longest-substring") {
    return solveLongestSubstring(input);
  }

  if (strategy === "valid-palindrome") {
    return solveValidPalindrome(input);
  }

  if (strategy === "best-time-stock") {
    return solveBestTimeStock(input);
  }

  if (strategy === "subarray-sum-k") {
    return solveSubarraySumK(input);
  }

  if (strategy === "product-except-self") {
    return solveProductExceptSelf(input);
  }

  if (strategy === "container-most-water") {
    return solveContainerMostWater(input);
  }

  if (strategy === "trapping-rain-water") {
    return solveTrappingRainWater(input);
  }

  if (strategy === "minimum-window-substring") {
    return solveMinimumWindowSubstring(input);
  }

  if (strategy === "two-sum") {
    return solveTwoSum(input);
  }

  const hardcoded = code.match(/(?:console\.log|print|cout\s*<<)\s*\(?\s*["']?(-?\d+)(?:\s+(-?\d+))?/);
  if (hardcoded) return [hardcoded[1], hardcoded[2]].filter(Boolean).join(" ");

  return "";
}

function solveTwoSum(input) {
  const parsed = parseNumberArrayWithTarget(input);

  const seen = new Map();
  for (let index = 0; index < parsed.nums.length; index += 1) {
    const needed = parsed.target - parsed.nums[index];
    if (seen.has(needed)) return `${seen.get(needed)} ${index}`;
    seen.set(parsed.nums[index], index);
  }

  return "";
}

function solveLongestSubstring(input) {
  const s = input.trim();
  const lastSeen = new Map();
  let left = 0;
  let best = 0;

  for (let right = 0; right < s.length; right += 1) {
    const char = s[right];
    if (lastSeen.has(char) && lastSeen.get(char) >= left) {
      left = lastSeen.get(char) + 1;
    }
    lastSeen.set(char, right);
    best = Math.max(best, right - left + 1);
  }

  return String(best);
}

function solveValidPalindrome(input) {
  const cleaned = input.toLowerCase().replace(/[^a-z0-9]/g, "");
  let left = 0;
  let right = cleaned.length - 1;

  while (left < right) {
    if (cleaned[left] !== cleaned[right]) return "false";
    left += 1;
    right -= 1;
  }

  return "true";
}

function solveBestTimeStock(input) {
  const nums = parseNumberArray(input);
  let minPrice = Infinity;
  let best = 0;

  for (const price of nums) {
    best = Math.max(best, price - minPrice);
    minPrice = Math.min(minPrice, price);
  }

  return String(best);
}

function solveSubarraySumK(input) {
  const parsed = parseNumberArrayWithTarget(input);
  const freq = new Map([[0, 1]]);
  let sum = 0;
  let count = 0;

  for (const value of parsed.nums) {
    sum += value;
    count += freq.get(sum - parsed.target) || 0;
    freq.set(sum, (freq.get(sum) || 0) + 1);
  }

  return String(count);
}

function solveProductExceptSelf(input) {
  const nums = parseNumberArray(input);
  const answer = Array(nums.length).fill(1);
  let prefix = 1;

  for (let index = 0; index < nums.length; index += 1) {
    answer[index] = prefix;
    prefix *= nums[index];
  }

  let suffix = 1;
  for (let index = nums.length - 1; index >= 0; index -= 1) {
    answer[index] *= suffix;
    suffix *= nums[index];
  }

  return answer.join(" ");
}

function solveContainerMostWater(input) {
  const heights = parseNumberArray(input);
  let left = 0;
  let right = heights.length - 1;
  let best = 0;

  while (left < right) {
    best = Math.max(best, (right - left) * Math.min(heights[left], heights[right]));
    if (heights[left] < heights[right]) left += 1;
    else right -= 1;
  }

  return String(best);
}

function solveTrappingRainWater(input) {
  const heights = parseNumberArray(input);
  let left = 0;
  let right = heights.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;

  while (left < right) {
    if (heights[left] < heights[right]) {
      leftMax = Math.max(leftMax, heights[left]);
      water += leftMax - heights[left];
      left += 1;
    } else {
      rightMax = Math.max(rightMax, heights[right]);
      water += rightMax - heights[right];
      right -= 1;
    }
  }

  return String(water);
}

function solveMinimumWindowSubstring(input) {
  const [s = "", t = ""] = input.replace(/\r/g, "").split("\n");
  if (!s || !t || t.length > s.length) return "";

  const need = new Map();
  for (const char of t) need.set(char, (need.get(char) || 0) + 1);

  const window = new Map();
  let formed = 0;
  let left = 0;
  let bestStart = 0;
  let bestLength = Infinity;

  for (let right = 0; right < s.length; right += 1) {
    const rightChar = s[right];
    window.set(rightChar, (window.get(rightChar) || 0) + 1);
    if (need.has(rightChar) && window.get(rightChar) === need.get(rightChar)) formed += 1;

    while (formed === need.size) {
      if (right - left + 1 < bestLength) {
        bestStart = left;
        bestLength = right - left + 1;
      }

      const leftChar = s[left];
      window.set(leftChar, window.get(leftChar) - 1);
      if (need.has(leftChar) && window.get(leftChar) < need.get(leftChar)) formed -= 1;
      left += 1;
    }
  }

  return bestLength === Infinity ? "" : s.slice(bestStart, bestStart + bestLength);
}

function inferStrategy(code) {
  const normalized = code.toLowerCase();

  if (hasStarterOnly(normalized)) return "none";
  if (normalized.includes("palindrome") || normalized.includes("isalnum") || normalized.includes("alphanumeric")) {
    return "valid-palindrome";
  }
  if (normalized.includes("profit") || normalized.includes("minprice") || normalized.includes("min_price")) {
    return "best-time-stock";
  }
  if (normalized.includes("substring") || normalized.includes("sliding") || normalized.includes("char") || normalized.includes("lastseen")) {
    return "longest-substring";
  }
  if (normalized.includes("prefix") && normalized.includes("suffix")) {
    return "product-except-self";
  }
  if (normalized.includes("area") || normalized.includes("container")) {
    return "container-most-water";
  }
  if (normalized.includes("water") || normalized.includes("leftmax") || normalized.includes("rightmax")) {
    return "trapping-rain-water";
  }
  if (normalized.includes("window") && normalized.includes("need")) {
    return "minimum-window-substring";
  }
  if (normalized.includes("prefix") || normalized.includes("subarray") || normalized.includes("currentsum") || normalized.includes("current_sum")) {
    return "subarray-sum-k";
  }
  if (
    normalized.includes("target") &&
    (normalized.includes("map") || normalized.includes("dict") || normalized.includes("unordered_map") || normalized.includes("for"))
  ) {
    return "two-sum";
  }

  return "none";
}

function parseNumberArrayWithTarget(input) {
  const values = input.trim().split(/\s+/).map(Number);
  const n = values[0];
  return {
    nums: values.slice(1, 1 + n),
    target: values[1 + n]
  };
}

function parseNumberArray(input) {
  const values = input.trim().split(/\s+/).map(Number);
  const n = values[0];
  return values.slice(1, 1 + n);
}

function codeLooksEmpty(code) {
  return !String(code || "").trim();
}

function hasStarterOnly(normalized) {
  return normalized.includes("parse the input here") && normalized.includes("return \"\"");
}

function normalize(value) {
  return String(value).trim().replace(/\s+/g, " ");
}
