# Release runbook

Order matters here. Two items are pure wall-clock time and gate everything after them, so
they go first even though they are not engineering work.

---

## Start these today — they are the critical path

### 1. Recruit 12 Play testers
A new personal Play account needs **12 testers opted in for 14 continuous days** of closed
testing before it gets production access. The clock does not start until the closed test is
live with testers actually opted in.

This is the single longest lead item in the project, it is wall-clock rather than work, and
it has not started. **Aim for 15** — people change phones, uninstall, or drop out, and
falling below 12 restarts the clock.

Draft ask: `scratchpad/ask-play-testers.md`.

### 2. Get `DELETE /api/auth/me` built
Apple 5.1.1(v). **iOS cannot be submitted without it.** The client is finished and will 404
until the endpoint ships.

Draft spec: `scratchpad/ask-backend-delete-account.md`.

While you are there, get an answer to the other backend question: does
`PUT /api/reminders/:id` accept `triggered`? The Completed badge depends on it. If it does
not, `once` reminders auto-disable but never show as complete.

### 3. Enrol in both programmes
- **Apple Developer Program** — $99/yr. **Enrol as an individual.** Organization enrolment
  needs a D-U-N-S number and adds one to two weeks. Approval typically 24–48h.
- **Google Play Console** — $25 one-time, plus identity verification.

Neither can be rushed once submitted, and both gate everything downstream.

---

## Build

### Before the first production build
- [ ] Work through `DEVICE_QA.md`. It has never been done, and a production build is the
      wrong place to discover that background geofencing does not fire
- [ ] Decide `supportsTablet` — see the note in `DEVICE_QA.md` §5
- [ ] Publish the privacy policy at a public URL and put it in both consoles
- [ ] Store the Maps key as an EAS secret, since `.env` is gitignored and never reaches EAS:

      eas secret:create --scope project --name GOOGLE_MAPS_ANDROID_API_KEY --value <key>

### Build

    eas build --profile production --platform all

`eas.json` sets `appVersionSource: "remote"` with `autoIncrement: true` on the production
profile, so EAS owns the build number and Android version code. You do not need to set
`buildNumber` or `versionCode` in `app.json`, and you should not — two sources of version
truth is how duplicate-build-number rejections happen.

`submit.production` in `eas.json` is currently empty. It needs the Apple app ID and the Play
service-account key before `eas submit` will work unattended; filling it in is optional if
you upload manually the first time.

### After the build
- [ ] Play Console shows **no target-API warning** on upload. This is the whole reason the
      SDK 57 upgrade was a blocker rather than maintenance
- [ ] **Restrict the Android Maps key** to the package name and the release SHA-1 in Google
      Cloud Console. It ships inside a public binary, and an unrestricted key is billable by
      anyone who extracts it

---

## Submit

### Apple
1. Screenshots for every size you claim to support
2. Listing copy from `STORE_LISTING.md`
3. Privacy labels from `DATA_DISCLOSURES.md`
4. Review notes — **including working demo credentials**. A reviewer who cannot sign in
   rejects without looking
5. Expect questions about background location. The notes text is already written

### Google Play
1. Create the closed test, add the 12 testers, upload the build. **This starts the 14-day
   clock** — do it as early as a build exists, even a rough one
2. Data Safety form from `DATA_DISCLOSURES.md`
3. Background location declaration plus the demo video
4. Production access only after 12 testers × 14 continuous days

---

## What blocks what

| Milestone | Waiting on | Realistic |
|---|---|---|
| Apple account active | 24–48h after applying | Day 5–6 |
| iOS submitted | Active account **and** the delete endpoint | Day 5–6 |
| iOS approved | Apple's queue; longer for background-location apps | Day 6–8 |
| Play account verified | Google identity verification | Day 5–7 |
| Closed test live | Verified account + a build + 12 testers | Day 6–7 |
| **Play production access** | **12 testers × 14 continuous days** | **~Day 21** |

The Play date is set by the tester clock, not by engineering. Every day the testers are not
recruited moves it a day later. Nothing in the code changes this.
