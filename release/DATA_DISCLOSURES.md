# Store data disclosures

Exact answers for the App Store privacy labels and the Play Data Safety form.

**Fill both from this one document.** The two forms ask overlapping questions in different
words, and reviewers do compare them against each other and against the app's behaviour.
A mismatch is its own rejection reason, independent of whether the underlying practice is
fine.

Every answer below is derived from the source, not from intent:

| Claim | Where it is true in the code |
|---|---|
| Account fields collected | `lib/api/auth.api.ts` — `SignupPayload` is name, email, password |
| Saved-place coordinates leave the device | `lib/api/reminders.api.ts` — `CreateReminderPayload.coordinates` |
| Activity records carry no position | `lib/api/activities.api.ts` — `LogActivityPayload` has no coordinates |
| Live position never leaves the device | `lib/location/geofencing.ts` compares on-device; no other call site sends coordinates |
| No ads, analytics, or tracking SDKs | `package.json` — none present |

---

## The one judgement call

Proxi reads **precise background location** but never transmits it. Only the coordinates of
places the user deliberately saved are sent to the server.

Both stores are answered on **transmission**, not on access:

- Apple's labels ask what is *collected*, which Apple defines as transmitted off device.
- Play's form asks what is *collected* (sent off device) versus *accessed*.

So the answer to both is: **Precise Location is collected** — because saved places are
coordinates tied to an account — while the device's live position is accessed on-device
only and is **not** declared as collected.

Do not simplify this to "we don't collect location". The saved places are location data and
they are on our server.

---

## App Store — App Privacy labels

### Data Used to Track You
**None.** No advertising identifier, no third-party tracking SDK, no data shared with data
brokers.

### Data Linked to You

| Category | Type | Purpose | Linked | Tracking |
|---|---|---|---|---|
| Contact Info | Email Address | App Functionality | Yes | No |
| Contact Info | Name | App Functionality | Yes | No |
| Identifiers | User ID | App Functionality | Yes | No |
| Location | Precise Location | App Functionality | Yes | No |
| User Content | Other User Content *(reminder titles, saved place names)* | App Functionality | Yes | No |
| Usage Data | Product Interaction *(reminder created / toggled / triggered / deleted)* | App Functionality | Yes | No |

### Data Not Collected
Everything else: no health, financial, contacts, browsing history, search history, photos,
audio, purchases, sensitive info, diagnostics, or advertising data.

### Notes for the reviewer (App Review notes field)
> Proxi is a location reminder app. Background location is required so a reminder can fire
> when the user arrives while the app is closed. The device's live position is evaluated
> on-device and is never transmitted to our servers — only the coordinates of places the
> user explicitly saves are stored, so their reminders survive a reinstall.
>
> A demo account is provided below. To see a reminder fire, save a reminder at your current
> location with a 300m radius, background the app, then move outside and back inside the
> radius.
>
> Demo account: `<TO FILL — email>` / `<TO FILL — password>`

---

## Google Play — Data Safety

### Overview answers
- Does your app collect or share any of the required user data types? **Yes**
- Is all of the user data collected by your app encrypted in transit? **Yes** *(HTTPS —
  confirm the Railway domain does not permit plaintext before answering)*
- Do you provide a way for users to request that their data is deleted? **Yes** — in-app,
  Settings → Delete Account
- Has your app been independently validated against a global security standard? **No**

### Data types

| Type | Collected | Shared | Optional? | Purpose |
|---|---|---|---|---|
| Personal info → Name | Yes | No | Required | App functionality, Account management |
| Personal info → Email address | Yes | No | Required | App functionality, Account management |
| Personal info → User IDs | Yes | No | Required | App functionality, Account management |
| Location → Approximate location | No | No | — | — |
| Location → Precise location | **Yes** | No | Required | App functionality |
| App activity → Other user-generated content | Yes | No | Required | App functionality |
| App activity → Other actions | Yes | No | Required | App functionality |

**Everything else: not collected, not shared.** In particular: no app performance data, no
crash logs, no diagnostics, no advertising ID, no contacts, no photos, no files, no
calendar, no financial info, no health data, no messages, no audio, no device IDs.

### Precise location — the follow-up questions
- Collected: **Yes**. Shared: **No**.
- Processed ephemerally: **No** — saved places persist on the server.
- Required or optional: **Required** for the app's core function.
- Purpose: **App functionality** only. Not analytics, not advertising, not personalisation,
  not fraud prevention.

### Background location declaration
Play requires a separate justification and a short demo video for background location.

> Proxi is a location reminder app. Its only feature is alerting the user when they arrive
> at a place they saved. Background location access is what allows that alert to fire while
> the app is closed; without it the feature does not exist. The location is compared
> on-device against the user's saved places and is not transmitted to our servers.

`<TO FILL — record a screen capture showing: the user saving a reminder, the permission
prompt with its explanation, the app being closed, and the notification arriving on
arrival. Play wants to see the in-app disclosure prompt on screen.>`

### Permissions that will be questioned
| Permission | Why it is declared |
|---|---|
| `ACCESS_BACKGROUND_LOCATION` | Core function — see the declaration above |
| `SCHEDULE_EXACT_ALARM` | The 10-minute snooze must fire on time under Doze |
| `RECEIVE_BOOT_COMPLETED` | Geofencing resumes after a restart |
| `FOREGROUND_SERVICE_LOCATION` | The Android foreground service that watches position |

`USE_FULL_SCREEN_INTENT` was **removed** — it was declared without a corresponding feature,
which is a policy liability on its own.

---

## Consistency checklist

Before submitting, confirm all four say the same thing:

- [ ] The published privacy policy lists exactly the categories in the tables above
- [ ] The App Store labels and the Play Data Safety form agree with each other
- [ ] Neither form claims data the app does not send *(over-declaring causes questions too)*
- [ ] The privacy policy URL in both consoles resolves publicly, with no login
