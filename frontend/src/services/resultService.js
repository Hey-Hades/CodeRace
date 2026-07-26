import { supabase } from "../utils/supabaseClient";

export const saveRaceResult = async (user, resultData) => {
  // 1. If User exists, save to Database
  if (user) {
    const { data, error } = await supabase.from("results").insert([
      {
        user_id: user.id,
        wpm: resultData.wpm,
        accuracy: resultData.accuracy,
        time_taken: resultData.timeTaken,
        created_at: new Date(),
      },
    ]);

    if (error) throw error;
    return { type: "database", data };
  }

  // 2. If NO User, save to LocalStorage (Temporary)
  else {
    const tempResults = JSON.parse(
      localStorage.getItem("temp_results") || "[]",
    );
    const newResult = { ...resultData, id: Date.now(), isGuest: true };

    tempResults.push(newResult);
    localStorage.setItem("temp_results", JSON.stringify(tempResults));

    return { type: "local", data: newResult };
  }
};
