export const problems = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    statement:
      "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target. Exactly one valid answer exists for each test case.",
    inputFormat: "First line contains n. Second line contains n integers. Third line contains target.",
    outputFormat: "Print two zero-based indices separated by a space.",
    examples: ["Input:\n4\n2 7 11 15\n9\n\nOutput:\n0 1"],
    judgeStrategy: "two-sum",
    solutionHints: {
      basic: "Think about the number each current value needs as a partner.",
      approach: "Store each visited value in a hashmap/dictionary from value to index, then check the complement before inserting.",
      "edge-case": "Duplicate values can form the answer, so do not overwrite the current index before checking.",
      optimization: "A one-pass hashmap solution is O(n) time and O(n) space."
    },
    testCases: [
      { input: "4\n2 7 11 15\n9\n", expectedOutput: "0 1" },
      { input: "3\n3 2 4\n6\n", expectedOutput: "1 2" },
      { input: "2\n3 3\n6\n", expectedOutput: "0 1" },
      { input: "5\n1 5 8 12 20\n13\n", expectedOutput: "0 3" },
      { input: "6\n10 -2 4 7 3 11\n1\n", expectedOutput: "1 4" }
    ]
  },
  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy",
    statement:
      "Given a string s, determine whether it is a palindrome after converting uppercase letters to lowercase and removing all non-alphanumeric characters.",
    inputFormat: "A single line containing string s.",
    outputFormat: "Print true if the cleaned string is a palindrome, otherwise print false.",
    examples: ["Input:\nA man, a plan, a canal: Panama\n\nOutput:\ntrue"],
    judgeStrategy: "valid-palindrome",
    solutionHints: {
      basic: "Ignore characters that are not letters or digits.",
      approach: "Use two pointers from the left and right ends of the cleaned string.",
      "edge-case": "An empty cleaned string should be considered a palindrome.",
      optimization: "You can avoid building a new string by skipping invalid characters while moving pointers."
    },
    testCases: [
      { input: "A man, a plan, a canal: Panama\n", expectedOutput: "true" },
      { input: "race a car\n", expectedOutput: "false" },
      { input: " \n", expectedOutput: "true" },
      { input: "No lemon, no melon\n", expectedOutput: "true" },
      { input: "0P\n", expectedOutput: "false" }
    ]
  },
  {
    id: "best-time-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    statement:
      "Given an array prices where prices[i] is the price of a stock on day i, return the maximum profit from choosing one day to buy and a later day to sell.",
    inputFormat: "First line contains n. Second line contains n stock prices.",
    outputFormat: "Print one integer: the maximum profit.",
    examples: ["Input:\n6\n7 1 5 3 6 4\n\nOutput:\n5"],
    judgeStrategy: "best-time-stock",
    solutionHints: {
      basic: "Track the cheapest price seen before the current day.",
      approach: "For each price, compute profit if sold today, then update the minimum buy price.",
      "edge-case": "If prices only decrease, the answer is 0.",
      optimization: "One pass is enough, so the target complexity is O(n)."
    },
    testCases: [
      { input: "6\n7 1 5 3 6 4\n", expectedOutput: "5" },
      { input: "5\n7 6 4 3 1\n", expectedOutput: "0" },
      { input: "2\n1 2\n", expectedOutput: "1" },
      { input: "6\n2 4 1 7 5 3\n", expectedOutput: "6" },
      { input: "4\n3 3 3 3\n", expectedOutput: "0" }
    ]
  },
  {
    id: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    statement:
      "Given a string s, find the length of the longest substring without repeating characters.",
    inputFormat: "A single line containing string s.",
    outputFormat: "Print one integer: the maximum length.",
    examples: ["Input:\nabcabcbb\n\nOutput:\n3"],
    judgeStrategy: "longest-substring",
    solutionHints: {
      basic: "When a duplicate appears, the valid window must move forward.",
      approach: "Use a sliding window with a map from character to its latest index.",
      "edge-case": "Strings like bbbbb and pwwkew reveal whether your left pointer moves correctly.",
      optimization: "Move the left pointer directly past the previous duplicate instead of shrinking one character at a time."
    },
    testCases: [
      { input: "abcabcbb\n", expectedOutput: "3" },
      { input: "bbbbb\n", expectedOutput: "1" },
      { input: "pwwkew\n", expectedOutput: "3" },
      { input: "dvdf\n", expectedOutput: "3" },
      { input: "abba\n", expectedOutput: "2" }
    ]
  },
  {
    id: "product-except-self",
    title: "Product of Array Except Self",
    difficulty: "Medium",
    statement:
      "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all elements of nums except nums[i]. Do not use division.",
    inputFormat: "First line contains n. Second line contains n integers.",
    outputFormat: "Print n integers separated by spaces.",
    examples: ["Input:\n4\n1 2 3 4\n\nOutput:\n24 12 8 6"],
    judgeStrategy: "product-except-self",
    solutionHints: {
      basic: "Each position needs product of everything on its left and everything on its right.",
      approach: "Build prefix products in one pass and multiply by suffix products in another pass.",
      "edge-case": "Zeros in the array are handled naturally by prefix/suffix products.",
      optimization: "You can store the answer array only, using O(1) extra space besides output."
    },
    testCases: [
      { input: "4\n1 2 3 4\n", expectedOutput: "24 12 8 6" },
      { input: "5\n-1 1 0 -3 3\n", expectedOutput: "0 0 9 0 0" },
      { input: "3\n2 3 4\n", expectedOutput: "12 8 6" },
      { input: "4\n0 0 2 3\n", expectedOutput: "0 0 0 0" },
      { input: "2\n5 7\n", expectedOutput: "7 5" }
    ]
  },
  {
    id: "container-most-water",
    title: "Container With Most Water",
    difficulty: "Medium",
    statement:
      "Given n non-negative integers height, find two lines that together with the x-axis form a container holding the most water.",
    inputFormat: "First line contains n. Second line contains n heights.",
    outputFormat: "Print one integer: the maximum area.",
    examples: ["Input:\n9\n1 8 6 2 5 4 8 3 7\n\nOutput:\n49"],
    judgeStrategy: "container-most-water",
    solutionHints: {
      basic: "Area depends on width and the shorter of the two heights.",
      approach: "Use two pointers and move the pointer with the smaller height inward.",
      "edge-case": "Two-element arrays are valid.",
      optimization: "The two-pointer method avoids checking all O(n^2) pairs."
    },
    testCases: [
      { input: "9\n1 8 6 2 5 4 8 3 7\n", expectedOutput: "49" },
      { input: "2\n1 1\n", expectedOutput: "1" },
      { input: "7\n1 3 2 5 25 24 5\n", expectedOutput: "24" },
      { input: "5\n5 4 3 2 1\n", expectedOutput: "6" },
      { input: "5\n1 2 4 3 5\n", expectedOutput: "8" }
    ]
  },
  {
    id: "subarray-sum-k",
    title: "Subarray Sum Equals K",
    difficulty: "Hard",
    statement:
      "Given an integer array nums and an integer k, return the total number of continuous subarrays whose sum equals k.",
    inputFormat: "First line contains n. Second line contains n integers. Third line contains k.",
    outputFormat: "Print one integer: the number of valid subarrays.",
    examples: ["Input:\n3\n1 1 1\n2\n\nOutput:\n2"],
    judgeStrategy: "subarray-sum-k",
    solutionHints: {
      basic: "A subarray sum can be described using the difference between two prefix sums.",
      approach: "Keep a frequency map of prefix sums. For current sum, add the count of currentSum - k.",
      "edge-case": "Negative numbers break two-pointer solutions, so prefix sums are safer.",
      optimization: "One pass with a prefix-sum frequency map gives O(n) time."
    },
    testCases: [
      { input: "3\n1 1 1\n2\n", expectedOutput: "2" },
      { input: "3\n1 2 3\n3\n", expectedOutput: "2" },
      { input: "4\n1 -1 0 2\n0\n", expectedOutput: "3" },
      { input: "5\n3 4 7 2 -3\n7\n", expectedOutput: "3" },
      { input: "6\n-1 -1 1 2 -2 3\n0\n", expectedOutput: "2" }
    ]
  },
  {
    id: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: "Hard",
    statement:
      "Given n non-negative integers representing an elevation map, compute how much water can be trapped after raining.",
    inputFormat: "First line contains n. Second line contains n heights.",
    outputFormat: "Print one integer: the total trapped water.",
    examples: ["Input:\n12\n0 1 0 2 1 0 1 3 2 1 2 1\n\nOutput:\n6"],
    judgeStrategy: "trapping-rain-water",
    solutionHints: {
      basic: "Water above an index depends on the tallest wall to its left and right.",
      approach: "Use two pointers with running leftMax and rightMax values.",
      "edge-case": "Strictly increasing or decreasing heights trap no water.",
      optimization: "Two pointers solve it in O(n) time and O(1) extra space."
    },
    testCases: [
      { input: "12\n0 1 0 2 1 0 1 3 2 1 2 1\n", expectedOutput: "6" },
      { input: "6\n4 2 0 3 2 5\n", expectedOutput: "9" },
      { input: "3\n1 2 3\n", expectedOutput: "0" },
      { input: "5\n5 4 1 2 3\n", expectedOutput: "3" },
      { input: "7\n3 0 2 0 4 0 1\n", expectedOutput: "7" }
    ]
  },
  {
    id: "minimum-window-substring",
    title: "Minimum Window Substring",
    difficulty: "Hard",
    statement:
      "Given two strings s and t, return the minimum window substring of s such that every character in t is included in the window. If no such window exists, print an empty line.",
    inputFormat: "First line contains string s. Second line contains string t.",
    outputFormat: "Print the minimum valid window substring.",
    examples: ["Input:\nADOBECODEBANC\nABC\n\nOutput:\nBANC"],
    judgeStrategy: "minimum-window-substring",
    solutionHints: {
      basic: "Track how many required characters are currently satisfied in the window.",
      approach: "Use a sliding window with frequency maps for t and the current window.",
      "edge-case": "Repeated characters in t must be counted, not just checked as present.",
      optimization: "Expand right until valid, then shrink left while preserving validity."
    },
    testCases: [
      { input: "ADOBECODEBANC\nABC\n", expectedOutput: "BANC" },
      { input: "a\na\n", expectedOutput: "a" },
      { input: "a\naa\n", expectedOutput: "" },
      { input: "aaabdabcefaecbef\nabc\n", expectedOutput: "abc" },
      { input: "ab\nb\n", expectedOutput: "b" }
    ]
  }
];
