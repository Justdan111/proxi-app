# Proxi Session Log

Running handoff record. **Newest entry at the top.** Every session appends one entry
before ending — see the template at the bottom.

This file answers one question for the next session: *where did the last one stop, and
what happens next?* It is not a changelog; `git log` already does that. Record decisions,
blockers, and intent — the things that are not recoverable from the diff.

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
