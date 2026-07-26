import supabase from "./config/supabase.js";

async function testInsert() {
  console.log("🚀 Starting test insert...");

  // 1. Try to insert a row into the rooms table
  const { data, error } = await supabase
    .from("rooms")
    .insert([
      {
        room_code: "TEST12",
        status: "waiting",
        match_type: "Blitz",
        difficulty: "easy",
        company: "All",
        match_type: "Blitz",
        // Only include columns that actually exist in your table
      },
    ])
    .select();

  if (error) {
    console.error("❌ INSERT FAILED!");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Details:", error.details);
  } else {
    console.log("✅ INSERT SUCCESS! Row:", data);
  }
}

testInsert();
