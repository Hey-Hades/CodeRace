export const starterCode = {
  javascript: `const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim();

function solve(rawInput) {
  // Parse the input here and print only the final answer.
  // Tip: read the problem panel carefully before choosing a data structure.
  return "";
}

console.log(solve(input));`,
  python: `import sys

raw_input = sys.stdin.read().strip()

def solve(data: str) -> str:
    # Parse the input here and return only the final answer.
    # Tip: read the problem panel carefully before choosing a data structure.
    return ""

print(solve(raw_input))`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Parse the input here and print only the final answer.
    // Tip: read the problem panel carefully before choosing a data structure.

    return 0;
}`
};

export const languageLabels = {
  javascript: "JavaScript",
  python: "Python",
  cpp: "C++"
};
