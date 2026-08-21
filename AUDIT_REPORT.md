# Proxi Launch Readiness Audit

Date: 21 August 2026
Project: Proxi (Expo SDK 54 / React Native 0.81 / expo-router v6)
Scope: Production readiness for Apple App Store and Google Play Store

This report supersedes the previous audit dated 23 April 2026. It is based on a
full read of all 37 source files, a TypeScript check, and verification of every
claim against the code.

Companion document: [LAUNCH_PLAN.md](LAUNCH_PLAN.md) — the prioritised fix plan
and day-by-day schedule.

## 1. Executive Summary

Current decision: **NO-GO**

The architecture is sound. Layering, optimistic state updates with rollback,
API error mapping, and the background-task design are all above-average work.
What is broken is concentrated at the **seams between modules** — four separate
places where two correct-looking components disagree about a shared contract.

Blockers fall into three groups:

1. **Functional defects** that make the core promise of the app fail — most
   critically, notification spam and `once` reminders that never complete.
2. **Store compliance gaps** — missing account deletion (a near-certain Apple
   rejection), missing `android.package`, a missing asset, and an entitlement
   the app is not approved for.
3. **Account enrollment** — neither the Apple Developer Program nor Google Play
   Console account exists yet. This is the longest lead time in the project and
   is not something code can shorten.

### Timeline reality

| Milestone | Blocking factor | Realistic date |
|---|---|---|
| Code complete | Engineering only | Day 3 |
| Apple enrollment usable | 24–48h after applying, not compressible | Day 4–5 |
| iOS submitted for review | Requires active Apple account | Day 4–5 |
| Play closed testing starts | Requires verified Play account | Day 4–5 |
| Play production access | **12 testers × 14 continuous days** of closed testing | ~Day 18+ |

Enrollment has been scheduled for day 3 at the project owner's direction. The
consequence is recorded here for accuracy: day 3 ends with *code complete and
enrollment submitted*, not with an App Store submission. Google Play production
is approximately three weeks out regardless of engineering, because new personal
developer accounts must complete a 12-tester, 14-day closed test before they can
apply for production access.

Enroll with Apple as an **individual**, not an organization. Organization
enrollment requires a D-U-N-S number, which adds 1–2 weeks.

## 2. What Is Already Done

### 2.1 Architecture
Four cleanly separated layers, each with a clear responsibility:

| Layer | Location | Role |
|---|---|---|
| Routing | `app/` | expo-router file routes: `(auth)` and `(tab)` groups plus two detail screens |
| State | `context/` | `authContext`, `reminderContext`, `themeContext` — Context + hooks |
| Services | `lib/` | `api/`, `location/`, `notifications/` |
| UI | `components/` | Auth screens and the map component |

### 2.2 Genuinely good work
- **Auth bootstrap** ([context/authContext.tsx:28](context/authContext.tsx#L28)) shows
  the cached user immediately, refreshes `/me` in the background, and force-logs-out
  only on a confirmed 401 — never on transient network failure.
- **Optimistic updates with rollback** ([context/reminderContext.tsx:80](context/reminderContext.tsx#L80))
  — `toggleReminder` flips locally then reverts on error; `deleteReminder` snapshots
  the list before mutating.
- **API error mapping** ([lib/api/errors.ts](lib/api/errors.ts)) translates Axios
  failures into user-facing copy, distinguishing timeouts from offline from HTTP status.
- **Background geofencing design** — dual-task approach (location updates plus a
  15-minute backup poll) with an AsyncStorage mirror, correctly recognising that
  background tasks cannot read React context.
- **Haversine distance** ([lib/location/distance.ts](lib/location/distance.ts)) is
  correctly implemented.

### 2.3 Build infrastructure
EAS profiles exist for development, preview, and production, with production
auto-increment configured ([eas.json](eas.json)).

### 2.4 Type safety
`npx tsc --noEmit` reports **8 errors, none in live application code**:
- [app.config.ts:25](app.config.ts#L25) — `ExpoConfig.name` optionality mismatch
- 7 errors in `lib/simulation/` — archived code that still sits inside the tsconfig
  `include` and references a context shape that no longer exists

## 3. Critical Functional Defects

### 3.1 Notification spam for `always` reminders — P0
[lib/location/geofencing.ts:53](lib/location/geofencing.ts#L53)

`checkProximity` fires a notification on **every** location tick where the user is
inside the radius. There is no enter/exit edge detection and no dwell tracking.
Only `frequency: 'once'` is protected, via `markTriggered`.

Impact: a user sitting inside a 300m radius receives a MAX-priority,
DND-bypassing, vibrating alarm **once per minute** (the task's `timeInterval` is
60000ms). This is the most user-visible defect in the app and on its own would
generate one-star reviews.

Fix: track which geofences the user is currently inside in AsyncStorage, and
notify only on the *transition* from outside to inside. Add hysteresis — exit at
`radius × 1.15` — so GPS jitter at the boundary cannot re-fire the notification.

### 3.2 Background activity logging never executes — P0
[lib/location/geofencing.ts:81](lib/location/geofencing.ts#L81)

Two independent faults in the same block:

1. The JWT is read with `AsyncStorage.getItem('proxi_jwt_token')`, but the token is
   written to **SecureStore** ([lib/api/client.ts:53](lib/api/client.ts#L53)). The
   read always returns `null`, so the block never runs.
2. Even if it ran, line 83 uses `process.env.EXPO_PUBLIC_API_URL` directly, which is
   undefined in production builds, producing a request to `undefined/api/activities`.

Impact: `triggered` events never reach the Activity feed. The tab exists but can
only ever show create/toggle/delete events.

Fix: extract a shared `getAuthToken()` helper used by both the client and the
background task, and route the background request through the same base-URL
resolution as `lib/api/client.ts`.

### 3.3 `once` reminders never actually complete — P0
[lib/location/geofencing.ts:71](lib/location/geofencing.ts#L71)

The trigger is recorded only in a local AsyncStorage `Set`. The server's `triggered`
and `enabled` fields are never updated. Consequences:

- The "Completed" badge ([app/(tab)/home.tsx:121](app/(tab)/home.tsx#L121)) never appears.
- The UI's promise — *"Triggers once then auto-disables"*
  ([app/add-reminder.tsx:757](app/add-reminder.tsx#L757)) — is false.
- Clearing app data resurrects already-fired reminders.
- The state does not sync across devices, defeating the stated purpose of the backend.

### 3.4 iOS notification action buttons do not exist — P1
[lib/notifications/notifications.ts:75](lib/notifications/notifications.ts#L75)

`registerNotificationCategories()` runs on both platforms, but
`categoryIdentifier: 'reminder'` is spread into the notification content **only
inside the `Platform.OS === 'android'` branch**. On iOS the Done and Snooze
buttons never render.

### 3.5 The "Done" action is a stub — P1
[app/_layout.tsx:46](app/_layout.tsx#L46)

```js
console.log('Marked done:', reminderId);
```

Tapping Done does nothing. Reviewer-visible incomplete functionality.

### 3.6 Expired sessions strand the user — P1
[lib/api/client.ts:65](lib/api/client.ts#L65)

The 401 interceptor deletes the token but has no channel back to `authContext`.
`user` stays populated and `isAuthenticated` stays `true`, so the user remains on
a home screen where every request fails, with no path to re-authenticate short of
force-quitting the app.

### 3.7 Location handoff is racy and drops the icon — P1
[app/location-picker.tsx:1062](app/location-picker.tsx#L1062)

`confirmSelection` calls `router.back()` and *then* `router.setParams()` — ordering
that depends on navigation timing. It also never sends `selectedIcon`, which
[app/add-reminder.tsx:526](app/add-reminder.tsx#L526) reads. Result: **every reminder
is saved with the default 📍 icon**, regardless of place type.

### 3.8 Dead cache write — P2
[app/add-reminder.tsx:556](app/add-reminder.tsx#L556)

Writes to `cachedReminders`; the geofence reads `proxi_reminders_cache`.
`AppInitializer` already handles this correctly. The entire effect is wasted work
on every reminders change.

## 4. Store Compliance Blockers

### 4.1 No account deletion — P0, near-certain rejection
Apple Guideline 5.1.1(v) requires any app offering account creation to also offer
in-app account deletion. Proxi has signup but `app/(tab)/settings.tsx` provides
only logout.

**This requires a backend change.** No `DELETE /api/auth/me` endpoint exists in
[lib/api/auth.api.ts](lib/api/auth.api.ts), and the API is a separate service. The
endpoint must be added server-side before the client work can be completed.

### 4.2 Missing `android.package` — P0
[app.json](app.json) — Play Store release identity is incomplete. Cannot ship to Play.

### 4.3 Missing notification icon asset — P0
[app.json](app.json) references `./assets/notification-icon.png`. The file does not
exist; `assets/` contains only `images/` and `sounds/`.

### 4.4 Critical Alerts entitlement — P0
`UNAuthorizationOptionCriticalAlert` is enabled in [app.json](app.json) and
`allowCriticalAlerts: true` is requested in
[lib/notifications/notifications.ts:44](lib/notifications/notifications.ts#L44).

This entitlement requires a separate Apple approval process that takes weeks and is
granted almost exclusively to medical, public-safety, and home-security apps. Shipping
without approval risks rejection. Remove it — the app does not need it.

### 4.5 Duplicated background modes — P1
[app.json](app.json) declares `UIBackgroundModes: ["location", "fetch", "location", "fetch"]`.
Duplicated entries invite reviewer questions about background usage.

### 4.6 Compliance package incomplete — P0
No privacy policy artifact or URL in the repo. Required for both stores, and
mandatory given the app collects precise background location. Also outstanding:
App Store privacy labels, Play Data Safety declarations.

### 4.7 Background location justification — P1
Apple Guideline 5.1.5 scrutinises "Always" location. Permissions are currently
requested at startup ([app/_layout.tsx:64](app/_layout.tsx#L64)) rather than
contextually, which both weakens the justification and lowers grant rates. The
purpose strings in `app.json` are well written and should be kept.

## 5. Map Stack Migration

### 5.1 Decision
Migrate from `@rnmapbox/maps` to **`react-native-maps`** — Apple Maps on iOS,
Google Maps on Android.

Rationale:
- **iOS needs no API key and no billing account** — Apple Maps renders natively.
- Android uses Google Maps with a free-tier key.
- Official Expo config plugin, supported on SDK 53+ at v1.22+.
- Ships a native `<Circle radius={meters}>`, which fixes §5.3 for free.

`expo-maps` was evaluated and **rejected**: it is still alpha ("subject to breaking
changes"), unavailable in Expo Go, and requires a **minimum deployment target of
iOS 18.0**, which would exclude a large share of devices.

### 5.2 Geocoding
Place search and reverse geocoding move to **expo-location's native geocoder**
(`geocodeAsync` / `reverseGeocodeAsync`) — no keys, no billing, and already proven
in [app/(tab)/home.tsx:205](app/(tab)/home.tsx#L205).

This will sit behind a `GeocodingProvider` interface in a new
`lib/location/geocoding.ts`, so Google Places Autocomplete can be swapped in later
as a one-line change without any screen touching it.

### 5.3 The radius circle is currently wrong
[components/maps/ReminderMap.tsx:1340](components/maps/ReminderMap.tsx#L1340)

```js
function metresToPixels(metres: number): number { return metres / 10; }
```

A fixed pixel conversion that ignores both zoom level and latitude. The circle drawn
on screen does not match the actual geofence at any zoom but one — users cannot trust
what they see when setting a radius. `react-native-maps` `<Circle>` takes meters
natively and eliminates both this and `radiusToZoom`.

### 5.4 Migration surface
The existing prop interface (`center`, `radius`, `onLocationSelect`, `height`) is
already correct, so **only the component internals change** — neither caller needs
modification.

| Mapbox | react-native-maps |
|---|---|
| `<PointAnnotation>` | `<Marker>` |
| `<ShapeSource>` + `<CircleLayer>` | `<Circle radius={meters}>` |
| `<UserLocation visible animated />` | `showsUserLocation` prop |
| `<Camera centerCoordinate zoomLevel>` | `region` with computed deltas |
| `e.geometry.coordinates` | `e.nativeEvent.coordinate` |

Also remove: `Mapbox.setAccessToken` at [app/_layout.tsx:101](app/_layout.tsx#L101)
and [components/maps/ReminderMap.tsx:12](components/maps/ReminderMap.tsx#L12), the
`MAPBOX_DOWNLOADS_TOKEN` plugin dance in [app.config.ts](app.config.ts), and
`EXPO_PUBLIC_MAPBOX_TOKEN` from `.env`.

## 6. Routing Defects

### 6.1 WelcomeScreen is unreachable dead code — P1
`RootNavigator` sends unauthenticated users straight to `/(auth)/login`
([app/_layout.tsx:89](app/_layout.tsx#L89)), so the welcome screen is never the
landing route. The only paths to it are:

- [app/(auth)/login.tsx:9](app/(auth)/login.tsx#L9)
- [app/(auth)/signup.tsx:11](app/(auth)/signup.tsx#L11)

both of which push `'/(auth)/index'` — **not a valid expo-router href**. Index routes
resolve as `/(auth)`. So 89 lines of `components/welcomeScreen.tsx` are unreachable,
and the "back to welcome" affordance on both auth screens is broken.

Fix: delete the screen and the two dead navigation branches.

### 6.2 `(tab)` group naming
Singular `(tab)` rather than the conventional `(tabs)`. Cosmetic only; not worth the
churn before launch.

## 7. Screen Consolidation

**Decision: merge Explorer into Home; ship three tabs.**

`app/(tab)/explorer.tsx` (553 lines) and `app/(tab)/home.tsx` (454 lines) are
approximately 85% the same screen — both are a searchable reminder list showing live
distance, and **each opens its own independent `watchPositionAsync` subscription**.

Explorer's action sheet offers six actions, of which **four are `Alert.alert('Coming soon')`**
([explorer.tsx:243–252](app/(tab)/explorer.tsx#L243)) — edit, duplicate, share, archive.
Incomplete functionality is an explicit App Review rejection reason (Apple Guideline 2.1).

Its Filter and Sort buttons ([explorer.tsx:310–321](app/(tab)/explorer.tsx#L310)) are
inert: `filterCategory` and `sortBy` are declared without setters
([explorer.tsx:135](app/(tab)/explorer.tsx#L135)).

Merging carries Explorer's two genuinely useful features — the detail modal and delete
— into Home, and removes:
- 4 "Coming soon" dead ends
- 2 inert buttons
- 1 duplicate GPS subscription
- the tab-bar margin hack (`marginRight: 30` / `marginLeft: 30`) that exists only to
  dodge the floating action button

## 8. UI Inconsistencies

### 8.1 Three different accent colours
| Colour | Occurrences | Where |
|---|---|---|
| `#00D4AA` | 19 | Hardcoded throughout screens |
| `#00d4d4` | 9 | The Tailwind `accent` token and the tab bar |
| `#6366f1` | 5 | Notification LED, map circle |

The design token in [tailwind.config.js](tailwind.config.js) disagrees with what the
code actually renders. Consolidate to one value referenced through the token.

### 8.2 Styling approach diverges
[app/location-picker.tsx](app/location-picker.tsx) uses `StyleSheet.create` with
hand-rolled `dark`/`light` token objects, while every other screen uses NativeWind
classes. It also duplicates the theme palette that already exists in
`tailwind.config.js`. Convert to NativeWind.

### 8.3 Non-existent font
`fontFamily: 'Courier'` is hardcoded at
[app/location-picker.tsx:143](app/location-picker.tsx#L143) and
[app/add-reminder.tsx:193](app/add-reminder.tsx#L193). Android has no `Courier` and
falls back silently, so the two platforms render these headers differently. `expo-font`
is a dependency but no custom font is ever loaded.

### 8.4 Non-functional controls
- **Settings notification toggle** ([settings.tsx:450](app/(tab)/settings.tsx#L450))
  is local state only — flipping it changes nothing. Reviewer-visible.
- **Settings profile row** ([settings.tsx:364](app/(tab)/settings.tsx#L364)) is a
  `TouchableOpacity` with no `onPress` and a chevron implying navigation.

### 8.5 Blocking splash delay
[app/_layout.tsx:107](app/_layout.tsx#L107) hardcodes `setTimeout(resolve, 2000)`
before anything renders — two seconds added to every cold start for no functional reason.

## 9. Performance and Correctness

### 9.1 Redundant GPS requests
When `currentCoordinates` is null, **each reminder card independently calls
`getCurrentPositionAsync`** ([home.tsx:27](app/(tab)/home.tsx#L27),
[explorer.tsx:31](app/(tab)/explorer.tsx#L31)) — N parallel GPS requests for N cards.
Hoist to a single shared location source.

### 9.2 Doubled permission prompts
`requestAllPermissions` ([lib/location/permissions.ts:38](lib/location/permissions.ts#L38))
calls `requestForegroundLocation()` directly and then `requestBackgroundLocation()`,
which calls it again internally.

### 9.3 Overnight timeframes are impossible
Both the validator ([add-reminder.tsx:573](app/add-reminder.tsx#L573)) and
`isInTimeframe` ([geofencing.ts:40](lib/location/geofencing.ts#L40)) require
`start < end`, so a 22:00→06:00 window is rejected. A location reminder for a
night shift cannot be expressed.

### 9.4 Activity feed noise
Every toggle logs a `toggled` activity ([reminderContext.tsx:88](context/reminderContext.tsx#L88)).
Combined with the enable/disable switch on every card, the Activity tab will fill with
low-value events and bury the `triggered` entries that matter.

### 9.5 Dead configuration file
[lib/config.ts](lib/config.ts) is imported nowhere and contradicts the resolution logic
in `lib/api/client.ts` — it hardcodes `localhost:8080` for dev, which `client.ts`
deliberately avoids because it produces 404s in Expo Go. Delete it.

## 10. Security Review

No credential leaks found.

- `.env` is correctly gitignored and untracked.
- `EXPO_PUBLIC_*` variables are embedded in the bundle by design. This is expected and
  safe for a Mapbox public token, and will be equally safe for the Android Google Maps
  key **provided that key is restricted** in Google Cloud Console to the app's package
  name and SHA-1 signing certificate. Restricting it is mandatory, not optional.
- JWT storage uses `expo-secure-store` (Keychain/Keystore) — correct.
- The 401 interceptor clears the token on expiry — correct, though see §3.6 for the
  missing UI consequence.

## 11. Go-Live Criteria

1. All P0 defects in §3 resolved and verified on a physical device.
2. Account deletion implemented end-to-end, including the backend endpoint (§4.1).
3. `android.package` configured; notification icon asset present; Critical Alerts removed (§4.2–4.4).
4. Map migration complete and radius overlay verified accurate (§5).
5. Privacy policy published at a public URL; App Privacy labels and Play Data Safety complete (§4.6).
6. Physical-device QA of background geofencing: app backgrounded, app terminated, device rebooted.
7. Apple Developer Program and Google Play Console accounts active.

## 12. Change Log Since 23 April 2026 Audit

**Resolved:**
- Location parameter contract between add-reminder and location-picker was reported
  corrected. It is **not** — see §3.7. Re-opened.

**Still open from the previous audit:**
- `android.package` missing (§4.2)
- Notification icon asset missing (§4.3)
- Critical Alerts enabled without entitlement (§4.4)
- Compliance package incomplete (§4.6)
- "Done" notification action incomplete (§3.5)
- Explorer placeholder actions (§7)

**Newly identified in this audit:**
- Notification spam for `always` reminders (§3.1)
- Background activity logging non-functional due to token storage mismatch (§3.2)
- `once` completion never syncs to server (§3.3)
- iOS notification actions never render (§3.4)
- Expired sessions strand the user (§3.6)
- Every reminder saves with the default icon (§3.7)
- **Missing account deletion — near-certain Apple rejection (§4.1)**
- WelcomeScreen unreachable via invalid href (§6.1)
- Three conflicting accent colours (§8.1)
- Radius circle geographically inaccurate (§5.3)
- Store accounts not yet enrolled — longest lead time in the project (§1)

**Superseded:**
- Mapbox release blockers from the April audit are void. The Mapbox dependency is being
  removed entirely; neither `MAPBOX_DOWNLOADS_TOKEN` nor `EXPO_PUBLIC_MAPBOX_TOKEN` will
  be required (§5).
- The April audit's lint findings were re-checked. Current state is 8 TypeScript errors,
  all confined to `app.config.ts` and the archived `lib/simulation/` directory (§2.4).
