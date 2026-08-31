# Proxi Session Log

Running handoff record. **Newest entry at the top.** Every session appends one entry
before ending — see the template at the bottom.

This file answers one question for the next session: *where did the last one stop, and
what happens next?* It is not a changelog; `git log` already does that. Record decisions,
blockers, and intent — the things that are not recoverable from the diff.

---

## 2026-08-31 — History tab, and the tab bar back on its dock

**Branch:** `feat/history-tab` (off `fix/account-deletion-endpoint`) → PR #13

Stacked on PR #12 rather than branched off `main`: it needs that branch's `SafeAreaView`
fix and tab-bar work, and editing `(tab)/_layout.tsx` from `main` would conflict on merge.

### Completed
- **New `app/(tab)/history.tsx`.** Lists reminders that have finished — `triggered ||
  !enabled` — newest first, each with the detail needed to recognise it (icon, title,
  place, radius, frequency, and when it stopped) and a **Set up again** button.
- **Set up again reactivates the existing record** with
  `updateReminder(id, { triggered: false, enabled: true })` instead of creating a copy, so
  every detail is kept and no duplicate lands on Home.
- **Fourth tab registered** between Home and Activity. This supersedes the settled "three
  tabs at launch" decision — recorded in `CLAUDE.md` as an owner decision.
- **Tab bar docked again.** The floating pill is reverted at Dan's request. The spacing fix
  stays: the add button sits above the bar, so it covers no label at three tabs or four.

### Decisions made
| Decision | Chosen | Rejected / why |
|---|---|---|
| What "past" means | `triggered \|\| !enabled` | Deleted reminders — the API hard-deletes them, so there is nothing left to restore |
| Reuse mechanism | Reactivate the same record | `createReminder` with copied fields — duplicates the row and orphans its activity history |
| Home overlap | Left as is | Excluding past reminders from Home is a decision about what Home means; out of scope here |

### Verified
- `tsc --noEmit` clean; lint 5 problems, all pre-existing.
- On the simulator: the four-tab bar renders with every label readable, and the History
  screen renders both empty and populated (the populated card checked against the real
  `buy food` reminder).

### Not verified
- **The Set up again button has not been pressed on device.** Its handler calls the same
  `updateReminder` that Home's toggle already uses, and it typechecks, but the tap itself
  is unexercised. Synthetic clicks into the simulator proved too unreliable to drive it.
- Nothing on physical hardware.

### Next action
**Tap Set up again once on the simulator** — switch a reminder off, open History, press it,
and confirm the reminder returns to Home enabled with its details unchanged. Then the
deletion flow from §14 still needs its own pass through Settings.

---

## 2026-08-31 — Account deletion connected to the local API

**Branch:** `fix/account-deletion-endpoint` (off `origin/main`) → no PR yet

### Completed
- **§4.1 is unblocked.** `DELETE /api/auth/me` now exists on the local backend
  (Go, Docker, `*:8080`) and was verified end-to-end with a throwaway account:
  `200 {"success":true,"message":"account deleted"}`, the account's reminders gone,
  login `401`, and the same email re-registerable (`201`) — a hard delete, not a
  deactivation. Repeating the `DELETE` is idempotent.
- **Wired the app to it.** `resolveBaseUrl` in `lib/api/client.ts` checked
  `EXPO_PUBLIC_API_URL` first, and `.env` ships the production URL — so
  `EXPO_PUBLIC_USE_LOCAL_API` was dead code and every dev run hit Railway. The flag is
  now checked first, still gated on `__DEV__`. Six precedence cases checked, including
  that a release build can never resolve to a local host.
- **Fixed a stranded-session bug the live endpoint exposed.** This backend answers
  `GET /api/auth/me` with `404 "user not found"` — not `401` — once the account is gone,
  and `GET /api/reminders` with `200 []`. The bootstrap in `context/authContext.tsx`
  only cleared on `401`, so a token outliving its account left the user apparently
  signed in against an empty account forever. It now treats `404` on that route as a
  dead session and runs the full `clearLocalSession()` teardown.
- Verification: `tsc --noEmit` clean; lint 5 problems, all pre-existing and none in the
  two files touched.

### Decisions made
| Decision | Chosen | Rejected / why |
|---|---|---|
| Local API switch | Flag before `EXPO_PUBLIC_API_URL`, `__DEV__`-gated | Commenting the prod URL out of `.env` per run — fragile, and easy to commit or forget |
| Deleted-account detection | `404` handled at bootstrap only | A global `404` rule in the interceptor — `404` legitimately means "no such reminder" elsewhere |
| Teardown on a dead session | Reuse `clearLocalSession()` | The old inline token+user clear, which skipped the `proxi_*` AsyncStorage wipe and left geofencing running |

### Found this session
- **The production API is not deployed at all.** Railway returns
  `{"status":"error","code":404,"message":"Application not found"}` with
  `x-railway-fallback: true` for every route, `/api/auth/login` included. This is now
  blocker #1 in `CLAUDE.md` — it is strictly larger than §4.1 was.

### SDK 57 ran on a simulator for the first time
The iOS dev client threw `[runtime not ready]: ReferenceError: Property 'MessageQueue'
doesn't exist` on launch. Root cause: the only successful iOS build is from **20 April,
SDK 54** — Metro was serving an RN 0.86 bridgeless bundle to an RN 0.81-era native runtime,
and `MessageQueue` is the old bridge. Fingerprints differ (`1be15a66…` installed vs
`e2e3873a…` current). Not a code defect and unrelated to the deletion work. Full evidence,
including what was ruled out, in `AUDIT_REPORT.md` §14.5.

Rebuilt with `npx expo run:ios --no-bundler` (Xcode 26.6, `/ios` is gitignored). Build
succeeded, installed on the iPhone 17 Pro simulator, **and the app boots** — splash, router
and auth screens all render. This is the first time the upgraded code has ever run.

The signup screen reaches the local API and returns its errors, which confirms the §14.1
wiring end to end from the UI, not just from `curl`.

### Found while watching it run — not yet fixed
- **Raw Go validator errors reach the user.** A short password renders as
  `Key: 'SignupInput.Password' Error:Field validation for 'Password' failed on the 'min'
  tag` in the signup error box. `getApiError` returns `response.data.error` verbatim
  ([lib/api/errors.ts](lib/api/errors.ts)), which assumes the backend sends human copy;
  this one sends struct-tag dumps naming internal Go fields.
- **No client-side length validation.** `components/signUpScreen.tsx` checks only that the
  two password fields match. The backend's real rules, probed directly: **password ≥ 6,
  name ≥ 2**. Nothing enforces either before the request.
- A transient **Unmatched Route** screen appears at `proxi:///` on cold launch before the
  redirect resolves. There is no `app/index.tsx`; `RootNavigator` redirects instead. Worth
  confirming whether it is only a flash.
- Legacy AsyncStorage key `cachedReminders` (no `proxi_` prefix) survives in the simulator
  from an April build, holding another account's reminder data. `clearLocalSession()` wipes
  `proxi_*` only, so logout and account deletion would both leave it behind.

### Blocked
- Deploying the API. Until then the delete endpoint is verified locally only, and no
  production build can sign in.
- Both store accounts unenrolled; 12 Play testers not recruited (14-day clock unstarted).
- No physical-device QA on SDK 57.

### Next action
**Run Settings → Delete Account on the simulator against the local API.** The client is
now the only unverified half; the endpoint is proven. Create an account (password ≥ 6),
add a reminder, delete the account, and confirm the app lands on login with storage
cleared. Then decide on the two signup defects above.

After that: **deploy the backend to Railway and re-verify deletion against production** — flip
`EXPO_PUBLIC_USE_LOCAL_API=false` in `.env`, restart Metro with `-c`, and run the
Settings → Delete Account flow on a device. Until the service is deployed, `.env` must
stay on the local flag or the app has no working API at all.

---

## 2026-08-30 — Both re-audit P1s fixed

**Branch:** `fix/geofence-restart-and-activity-refresh` → PR #11 (open, awaiting review)

*PRs #9 and #10 have both merged and been merged back in here. Three branches all
top-inserting an entry at the same anchor collided twice; see the note at the foot of this
entry.*

### §13.1 — permission granted outside the app now starts geofencing
The check is extracted as `syncGeofencing` and runs on every foreground alongside the
existing reminder re-fetch, instead of once per launch. It still never prompts — it reads
the current answer and matches geofencing to it — so the Apple 5.1.5 behaviour day 3
established is untouched.

Matching it both ways turned out to matter: permission **revoked** in system settings while
the app runs now stops the task, where before it stayed registered against a permission the
app no longer had.

One consequence had to be handled. `startGeofencing` is now called on every foreground, and
it re-registered the background-fetch task unconditionally. Guarded with
`TaskManager.isTaskRegisteredAsync` so repeating the call is cheap.

### §13.3 — Activity refreshes
`useFocusEffect` on tab open, plus an `AppState` listener for the case focus does not cover:
returning to the foreground on a tab that is already showing, which is exactly when a
geofence will have logged something while the user was elsewhere.

Moving `load()` out of the mount effect also cleared the lint error the file carried at
`activity.tsx:110` — lint went 8 → 7 on this branch.

### Two verification checks added to device QA
Neither fix is provable from the code, and both are easy to *assume* working:
- Decline the permission, enable "Always" in system settings, return, and confirm a reminder
  fires without a restart. Then revoke it and confirm the foreground service stops.
- Trigger a reminder from another tab and switch to Activity; then trigger one while
  backgrounded on Activity and foreground the app. The entry should already be there both
  times, with no pull-to-refresh.

### A process note worth keeping
This branch hit the same conflict twice, and it was predictable both times. Every branch
appends its entry to the **top** of `SESSION_LOG.md`, at the same anchor, so any two open
branches are guaranteed to collide there — and a third collides again after the second
merges. The same happened in `AUDIT_REPORT.md` where two branches each added a row to the
resolved table.

Nothing was lost; every resolution was "keep both sides". But if parallel branches are used
again, avoid the cost up front by either appending new entries at the **bottom** of the log,
or keeping doc updates in a single branch and leaving code branches doc-free.

### Next action
Unchanged and external: 12 Play testers, `DELETE /api/auth/me`, both enrollments. §13.2 and
§13.5 remain open at P2 and do not gate a tester build.

---

## 2026-08-30 — The alarm tone, and a filename that would have failed silently

**Branch:** `fix/alarm-sound` → PR #10 (open, awaiting review)

### The filename in §5.8 was wrong
Dan referred to `assets/sounds/proxi-alert.wav`. That file does not exist — he was quoting
the audit, which still carried the pre-rename name. The real file is `proxi_alert.wav` with
an **underscore**; it was renamed in `6229e29` because **Android resource names reject
hyphens**.

This mattered more than a typo. The failure is silent: a hyphenated sound produces no build
error, no warning, no log line — the channel just falls back to the default notification
sound. Someone following the audit could have dropped in a correctly-made 25-second alarm,
shipped it, and heard the stock Android chime with nothing anywhere explaining why. Fixed
in §5.8, with the naming rule stated explicitly for whoever replaces the asset next.

### §5.8 resolved
Replaced the 3.36s stereo chime with a synthesised **24.00s** tone — mono, 16-bit, 44.1kHz,
−1.0 dBFS, verified against the iOS 30-second cap. Four alternating tones (880 Hz / 1108 Hz,
0.22s each), then a 0.94s rest, repeating every 2 seconds.

Three constraints drove it, recorded in §5.8 so a future replacement does not lose them:
30s is iOS's hard cap; fundamentals stay between 800 Hz and 1.2 kHz because phone speakers
roll off below ~500 Hz; and each tone carries 2nd and 3rd harmonics because a pure sine is
easy to miss on a small speaker.

**The generator is checked in** at `scripts/generate-alarm-tone.py` rather than only the
WAV, so the pattern can be retuned without reverse-engineering an audio file.

### No channel bump needed — but only just
Android freezes a channel's sound at creation, so this had to land **before** any build
reached a device. It did, so `proxi-alarm-v2` stands and no `v3` is required.

One caveat carried into device QA §2.1d: a device that ran a **local** build after day 2
merged may already hold a v2 channel bound to the old chime. Hearing a 3-second chime during
testing means a stale channel, not a broken sound — uninstall and reinstall, which §0.3
already requires.

### Next action
Unchanged and external: 12 Play testers, `DELETE /api/auth/me`, both enrollments. The two
P1s from the re-audit — §13.1 and §13.3 — are still open and should land before any tester
build.

---

## 2026-08-30 — Geocoding request volume, ahead of the first iOS test

**Branch:** `fix/geocoding-request-volume` → PR #9 (open, awaiting review)

### Why
Dan asked whether Apple Maps covers everything the app needs before testing on iOS. The map
does — `region`, `onPress`, `showsUserLocation`, custom `<Marker>` and metre-based
`<Circle>` are all MapKit-supported, and `provider` is already left `undefined` on iOS, so
no key and no change. `showsMyLocationButton` and `toolbarEnabled` are inert on iOS but both
only switch off Google Maps UI, so nothing is lost.

Place search is a different subsystem — `expo-location`'s `geocodeAsync`, which is
CLGeocoder on iOS — and checking it turned up a defect worth fixing **before** the first
test rather than after.

### Found and fixed (§13.7, new)
`search()` reverse-geocoded every result to label it: up to five extra calls, issued
**concurrently** via `Promise.all`, on top of the forward call. Six requests per debounced
keystroke burst, against a geocoder Expo's own docs say will error under too many
concurrent requests.

The reason to fix it first is the failure mode, not the volume: **throttled search is
indistinguishable from a geocoder with poor coverage.** Left alone, the first iOS test would
have measured our own request pattern and been read as a verdict on Apple's data — and that
judgement is exactly what decides whether Google Places (§5.2) stops being a fast-follow.

Now two sequential calls: the top hit is reverse-geocoded for its label, the rest carry the
query and are named properly when selected — one call on a deliberate action rather than
five per keystroke.

### Also fixed: §13.4
Same function, so it went in together. The debounce is built once in an effect, held in a
ref, cancelled on unmount, with a closure guard on every `setState` after an `await`.

I introduced a lint error on the first attempt — reading a ref inside `useMemo` counts as
render-time access — and restructured rather than leaving it. `location-picker.tsx` is now
entirely lint-clean; project lint is **6 problems (3 errors, 3 warnings)**, down from 8, and
everything left is in §13.6's accepted category.

### Testing note for the next session
The iOS Simulator renders Apple Maps, so device-QA checks 1.4–1.7 (map render, radius
accuracy at 100m vs 1km, tap-to-select, search coverage) can be done **without hardware**.
Background geofencing, notification channels, DND and reboot behaviour still cannot.
`npx expo prebuild --clean` then `npx expo run:ios`; Xcode → Features → Location to move in
and out of a radius.

### Still open from §13
§13.1 and §13.3 are the two P1s and are untouched — both should land before any tester
build. §13.2 and §13.5 remain P2.

### Next action
Unchanged and external: 12 Play testers, `DELETE /api/auth/me`, both enrollments. Then the
iOS map/search pass in the Simulator, which now measures Apple's coverage rather than our
request volume.

---

## 2026-08-30 — Re-audit of the merged codebase

**Branch:** `audit/2026-08-30` → PR #8 (open, awaiting review)

### What this was
PR #7 merged, so `main` finally holds days 1–4 plus the review fixes. `AUDIT_REPORT.md`
still described Expo SDK 54 and a codebase that no longer exists, so it was re-audited
against the merged code rather than relabelled.

Verified on `main` first: `tsc` clean, `expo-doctor` 21/21, lint 8 problems.

### Six new findings, in §13
Two matter before testers see a build:

- **§13.1 — granting location permission outside the app never starts geofencing.** Day 3
  correctly removed the startup *prompt* (Apple 5.1.5), but the permission **check**
  inherited the same once-per-launch lifetime. Decline at first save, enable "Always" in
  system settings later, and no reminder fires until the app restarts — with nothing in the
  UI saying why. **Introduced by our own day-3 change.**
- **§13.3 — the Activity tab never refreshes.** Latent for the whole project and invisible
  until now: background activity logging had never executed (§3.2 read the JWT from the
  wrong store), so nothing was arriving to be stale. Fixing §3.2 turned a dormant bug into
  a visible one.

Then §13.2 geofencing runs with zero reminders, §13.4 the search debounce is never
cancelled, §13.5 four `console.log` calls ship (three still tagged `[v0]`), and §13.6
separates the real lint error from the three that are a rule firing on correct Reanimated
usage.

### The pattern worth remembering
Both P1s come from the same mechanism: **fixing one defect can expose or create another.**
§13.1 was created by a correct compliance fix; §13.3 was revealed by a correct storage fix.
Neither is reachable by `tsc` or lint, and three of the four real findings were only found
by reading. That is the argument for the device pass, not another code read.

### Document structure
§§2–12 are kept as the original diagnostic record — `LAUNCH_PLAN.md` cites those numbers,
so nothing was renumbered. §1 and the timeline were rewritten for current reality, and the
Remaining Work section now carries a Code row pointing at §13.

### Next action
Unchanged and external: 12 Play testers, `DELETE /api/auth/me`, both enrollments, then
`release/DEVICE_QA.md` on hardware. The §13 code fixes are small and can ride alongside;
§13.1 and §13.3 should land before any tester build.

---

## 2026-08-30 — Merge recovery, and a standing Remaining Work section

**Branch:** `day4/release-prep` → PR #7 (open)

### The stacked PRs did not land in main
All six PRs reported as merged, but **only #2 reached `main`**. The other four merged into
their base branches instead: #3 → day1, #4 → day2, #5 → day3, #6 → day4. GitHub retargets a
stacked PR to `main` only once its base branch merges, and each was merged before that
retarget happened — so every merge was individually correct and went *downward* into the
branch below rather than up into `main`.

Net effect: 19 commits — all of days 2, 3, 4 and the geofencing review fixes — were absent
from `main` while appearing merged.

**Lesson for any future stack:** a chain of PRs must be merged strictly bottom-up, waiting
for each retarget before merging the next. That constraint was never stated when the stack
was created; it should have been, in every PR description.

The merges collapsed everything into `day4/release-prep`, which now contains all of it, so
PR #7 (`day4/release-prep` → `main`) recovers the lot in one merge. Nothing in it is
unreviewed — the same commits, moved to the right place.

### Also in this branch
`AUDIT_REPORT.md` gains a standing **Remaining Work** section between §1 and §2, so the
next session does not have to re-derive status from the §12 change log. Deliberately
unnumbered — `LAUNCH_PLAN.md` cites section numbers (§3.9, §4.8), so renumbering would
break those references.

It groups what is left by **who unblocks it**, which is the useful axis now that no
in-scope code remains: blocked on someone else, needs an asset, needs a device, needs a
console, and deferred by decision.

### Next action
Merge PR #7 into `main`. Then the four external actions in the new section — the backend
endpoint, the device pass, the compliance package, and enrollment — with the 12 Play
testers started first, because that clock runs whether or not anyone is working.

---

## 2026-08-30 — Self-review of the stack: three geofencing defects

**Branch:** `fix/geofence-concurrency` → PR #6 (open, awaiting review)

### Why this exists
All four days were complete with nothing left to build, and this repo has no test suite —
so typecheck and lint had passed on ~2,000 lines of logic that no one had read back.
Reviewing day 2's own work found three defects, all in the geofencing path that day 2
existed to fix.

### Found and fixed
1. **Concurrent runs could double-notify.** The two background tasks share a JS context and
   can overlap. `checkProximity` read fence state, then awaited notification delivery plus
   up to three network calls (completion PUT, toggle fallback, activity POST — 10s timeout
   each) before writing it back. A second run entering that window saw "not yet notified"
   and sent again. This defeated the exact guarantee §2.1 was written to provide, and it
   would have shown up on a device as intermittent duplicates — the hardest kind to
   attribute. Now serialised through a promise chain, with the notified mark persisted
   before the network calls.
2. **Fence state was never pruned.** Only enabled reminders are cached and only cached ones
   are visited, so ids for deleted or disabled reminders were never removed. Unbounded
   growth, and a real symptom: toggle a reminder off and on while inside its radius and it
   stayed silent until you left and came back.
3. **No per-reminder error isolation.** One throw aborted the pass and discarded occupancy
   changes already computed for earlier reminders.

Also renamed `useDistanceToReminder` → `distanceToReminder`; it stopped being a hook in
day 3 and the prefix was a trap.

`tsc` clean, lint unchanged at 8 problems.

### Where this leaves the stack
Five PRs, stacked: **#2 → #3 → #4 → #5 → #6.** Each based on the one before.

### Note for whoever reviews
Defect 1 is not reachable by reading `checkProximity` alone — it only appears when you
notice both `TaskManager.defineTask` bodies call it and that there are awaited network
calls between the read and the write. Worth the same scrutiny on any future background
work.

### Next action
Unchanged and entirely external: 12 Play testers (the 14-day clock still has not started),
`DELETE /api/auth/me`, and both store enrollments. Then `release/DEVICE_QA.md` on real
hardware — also published as a tickable page for use in the field.

---

## 2026-08-30 — Day 4: release compliance package

**Branch:** `day4/release-prep` → PR #5 (open, awaiting review)

### What day 4 could and could not be
Day 4 is the first day that is mostly **not** engineering. Of its four sections, one could
be done from the repo:

| Section | Status |
|---|---|
| §4.1 compliance package | **Done** — drafted in `release/` |
| §4.2 physical-device QA | **Cannot be done from here.** Checklist written instead |
| §4.3 production build | Cannot run — needs EAS credentials and a Maps key. Runbook written |
| §4.4 store enrollment | Dan's, and outside the repo entirely |

No source changed. `tsc` clean, lint 8 problems — both unchanged from day 3.

### Completed
`release/` contains: `RELEASE_RUNBOOK.md`, `DEVICE_QA.md`, `PRIVACY_POLICY.md`,
`DATA_DISCLOSURES.md`, `STORE_LISTING.md`, and a README index. ~700 lines.

### The finding that mattered
**The device's live position never leaves the phone.** Traced every outbound call:
geofencing compares on-device, and `LogActivityPayload` carries the reminder's label, not
a position. The only coordinates transmitted are those of places the user deliberately
saved, via `/api/reminders`.

`AUDIT_REPORT.md` §4.6 had said the policy must disclose "precise background location
collection, server-side storage" — that would have over-declared. Precise Location is still
declared as collected on both forms, because saved places are coordinates tied to an
account, but the framing is different and the reasoning is written down with its evidence
in `DATA_DISCLOSURES.md` so it is not re-derived incorrectly at form-filling time.

### Two things noticed while writing it up
- **`supportsTablet` is `true`.** That obliges iPad screenshots and an app that looks right
  on one. Flagged rather than changed — it is a product decision. Setting it false is a
  one-line change that removes a whole review surface.
- **`eas.json` `submit.production` is empty.** Fine for a manual first upload; needs the
  Apple app ID and Play service-account key before `eas submit` runs unattended.

### Blocked — unchanged, and now the entire critical path
Days 1–3 were engineering with external blockers alongside. Day 4 **is** the blockers.
- `DELETE /api/auth/me` still does not exist. iOS cannot be submitted. Ten days since the
  plan said to escalate on day 1.
- Neither store account enrolled.
- **12 Play testers not recruited.** 12 × 14 continuous days, and the clock has not
  started. This alone puts Play production access ~3 weeks out from whenever it does.
- The `triggered` field question from day 2, still unanswered.
- §2.6 alarm sound: still the 3.36s chime.

### Next action
**Nothing further can be built.** Four PRs are stacked and awaiting review; merge #2 → #3 →
#4 → #5 in order. Then the three external items above, in the order given in
`release/RELEASE_RUNBOOK.md` — testers and the backend endpoint first, because they are
wall-clock and gate everything after them. Then `DEVICE_QA.md` on real hardware before any
production build.

---

## 2026-08-30 — Day 3: screen consolidation, compliance, UI consistency

**Branch:** `day3/screen-consolidation-and-compliance` → PR #4 (open, awaiting review)

### Stacking, again
Stacked on `day2/...`, for the same reason day 2 stacked on day 1: neither has merged, so
`main` still has none of this. **Merge order is #2, #3, #4.** Each PR is based on the one
before it, so each diff shows only its own day.

### Completed
All of §3.1–§3.7 except the part that needs the backend.
- §3.1 Explorer merged into Home; three tabs; the FAB margin hack removed.
- §3.2 dead welcome screen and its invalid route deleted; `as Href` casts gone.
- §3.3 account deletion — client complete, **endpoint still missing**.
- §3.4 401 handling, §3.5 location draft context, §3.6 UI consistency, §3.7 performance
  and contextual permission prompts.
- `tsc --noEmit` clean, `expo-doctor` 21/21, lint down from 16 problems to 8
  (4 errors, 4 warnings) — all 8 pre-existing patterns, none introduced.
- Net −265 lines across 26 files.

### Decisions made
| Decision | Chosen | Why |
|---|---|---|
| Accent colour | **#00D4AA** | It had the most existing uses (18 vs 9 vs 7), so unifying on it changed the fewest call sites. #00d4d4 was the Tailwind token, so classes and literals had been rendering different colours all along. |
| Where the accent lives | Tailwind token **and** `lib/theme.ts` | RN props like `color=` cannot take a class. Two sources is unavoidable; the file documents that they must move together. |
| Icon picker added | Yes — small row on add-reminder | Not in the plan. §3.5 names "the dropped selectedIcon" as a defect, but nothing anywhere could ever set an icon, so carrying it through the draft alone would have changed nothing. |
| Permission prompts | Moved to first reminder save | §4.7. Declining does not block the save. |
| Account teardown | Shared between logout and deletion | They had drifted; deletion needs strictly more cleanup than logout did. `@proxi_theme` deliberately survives — a device preference, not account data. |

### Blocked
- **`DELETE /api/auth/me` still does not exist.** The client is finished: the Settings row,
  the confirmation, and the teardown all work, and the call will 404 until the endpoint
  ships. iOS cannot be submitted without it. Ten days since the plan said to escalate.
- The `triggered` field question from day 2 is unchanged and unanswered.
- §2.6 alarm sound unchanged.
- Store enrollment and the 12 Play testers: unchanged. The 14-day clock has not started.

### Not verified
Still no physical-device QA, now across three days of changes. Day 3 adds visual work —
one accent in both themes, the rebuilt location-picker, the merged Home — none of which
has been seen rendered.

### Next action
**Review and merge #2, #3, #4 in order.** Run `npx expo prebuild --clean` first and work
through the day 1–3 acceptance lists on a physical device. Day 4 is `day4/release-prep`:
compliance package, device QA, production build, store enrollment. Day 4 cannot complete
without the backend endpoint and both store accounts.

---

## 2026-08-30 — Day 2: alarm channel, geofence correctness, haptics

**Branch:** `day2/alarm-notifications-and-geofencing` → PR #3 (open, awaiting review)

### Base branch deviation — read this first
CLAUDE.md says branch each day off `main`. Day 2 is instead stacked on
`day1/expo-57-upgrade`, because PR #2 has not merged and `main` therefore contains
neither SDK 57 nor the §1.4 configuration that §2.4 and §2.8 build on. **PR #3 must merge
after PR #2.** Once #2 lands, #3 rebases onto `main` cleanly.

### Completed
- §2.1 notification spam, §2.2 token/base-URL mismatch, §2.3 `once` completion sync,
  §2.4 alarm channel, §2.5 iOS interruption level, §2.7 haptics, §2.8 remaining fixes.
- `tsc --noEmit` clean, `expo-doctor` 21/21, lint unchanged at 16 problems.

### Decisions made
| Decision | Chosen | Why |
|---|---|---|
| Background API calls | Use `activitiesApi` / `remindersApi` directly | The plan proposed extracting a shared `getAuthToken()`. The existing axios client already reads SecureStore in its interceptor and resolves the base URL, so calling it achieves §2.2's stated goal with no new code. |
| Geofence state shape | Two sets — `occupied` and `notified` | Occupancy alone loses the case where a fence is entered *outside* its timeframe: it would become occupied, never notify, and never re-transition. Splitting them means the alert is owed and fires when the window opens. |
| `once` completion call | `update({ triggered, enabled: false })`, falling back to `toggle` | The badge reads the server's `triggered`. See the blocked item below — the backend may not accept the field. |

### Blocked
- **`triggered` may not be accepted by `PUT /api/reminders/:id`.** `UpdateReminderPayload`
  was extended locally, but the backend is a separate service and this could not be
  verified from here. If it rejects or ignores the field, the fallback still auto-disables
  the reminder but the Completed badge stays hidden. **Needs a backend confirmation.**
- **§2.6 alarm sound not done.** Still the original 3.36s stereo chime; §5.8 wants a
  20–30s tone. Producing audio is outside what can be done in the repo.
  **This is coupled to the channel id:** `proxi-alarm-v2` is created by this branch, and
  Android freezes a channel's sound at creation. If the sound is replaced *after* any
  device has installed a build containing v2, the channel must bump to v3. Land the sound
  before this reaches testers, or plan the bump.
- `DELETE /api/auth/me`, store enrollment, and the 12 Play testers are all unchanged from
  the previous entry. The 14-day clock still has not started.

### Not verified
No physical-device QA, for day 1 or day 2. Everything in the Day 2 acceptance list is
device work: one notification per fence entry, the channel confirmed in Android's
per-channel settings, DND bypass with DND actually on, `timeSensitive` under a Focus mode,
Done and Snooze on both platforms, snooze accuracy under Doze.

### Next action
**Wait for Dan's review of PR #2, then PR #3.** Merge #2 first. Before merging either,
run `npx expo prebuild --clean` and exercise the Day 1 and Day 2 acceptance lists on a
physical device. Day 3 is `day3/screen-consolidation-and-compliance`, and its §3.3 is
blocked on the backend deletion endpoint.

---

## 2026-08-30 — Day 1: SDK 57 upgrade completed and Mapbox removed

**Branch:** `day1/expo-57-upgrade` → PR #2 (open, awaiting review)

### Context recovered at session start
The previous session ended without writing an entry. PR #1 had merged and seven commits
were already on `day1/expo-57-upgrade` — §1.1 of the plan (the SDK 54→57 upgrade) plus
part of §1.4 — none of it recorded. This entry covers both that work and this session's.

### Completed
- **Already on the branch, undocumented:** SDK 54→57 upgrade, `android.package`,
  API 36 via `expo-build-properties`, notification icon asset, sound file rename.
- **This session:** plan §1.2 (map migration), §1.3 (geocoding provider), and the
  remainder of §1.4 (configuration).
- Verification gate: `tsc --noEmit` clean (was 8 errors), `expo-doctor` 21/21 (was 20/21),
  lint 16 problems against an 18-problem baseline at HEAD — two fixed, none introduced.

### Decisions made
| Decision | Chosen | Rejected / why |
|---|---|---|
| `react-native-maps` version | **1.27.2** | Plan said 1.29.0. `expo install` pins 1.27.2 from SDK 57's bundled-native-modules manifest; 1.29.0 would fail `expo-doctor`. |
| Android Maps key delivery | `react-native-maps` plugin prop, declared in `app.config.ts` | `android.config.googleMaps.apiKey` does **not** work — the plugin strips the `geo.API_KEY` meta-data whenever its own prop is absent. Verified through `expo config --type introspect`. |
| Maps key env var name | `GOOGLE_MAPS_ANDROID_API_KEY` | Not `EXPO_PUBLIC_*`, which would embed it in the JS bundle. |
| iOS maps key | Deliberately unset | Keeps iOS on Apple Maps and keeps the GoogleMaps pod out of the build. |
| `defaultChannel` value | `proxi-alarm` | Matches the channel the code creates today. Day 2 §2.4 moves both to `proxi-alarm-v2`. |

### In progress / not yet verified
- **No physical-device QA has been run on SDK 57.** The §1.1 gate lists a device build,
  Reanimated animations, and NativeWind in both themes; none has been exercised. This was
  previously blocked because `MAPBOX_DOWNLOADS_TOKEN` was unset and native dependency
  install could fail — removing Mapbox clears that, so a device build is now possible.
- **The local `android/` directory is stale.** It is gitignored, but it still carries
  `USE_FULL_SCREEN_INTENT` and `SYSTEM_ALERT_WINDOW` and the old Mapbox native config.
  Local verification needs `npx expo prebuild --clean`. EAS is unaffected — it only
  uploads git-tracked files and prebuilds fresh.
- `GOOGLE_MAPS_ANDROID_API_KEY` is unset. `.env` is gitignored, so it must be set locally
  and as an EAS secret. Until it is, the Android map renders blank; iOS is unaffected.

### Blocked
- `DELETE /api/auth/me` on the Railway backend. **Still not raised** nine days after the
  plan said to escalate on day 1. Blocks iOS submission entirely.
- Both store accounts unenrolled.
- 12 Play testers not recruited. The 14-day continuous-testing clock has still not
  started; it is the longest lead item in the project and pure wall-clock time.

### Next action
**Wait for Dan's review of PR #2.** Before merging, run `npx expo prebuild --clean` and
build to a physical device to close the §1.1 verification gate — that is the one Day 1
acceptance criterion that cannot be satisfied from the repo. On approval, create
`day2/alarm-notifications-and-geofencing` off `main` and begin plan §2.1.

---

## 2026-08-21 — Full audit, launch plan, and project setup

**Branch:** `docs/launch-audit-2026-08-21` → [PR #1](https://github.com/Justdan111/proxi-app/pull/1) (merged 21 August 2026)

### Completed
- Read the entire codebase (37 files, ~5,600 lines) and typechecked it.
- Rewrote `AUDIT_REPORT.md` from scratch — 12 sections, every claim verified against
  code with `file:line` references.
- Wrote `LAUNCH_PLAN.md` — four-day plan, priority ladder, risk register, out-of-scope list.
- Added `CLAUDE.md` and this file to establish the continuity requirement.

### Decisions made this session
| Decision | Chosen | Rejected |
|---|---|---|
| Map renderer | `react-native-maps` | Mapbox (inaccurate), `expo-maps` (alpha, iOS 18 min) |
| Geocoding | expo-location native, behind an interface | Google Places now (needs billing), Photon (coverage) |
| Expo version | Full upgrade to SDK 57 | Pinning API 36 on SDK 54 — Dan chose the riskier path knowingly |
| Screens | Merge Explorer into Home, 3 tabs | Keeping Explorer |
| Alarm scope | Max achievable without native code | Android full-screen intent, iOS AlarmKit |
| Enrollment timing | Day 3–4 | Day 0 (recommended, overruled) |

### Most important findings
- **The alarm channel has never been applied.** `proxi-alarm` is correctly configured
  with MAX importance, DND bypass, custom sound, and vibration — but `channelId` belongs
  on the *trigger* and is never set anywhere. Every notification has always used the
  default channel. One property accounts for most of the missing alarm behaviour.
- **Expo is a release blocker, not maintenance.** SDK 54 targets Android API 35; Play
  requires API 36 for new apps from 31 August 2026.
- **Account deletion is missing** — near-certain Apple rejection, and it needs a backend
  endpoint that does not exist.
- Notification spam: `always` reminders re-notify on every location tick, ~once per minute.
- Background activity logging never runs — token read from AsyncStorage, written to SecureStore.

### Blocked
- `DELETE /api/auth/me` on the Railway backend. Not in this repo. Blocks iOS entirely.
- Both store accounts unenrolled.
- 12 Play testers not recruited — 14-day clock has not started.

### Next action
**Wait for Dan's review of PR #1.** On approval, create `day1/expo-57-upgrade` off `main`
and begin `LAUNCH_PLAN.md` §1.1 — the SDK 54→57 upgrade, in isolation, stopping at the
verification gate before touching the map migration.

---

## Entry template

```markdown
## YYYY-MM-DD — <short title>

**Branch:** `<branch>` → PR #<n> (<status>)

### Completed
- <what actually landed>

### In progress
- <started but unfinished, and where it stands>

### Decisions made
- <decision, what was chosen over what, and why>

### Blocked
- <blocker, and who or what unblocks it>

### Next action
<the single concrete next step, specific enough to start cold>
```
