# CodeRace

Real-time multiplayer coding race starter project.

## What Works Now

- Create a private room
- Join with a room code
- Two-player waiting lobby
- Host difficulty selection: Easy, Medium, Hard
- Start synchronized coding race
- Live progress updates through Socket.io
- Monaco code editor
- Starter code that does not reveal the answer
- Demo judging for multiple DSA problem types
- Score penalties for hints and wrong submissions
- Winner/result screen
- AI hint/review placeholders with optional API hooks

## Project Structure

```txt
coderace/
  client/   React + Vite frontend
  server/   Express + Socket.io backend
```

## Run Locally

Install dependencies:

```bash
npm install
```

Start both apps:

```bash
npm run dev
```

Open:

```txt
http://localhost:5173
```

Backend runs on:

```txt
http://localhost:4000
```

## Test Multiplayer

1. Open `http://localhost:5173` in two browser tabs.
2. Enter a name in tab one and create a room.
3. Copy the room code.
4. Enter another name in tab two and join the room.
5. Choose Easy, Medium, or Hard from the host tab.
6. Start the race from the lobby.
7. Submit code from either tab.

## Local Problem Database

```txt
server/src/problems.js
```

The backend currently uses this file as the problem database. Each race randomly picks one problem from the selected difficulty.

Problems included:

```txt
Easy:
- Two Sum
- Valid Palindrome
- Best Time to Buy and Sell Stock

Medium:
- Longest Substring Without Repeating Characters
- Product of Array Except Self
- Container With Most Water

Hard:
- Subarray Sum Equals K
- Trapping Rain Water
- Minimum Window Substring
```

When you move to Supabase, this file can become your seed data for the `problems` table.

## Example Easy Solution

For JavaScript:

```js
const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split(/\s+/).map(Number);
const n = input[0];
const nums = input.slice(1, 1 + n);
const target = input[1 + n];
const seen = new Map();
for (let i = 0; i < n; i++) {
  const need = target - nums[i];
  if (seen.has(need)) {
    console.log(seen.get(need), i);
    break;
  }
  seen.set(nums[i], i);
}
```

## Adding Judge0

Judge0 support is now wired in `server/src/services/judge.js`.

1. Create or open `server/.env`.
2. Set these values:

```txt
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_key_here
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
```

3. Restart the backend:

```bash
npm run dev:server
```

When these values are empty, CodeRace uses the local demo judge. When they are filled, it sends each hidden test case to Judge0 and compares the output.

## Adding AI

Gemini support is already wired through `server/src/services/ai.js`.

1. Create an API key in Google AI Studio.
2. Open `server/.env`.
3. Paste your key:

```txt
GEMINI_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-2.5-flash
```

4. Restart the backend:

```bash
npm run dev:server
```

When no key is set, CodeRace still works using built-in fallback hints and reviews.

## Adding Supabase

Supabase persistence is wired through `server/src/services/database.js`.

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run the SQL in:

```txt
server/supabase/schema.sql
```

4. Open `server/.env`.
5. Set:

```txt
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

6. Restart the backend:

```bash
npm run dev:server
```

The backend saves:

```txt
matches
match_players
submissions
ai_hints
```

Use the service role key only on the backend. Never put it in React/Vite frontend code.

## Integration Status

Check whether APIs are configured:

```txt
http://localhost:4000/integrations
```

The response shows:

```json
{
  "gemini": true,
  "judge0": true,
  "supabase": true
}
```

Values become `true` after you add the corresponding keys and restart the backend.
