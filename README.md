# The Engagement Planner

A shared guest list, budget tracker, and Kanban task board for Arush &amp; Sayee — free to host, synced live between both of you, with a daily email reminder for due tasks.

**Stack:** React + Vite (frontend) · Firebase Firestore (free shared database) · GitHub Pages (free hosting) · GitHub Actions + Gmail (free daily reminder email)

---

## 1. Create a free Firebase project (the shared database)

1. Go to https://console.firebase.google.com → **Add project** → give it any name (e.g. `arush-sayee-planner`) → skip Google Analytics if asked.
2. In the left sidebar, click **Build → Firestore Database → Create database**. Choose **Start in test mode** for now (we'll tighten this below), pick any region close to India (e.g. `asia-south1`).
3. Click the gear icon → **Project settings** → scroll to **Your apps** → click the **</>** (web) icon → register an app (any nickname) → **don't** check "Firebase Hosting".
4. Firebase will show you a `firebaseConfig` object with values like `apiKey`, `authDomain`, etc. Keep this tab open — you'll need these six values in step 3.
5. **Secure the database** (important — test mode is wide open to anyone): go to Firestore → **Rules** tab and replace the contents with:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /planner/shared {
         allow read, write: if true;
       }
     }
   }
   ```

   This still allows anyone with your Firebase project ID to read/write — fine for a private two-person planner nobody else knows about, but don't share the project ID publicly. (If you want real security later, add Firebase Authentication — happy to help with that when you're ready.)

6. Still in Project settings, go to the **Service accounts** tab → **Generate new private key**. This downloads a JSON file — you'll need its full contents for the reminder email script. Keep it secret; never commit it to GitHub.

## 2. Create the GitHub repo

1. On GitHub, create a new **public** repo (GitHub Pages is free for public repos) — e.g. `engagement-planner`.
2. Update `vite.config.js` in this project: change `base: "/engagement-planner/"` to match your actual repo name if different.
3. Push this whole project folder to that repo:

   ```
   git init
   git add .
   git commit -m "Initial planner app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/engagement-planner.git
   git push -u origin main
   ```

4. On GitHub, go to **Settings → Pages** → under "Build and deployment", set **Source** to **GitHub Actions**.

## 3. Add your secrets

Go to **Settings → Secrets and variables → Actions → New repository secret** and add each of these:

| Secret name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | from your Firebase config |
| `VITE_FIREBASE_AUTH_DOMAIN` | from your Firebase config |
| `VITE_FIREBASE_PROJECT_ID` | from your Firebase config |
| `VITE_FIREBASE_STORAGE_BUCKET` | from your Firebase config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | from your Firebase config |
| `VITE_FIREBASE_APP_ID` | from your Firebase config |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | paste the **entire contents** of the service account JSON file from step 1.6 |
| `GMAIL_USER` | the Gmail address reminders will be sent from |
| `GMAIL_APP_PASSWORD` | a Gmail **App Password** (not your normal password — see below) |
| `REMINDER_RECIPIENTS` | both your emails, comma-separated, e.g. `arush@gmail.com,sayee@gmail.com` |

**Getting a Gmail App Password:** your Google account needs 2-Step Verification turned on (Google Account → Security). Then go to https://myaccount.google.com/apppasswords, create one named "Engagement Planner", and copy the 16-character password it gives you — that's `GMAIL_APP_PASSWORD`.

## 4. Deploy

Push to `main` (or re-run manually from the **Actions** tab). The `deploy.yml` workflow builds the site and publishes it to `https://<your-username>.github.io/engagement-planner/`. Share that link with Sayee — you'll both be editing the same live data.

## 5. Reminders

`reminders.yml` runs daily (8:00 AM IST by default — edit the cron line in that file to change it) and emails both of you a summary of any task due today or overdue. You can also trigger it manually anytime from the **Actions** tab → "Daily task reminders" → **Run workflow**, to test it without waiting for the schedule.

## Local development (optional)

```
npm install
cp .env.example .env.local   # fill in your Firebase values
npm run dev
```

## Notes

- Since there's no login, anyone with the live link can view and edit the planner — that's the tradeoff for keeping this free and simple. Don't post the link publicly.
- All data lives in one Firestore document (`planner/shared`), which is free to use up to Firebase's generous daily quota (50K reads / 20K writes per day) — more than enough for two people.
