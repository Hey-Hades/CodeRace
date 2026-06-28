// utils/harnessGenerator.js

const cppToCanonicalMap = {
  int: "integer",
  "long long": "long",
  double: "float",
  string: "string",
  bool: "boolean",
  char: "character",
  "vector<int>": "integer[]",
  "vector<long long>": "long[]",
  "vector<char>": "character[]",
  "vector<string>": "string[]",
  "vector<vector<int>>": "integer[][]",
  "vector<vector<char>>": "character[][]",
  "vector<vector<string>>": "string[][]",
  "ListNode*": "linked_list",
  "TreeNode*": "binary_tree",
  "GraphNode*": "graph",
  "DLLNode*": "dll",
  "NaryNode*": "nary_tree",
  "RandomNode*": "random_list",
  "pair<int, int>": "int_pair",
  "pair<int,int>": "int_pair",
};

const normalizeCppType = (typeStr) =>
  typeStr
    ? typeStr
        .trim()
        .replace(/\s*\*\s*/g, "*")
        .replace(/\s*&\s*/g, "&")
    : "";
const getCanonicalType = (rawType) => {
  if (!rawType) return "";
  let clean = rawType.replace(/&/g, "").trim();
  return cppToCanonicalMap[clean] || cppToCanonicalMap[rawType] || clean;
};

const serializeToStdin = (val, type) => {
  if (val === null || val === undefined) return "0";
  if (type === "boolean") return val ? "1" : "0";
  if (["integer", "long", "float", "string", "character"].includes(type))
    return `${val}`;
  if (
    [
      "integer[]",
      "long[]",
      "string[]",
      "character[]",
      "linked_list",
      "binary_tree",
      "dll",
      "nary_tree",
    ].includes(type)
  ) {
    if (!Array.isArray(val)) return "0";
    return `${val.length} ${val.map((v) => (v === null ? "null" : v)).join(" ")}`;
  }
  if (
    [
      "integer[][]",
      "long[][]",
      "string[][]",
      "character[][]",
      "boolean[][]",
    ].includes(type)
  ) {
    if (!Array.isArray(val)) return "0";
    let result = `${val.length}`;
    for (const row of val) {
      if (!Array.isArray(row)) {
        result += " 0";
        continue;
      }
      result +=
        ` ${row.length} ` + row.map((v) => (v === null ? "null" : v)).join(" ");
    }
    return result;
  }
  if (type === "graph") {
    if (!Array.isArray(val) || val.length === 0) return "0";
    let result = `${val.length}`;
    for (const neighbors of val)
      result += ` ${neighbors.length} ` + neighbors.join(" ");
    return result;
  }
  if (type === "random_list") {
    if (!Array.isArray(val) || val.length === 0) return "0";
    let result = `${val.length}`;
    for (const pair of val)
      result += ` ${pair[0]} ${pair[1] === null ? "null" : pair[1]}`;
    return result;
  }
  if (type === "int_pair") {
    if (!Array.isArray(val) || val.length !== 2) return "0 0";
    return `${val[0]} ${val[1]}`;
  }
  return "";
};

const extractMetadataFallback = (userCode) => {
  const publicSection = userCode.split(/public\s*:/)[1] || userCode;
  const matchSignature = publicSection.match(
    /([\w<>&:* \t]+?)\s+(\w+)\s*\(([^)]*)\)\s*\{/,
  );
  if (!matchSignature)
    throw new Error("Could not parse method signature from code.");

  const return_type = normalizeCppType(matchSignature[1]);
  const function_name = matchSignature[2];
  const parameters =
    matchSignature[3].trim() === ""
      ? []
      : matchSignature[3].split(",").map((arg) => {
          const parts = arg.trim().split(/\s+/);
          let name = parts.pop();
          let rawType = parts.join(" ");
          if (name.startsWith("*")) {
            name = name.slice(1);
            rawType += "*";
          }
          if (name.startsWith("&")) {
            name = name.slice(1);
            rawType += "&";
          }
          return { name, type: normalizeCppType(rawType) };
        });

  return { class_name: "Solution", function_name, parameters, return_type };
};

const generateTypeParserCpp = (type, varName, tab) => {
  if (type === "integer") return `${tab}int ${varName}; cin >> ${varName};\n`;
  if (type === "long")
    return `${tab}long long ${varName}; cin >> ${varName};\n`;
  if (type === "float") return `${tab}double ${varName}; cin >> ${varName};\n`;
  if (type === "string") return `${tab}string ${varName}; cin >> ${varName};\n`;
  if (type === "character")
    return `${tab}char ${varName}; cin >> ${varName};\n`;
  if (type === "boolean") return `${tab}bool ${varName}; cin >> ${varName};\n`;

  if (type === "linked_list")
    return `${tab}ListNode* ${varName} = readLinkedList();\n`;
  if (type === "binary_tree")
    return `${tab}TreeNode* ${varName} = readBinaryTree();\n`;
  if (type === "dll") return `${tab}DLLNode* ${varName} = readDLL();\n`;
  if (type === "graph") return `${tab}GraphNode* ${varName} = readGraph();\n`;
  if (type === "nary_tree")
    return `${tab}NaryNode* ${varName} = readNaryTree();\n`;
  if (type === "random_list")
    return `${tab}RandomNode* ${varName} = readRandomList();\n`;
  if (type === "int_pair")
    return `${tab}int f_${varName}, s_${varName}; cin >> f_${varName} >> s_${varName};\n${tab}pair<int,int> ${varName} = {f_${varName}, s_${varName}};\n`;

  // 1D Arrays
  if (
    ["integer[]", "long[]", "string[]", "character[]", "boolean[]"].includes(
      type,
    )
  ) {
    let inner = type.replace("[]", "");
    if (inner === "integer") inner = "int"; // 🔥 FIX: map 'integer' to 'int'
    if (inner === "long") inner = "long long";
    if (inner === "character") inner = "char";
    if (inner === "boolean") inner = "bool"; // Added boolean array support just in case

    return `${tab}int size_${varName}; cin >> size_${varName};\n${tab}vector<${inner}> ${varName}(size_${varName});\n${tab}for(int j=0; j<size_${varName}; j++) cin >> ${varName}[j];\n`;
  }

  // 2D Arrays (Jagged)
  if (
    [
      "integer[][]",
      "long[][]",
      "string[][]",
      "character[][]",
      "boolean[][]",
    ].includes(type)
  ) {
    let inner = type.replace("[][]", "");
    if (inner === "integer") inner = "int"; // 🔥 FIX: map 'integer' to 'int'
    if (inner === "long") inner = "long long";
    if (inner === "character") inner = "char";
    if (inner === "boolean") inner = "bool";

    return `${tab}int r_${varName}; cin >> r_${varName};\n${tab}vector<vector<${inner}>> ${varName}(r_${varName});\n${tab}for(int i=0; i<r_${varName}; i++) { int c_${varName}; cin >> c_${varName}; ${varName}[i].resize(c_${varName}); for(int j=0; j<c_${varName}; j++) cin >> ${varName}[i][j]; }\n`;
  }
  return "";
};
const getBaseIncludes = () => `
#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <stack>
#include <sstream>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <cmath>
#include <algorithm>
using namespace std;

struct ListNode { int val; ListNode *next; ListNode(int x) : val(x), next(NULL) {} };
struct TreeNode { int val; TreeNode *left; TreeNode *right; TreeNode(int x) : val(x), left(NULL), right(NULL) {} };
struct DLLNode { int val; DLLNode *prev, *next; DLLNode(int x) : val(x), prev(NULL), next(NULL) {} };
class GraphNode { public: int val; vector<GraphNode*> neighbors; GraphNode() { val = 0; } GraphNode(int _val) { val = _val; } GraphNode(int _val, vector<GraphNode*> _neighbors) { val = _val; neighbors = _neighbors; } };
class NaryNode { public: int val; vector<NaryNode*> children; NaryNode() {} NaryNode(int _val) { val = _val; } NaryNode(int _val, vector<NaryNode*> _children) { val = _val; children = _children; } };
class RandomNode { public: int val; RandomNode *next, *random; RandomNode(int _val) { val = _val; next = NULL; random = NULL; } };

ListNode* readLinkedList() { int size; if (!(cin >> size) || size == 0) return nullptr; int val; cin >> val; ListNode* head = new ListNode(val); ListNode* curr = head; for(int i = 1; i < size; i++) { cin >> val; curr->next = new ListNode(val); curr = curr->next; } return head; }
TreeNode* readBinaryTree() { int size; if (!(cin >> size) || size == 0) return nullptr; vector<string> tokens(size); for(int i = 0; i < size; i++) cin >> tokens[i]; if (tokens[0] == "null") return nullptr; TreeNode* root = new TreeNode(stoi(tokens[0])); queue<TreeNode*> q; q.push(root); int i = 1; while(!q.empty() && i < size) { TreeNode* curr = q.front(); q.pop(); if (i < size && tokens[i] != "null") { curr->left = new TreeNode(stoi(tokens[i])); q.push(curr->left); } i++; if (i < size && tokens[i] != "null") { curr->right = new TreeNode(stoi(tokens[i])); q.push(curr->right); } i++; } return root; }
DLLNode* readDLL() { int size; if (!(cin >> size) || size == 0) return nullptr; int val; cin >> val; DLLNode* head = new DLLNode(val); DLLNode* curr = head; for(int i = 1; i < size; i++) { cin >> val; DLLNode* newNode = new DLLNode(val); curr->next = newNode; newNode->prev = curr; curr = newNode; } return head; }
GraphNode* readGraph() { int n; if (!(cin >> n) || n == 0) return nullptr; vector<GraphNode*> nodes(n + 1); for (int i = 1; i <= n; ++i) nodes[i] = new GraphNode(i); for (int i = 1; i <= n; ++i) { int k; cin >> k; for (int j = 0; j < k; ++j) { int nv; cin >> nv; nodes[i]->neighbors.push_back(nodes[nv]); } } return n > 0 ? nodes[1] : nullptr; }
NaryNode* readNaryTree() { int size; if (!(cin >> size) || size == 0) return nullptr; vector<string> tokens(size); for(int i=0; i<size; i++) cin >> tokens[i]; if(tokens[0] == "null") return nullptr; NaryNode* root = new NaryNode(stoi(tokens[0])); queue<NaryNode*> q; q.push(root); int i = 1; while(!q.empty() && i < size) { NaryNode* curr = q.front(); q.pop(); if (i < size && tokens[i] == "null") i++; while(i < size && tokens[i] != "null") { NaryNode* child = new NaryNode(stoi(tokens[i++])); curr->children.push_back(child); q.push(child); } } return root; }
RandomNode* readRandomList() { int size; if (!(cin >> size) || size == 0) return nullptr; vector<RandomNode*> nodes(size); vector<string> randomIdx(size); for(int i=0; i<size; i++) { int val; string ridx; cin >> val >> ridx; nodes[i] = new RandomNode(val); randomIdx[i] = ridx; if(i > 0) nodes[i-1]->next = nodes[i]; } for(int i=0; i<size; i++) { if(randomIdx[i] != "null") nodes[i]->random = nodes[stoi(randomIdx[i])]; } return nodes.size() ? nodes[0] : nullptr; }

template<typename T> bool checkExpected(T a, T b) { return a == b; }
template<typename T> bool checkExpected(vector<T> const& a, vector<T> const& b) { return a == b; }
template<typename T> bool checkExpected(vector<vector<T>> const& a, vector<vector<T>> const& b) { return a == b; }
template<typename T, typename U> bool checkExpected(pair<T, U> const& a, pair<T, U> const& b) { return a.first == b.first && a.second == b.second; }
bool checkExpected(ListNode* a, ListNode* b) { while (a && b) { if (a->val != b->val) return false; a = a->next; b = b->next; } return a == nullptr && b == nullptr; }
bool checkExpected(TreeNode* a, TreeNode* b) { if (!a && !b) return true; if (!a || !b || a->val != b->val) return false; return checkExpected(a->left, b->left) && checkExpected(a->right, b->right); }
bool checkExpected(DLLNode* a, DLLNode* b) { DLLNode* tailA = nullptr; DLLNode* tailB = nullptr; while (a && b) { if (a->val != b->val) return false; tailA = a; tailB = b; a = a->next; b = b->next; } if (a != nullptr || b != nullptr) return false; while (tailA && tailB) { if (tailA->val != tailB->val) return false; tailA = tailA->prev; tailB = tailB->prev; } return tailA == nullptr && tailB == nullptr; }
bool checkExpected(NaryNode* a, NaryNode* b) { if (!a && !b) return true; if (!a || !b || a->val != b->val || a->children.size() != b->children.size()) return false; for(size_t i=0; i<a->children.size(); i++) { if(!checkExpected(a->children[i], b->children[i])) return false; } return true; }
bool checkExpected(RandomNode* a, RandomNode* b) { unordered_map<RandomNode*, RandomNode*> m; RandomNode* cA = a; RandomNode* cB = b; while(cA && cB) { if(cA->val != cB->val) return false; m[cA] = cB; cA = cA->next; cB = cB->next; } if(cA || cB) return false; cA = a; cB = b; while(cA && cB) { if(cA->random && !cB->random) return false; if(!cA->random && cB->random) return false; if(cA->random && cB->random && cA->random->val != cB->random->val) return false; cA = cA->next; cB = cB->next; } return true; }
bool checkExpected(GraphNode* res, GraphNode* exp) { if (!res && !exp) return true; if (!res || !exp) return false; unordered_map<GraphNode*, GraphNode*> visited; queue<pair<GraphNode*, GraphNode*>> q; q.push({res, exp}); visited[res] = exp; while(!q.empty()) { auto [r, e] = q.front(); q.pop(); if (r->val != e->val || r->neighbors.size() != e->neighbors.size()) return false; for(size_t i=0; i<r->neighbors.size(); i++) { if (visited.count(r->neighbors[i])) { if (visited[r->neighbors[i]] != e->neighbors[i]) return false; } else { visited[r->neighbors[i]] = e->neighbors[i]; q.push({r->neighbors[i], e->neighbors[i]}); } } } return true; }
`;

const generateBatchCppWrapper = (userCode, metadata, testCases) => {
  let finalMeta = metadata;
  if (!finalMeta || !finalMeta.parameters) {
    finalMeta = extractMetadataFallback(userCode);
  }

  const returnType =
    finalMeta.return_type || extractMetadataFallback(userCode).return_type;
  const canonicalReturnType = getCanonicalType(returnType);
  const isVoid = canonicalReturnType === "void" || canonicalReturnType === "";
  const effectiveCanonicalReturnType =
    isVoid && finalMeta.parameters.length > 0
      ? getCanonicalType(finalMeta.parameters[0].type)
      : canonicalReturnType;

  let code =
    getBaseIncludes() +
    `\n${userCode}\n\nint main() {\n  int total_cases;\n  if (!(cin >> total_cases)) return 0;\n  Solution obj;\n  int passed_count = 0;\n\n  for (int t = 0; t < total_cases; t++) {\n`;

  const args = [];
  finalMeta.parameters.forEach((param, idx) => {
    const varName = `arg_${idx}`;
    args.push(varName);
    code += generateTypeParserCpp(
      getCanonicalType(param.type),
      varName,
      "    ",
    );
  });

  code += `\n    int has_expected_check; cin >> has_expected_check;\n`;
  code += generateTypeParserCpp(
    effectiveCanonicalReturnType,
    "expected_val",
    "    ",
  );

  if (isVoid) {
    code += `\n    obj.${finalMeta.function_name}(${args.join(", ")});\n    auto result = arg_0;\n`;
  } else {
    code += `\n    auto result = obj.${finalMeta.function_name}(${args.join(", ")});\n`;
  }

  // Direct C++ evaluation
  code += `
    if (has_expected_check == 1) {
      if (checkExpected(result, expected_val)) { passed_count++; }
    }
  }
  cout << "\\nRESULT|" << passed_count << "/" << total_cases << "\\n";
  return 0;
}
`;

  let stdinPayload = `${testCases.length}\n`;
  testCases.forEach((tc) => {
    finalMeta.parameters.forEach(
      (param, idx) =>
        (stdinPayload +=
          serializeToStdin(tc.inputs[idx], getCanonicalType(param.type)) +
          "\n"),
    );
    if (tc.expected !== undefined)
      stdinPayload += `1\n${serializeToStdin(tc.expected, getCanonicalType(effectiveCanonicalReturnType))}\n`;
    else stdinPayload += `0\n0\n`;
  });

  return { sourceCode: code, stdin: stdinPayload };
};

const generateOopCppWrapper = (userCode, testCases) => {
  let code = `#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\n${userCode}\n\nint main() {\n  int passed_count = 0;\n  int total_cases = ${testCases.length};\n`;

  testCases.forEach((tc, idx) => {
    const className = tc.commands[0];
    const constructorArgs = tc.args[0].join(", ");
    const expectedString = JSON.stringify(tc.expected).replace(/\s/g, "");

    code += `  {\n    string out = "[null";\n    ${className}* obj_${idx} = new ${className}(${constructorArgs});\n`;

    for (let i = 1; i < tc.commands.length; i++) {
      let cmd = tc.commands[i];
      let argStr = tc.args[i]
        .map((a) => (typeof a === "string" ? `"${a}"` : a))
        .join(", ");
      code += `    out += ",";\n`;
      if (tc.expected[i] === null) {
        code += `    obj_${idx}->${cmd}(${argStr}); out += "null";\n`;
      } else {
        code += `    auto res_${idx}_${i} = obj_${idx}->${cmd}(${argStr});\n`;
        // Basic string appender mapping for primitive OOP results
        code += `    if constexpr (is_same_v<decltype(res_${idx}_${i}), bool>) out += (res_${idx}_${i} ? "true" : "false");\n`;
        code += `    else if constexpr (is_same_v<decltype(res_${idx}_${i}), string>) out += "\\"" + res_${idx}_${i} + "\\"";\n`;
        code += `    else out += to_string(res_${idx}_${i});\n`;
      }
    }
    code += `    out += "]";\n`;
    code += `    if (out == "${expectedString}") passed_count++;\n  }\n`;
  });
  code += `  cout << "\\nRESULT|" << passed_count << "/" << total_cases << "\\n";\n  return 0;\n}\n`;

  return { sourceCode: code, stdin: "" };
};

export const generatePayload = (language, userCode, metadata, testCases) => {
  if (language === "cpp") {
    const isStateful = testCases[0] && testCases[0].commands !== undefined;
    if (isStateful) {
      return generateOopCppWrapper(userCode, testCases);
    } else {
      return generateBatchCppWrapper(userCode, metadata, testCases);
    }
  }

  // Future fallback hooks for Node / Python / Java
  throw new Error(
    `Testing harness for language [${language}] is not fully implemented yet.`,
  );
};
