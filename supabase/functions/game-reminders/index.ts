import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://eqjakeissuxsojgvvwxv.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ?? "";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER") ?? "";

const PHIL_PHONE = "+17089975028";
const GEORGE_PHONE = "+17082855028";

const SETTLED_DISPOSITIONS = ["Sold", "Exchanged", "Gave Away"];
const APP_URL = "https://phil-george-tickets.netlify.app";

function dateStrFromOffset(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDayDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

async function sendSms(to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: to,
      From: TWILIO_PHONE_NUMBER,
      Body: body,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twilio send to ${to} failed: ${res.status} ${errText}`);
  }
}

type EventRow = {
  id: string;
  title: string;
  date: string;
  time: string;
  phil_status: string | null;
  george_status: string | null;
  disposition: string | null;
};

async function processOffset(
  supabase: ReturnType<typeof createClient>,
  offsetDays: number,
  sent: string[],
  errors: string[],
) {
  const dateStr = dateStrFromOffset(offsetDays);

  const { data: events } = await supabase
    .from("events")
    .select("id, title, date, time, phil_status, george_status, disposition")
    .eq("date", dateStr);

  for (const event of (events ?? []) as EventRow[]) {
    if (event.disposition && SETTLED_DISPOSITIONS.includes(event.disposition)) continue;

    const dayDate = formatDayDate(event.date);
    const bothOut = event.phil_status === "out" && event.george_status === "out";
    const eitherUndecided = event.phil_status === null || event.george_status === null;

    try {
      if (offsetDays === 7 && bothOut && !event.disposition) {
        const msg = `${event.title} is in 7 days and you're both out. Tickets still need to be settled. Open the app: ${APP_URL}`;
        await sendSms(PHIL_PHONE, msg);
        sent.push(`${event.title} (both-out, Phil only)`);
        continue;
      }

      if (!eitherUndecided) continue;

      const msg =
        offsetDays === 7
          ? `${event.title} is in 7 days (${dayDate} at ${event.time}). Neither of you has marked availability yet. Open the app: ${APP_URL}`
          : `Reminder: ${event.title} is in 2 days (${dayDate} at ${event.time}). Availability still undecided. Open the app: ${APP_URL}`;

      await sendSms(PHIL_PHONE, msg);
      await sendSms(GEORGE_PHONE, msg);
      sent.push(`${event.title} (${offsetDays}d, both)`);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const sent: string[] = [];
  const errors: string[] = [];

  await processOffset(supabase, 7, sent, errors);
  await processOffset(supabase, 2, sent, errors);

  return new Response(
    JSON.stringify({
      success: errors.length === 0,
      reminders_sent: sent.length,
      sent,
      errors,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
