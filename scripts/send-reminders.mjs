// Reads the shared planner data from Firestore and emails a reminder
// (via Gmail) for any task that's due today or overdue and not marked Done.
// Runs on a daily schedule via .github/workflows/reminders.yml

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import nodemailer from "nodemailer";

function requireEnv(name) {
  const val = process.env[name];
  if (!val) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return val;
}

const serviceAccountJson = requireEnv("FIREBASE_SERVICE_ACCOUNT_JSON");
const gmailUser = requireEnv("GMAIL_USER");
const gmailAppPassword = requireEnv("GMAIL_APP_PASSWORD");
const recipients = requireEnv("REMINDER_RECIPIENTS"); // comma-separated emails

const serviceAccount = JSON.parse(serviceAccountJson);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const snap = await db.collection("planner").doc("shared").get();
  if (!snap.exists) {
    console.log("No planner data yet — nothing to remind about.");
    return;
  }
  const data = snap.data();
  const tasks = data.tasks || [];
  const today = todayStr();

  const due = tasks.filter((t) => t.status !== "done" && t.due && t.due <= today);

  if (due.length === 0) {
    console.log("No due or overdue tasks today — skipping email.");
    return;
  }

  const overdue = due.filter((t) => t.due < today);
  const dueToday = due.filter((t) => t.due === today);

  const lines = [];
  if (dueToday.length) {
    lines.push("Due today:");
    dueToday.forEach((t) => lines.push(`  • ${t.title} (${t.assignee})`));
  }
  if (overdue.length) {
    lines.push("");
    lines.push("Overdue:");
    overdue.forEach((t) => lines.push(`  • ${t.title} (${t.assignee}) — was due ${t.due}`));
  }

  const text = lines.join("\n");
  const html = `<pre style="font-family: -apple-system, sans-serif; font-size: 14px;">${text.replace(/</g, "&lt;")}</pre>`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailAppPassword },
  });

  await transporter.sendMail({
    from: `"Engagement Planner" <${gmailUser}>`,
    to: recipients.split(",").map((s) => s.trim()),
    subject: `Engagement planner: ${due.length} task${due.length === 1 ? "" : "s"} need attention`,
    text,
    html,
  });

  console.log(`Sent reminder email for ${due.length} task(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
