import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://eqjakeissuxsojgvvwxv.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ?? "";

const BEARS_ESPN_TEAM_ID = "3";

// Converts a UTC ISO timestamp (e.g. from ESPN) into Chicago-local date/time parts.
// Crossing midnight UTC can shift the calendar date, so date and time must both
// be derived from the same Chicago-zoned conversion rather than splitting the raw ISO string.
function toChicagoDateAndTime(isoUtc: string) {
  const d = new Date(isoUtc);
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  return { date, time };
}

// Fetches the Bears 2026 schedule from ESPN, finds matching home-game rows in
// our events table by date, and updates+logs any game time changes.
async function syncBears(supabase: ReturnType<typeof createClient>, changes: string[]) {
  const espnRes = await fetch(
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/3/schedule?season=2026"
  );
  const espnData = await espnRes.json();

  for (const event of espnData.events ?? []) {
    const competition = event.competitions?.[0];
    const homeCompetitor = competition?.competitors?.find(
      (c: { team?: { id?: string }; homeAway?: string }) =>
        c.team?.id === BEARS_ESPN_TEAM_ID && c.homeAway === "home"
    );
    if (!homeCompetitor) continue; // Bears are away in this game

    const { date: dateStr, time: newTime } = toChicagoDateAndTime(
      competition?.date ?? event.date
    );

    // Find matching event in our database
    const { data: events } = await supabase
      .from("events")
      .select("id, time, title")
      .eq("date", dateStr)
      .eq("team", "bears");

    if (!events || events.length === 0) continue;

    for (const ev of events) {
      if (ev.time !== newTime) {
        // Time changed — update it
        await supabase.from("events").update({ time: newTime }).eq("id", ev.id);

        // Log the change
        await supabase.from("game_time_changes").insert({
          event_id: ev.id,
          old_time: ev.time,
          new_time: newTime,
        });

        changes.push(`${ev.title} on ${dateStr}: ${ev.time} → ${newTime}`);
      }
    }
  }
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Fetch Cubs 2026 home schedule from MLB Stats API
  const mlbRes = await fetch(
    "https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=112&startDate=2026-03-26&endDate=2026-09-27&gameType=R"
  );
  const mlbData = await mlbRes.json();

  const changes: string[] = [];

  for (const date of mlbData.dates ?? []) {
    for (const game of date.games ?? []) {
      // Only home games
      if (game.teams?.home?.team?.id !== 112) continue;

      const gameDate = new Date(game.gameDate);
      const newTime = gameDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Chicago",
      });
      const dateStr = date.date; // YYYY-MM-DD

      // Find matching event in our database
      const { data: events } = await supabase
        .from("events")
        .select("id, time, title")
        .eq("date", dateStr)
        .eq("team", "cubs")
        .eq("assignee", "Phil");

      if (!events || events.length === 0) continue;

      for (const event of events) {
        if (event.time !== newTime) {
          // Time changed — update it
          await supabase
            .from("events")
            .update({ time: newTime })
            .eq("id", event.id);

          // Log the change
          await supabase.from("game_time_changes").insert({
            event_id: event.id,
            old_time: event.time,
            new_time: newTime,
          });

          changes.push(`${event.title} on ${dateStr}: ${event.time} → ${newTime}`);
        }
      }
    }
  }

  // Sync Bears 2026 home schedule from ESPN
  await syncBears(supabase, changes);

  return new Response(
    JSON.stringify({
      success: true,
      changes_detected: changes.length,
      changes,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});