# Proxi Session Log

Running handoff record. **Newest entry at the top.** Every session appends one entry
before ending — see the template at the bottom.

This file answers one question for the next session: *where did the last one stop, and
what happens next?* It is not a changelog; `git log` already does that. Record decisions,
blockers, and intent — the things that are not recoverable from the diff.

---

## 2026-08-21 — Full audit, launch plan, and project setup

**Branch:** `docs/launch-audit-2026-08-21` → [PR #1](https://github.com/Justdan111/proxi-app/pull/1) (open, awaiting review)

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
