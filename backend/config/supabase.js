import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Ensure it reads from the correct path just like index.js
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// 1. Remove the 'export' keyword from this line
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder'
);

// 2. Add this line at the very bottom to make it the default!
export default supabase;