# Physical-device QA

Nothing in days 1–3 has been run on a device. Everything below is unverified.

The core features — background geofencing and notification delivery — **cannot be tested
in a simulator**. A simulator will happily show you a notification appearing and tell you
nothing about whether it used the right channel, bypassed Do Not Disturb, or fired at all
with the app terminated.

Work top to bottom. Later sections assume the earlier ones passed.

---

## 0. Before you start

- [ ] `npx expo prebuild --clean`

  **Not optional.** The local `android/` directory is gitignored but stale. It still
  carries `USE_FULL_SCREEN_INTENT` and `SYSTEM_ALERT_WINDOW`, which day 1 removed, and the
  old Mapbox native config. Without `--clean` you will be testing permissions the app no
  longer declares. EAS is unaffected — it only uploads git-tracked files.

- [ ] `GOOGLE_MAPS_ANDROID_API_KEY` set in `.env` (and as an EAS secret for real builds).
      Until it is, the Android map renders blank. iOS uses Apple Maps and needs no key.
- [ ] Install on a **clean device or a fresh install**. An existing install may hold a
      cached `proxi-alarm` notification channel, and Android freezes channel settings at
      creation — you would be testing the old channel and not know it.

---

## 1. Day 1 — the SDK 57 upgrade

The upgrade's own verification gate, never run.

- [ ] A development build installs and launches
- [ ] Reanimated entrance animations run on **Home**, **Activity**, and **Settings**
      *(Reanimated went 4.1 → 4.5 and Worklets 0.5 → 0.10; this is where that shows)*
- [ ] NativeWind styling applies, in **both light and dark** themes
      *(if every screen looks unstyled, NativeWind is the first suspect — it hooks Babel
      and Metro)*
- [ ] The map renders — Apple Maps on iOS, Google Maps on Android
- [ ] **The radius circle matches the configured metres.** Set a reminder to 100m and then
      1km and confirm the circle changes size proportionally against real streets. This is
      the whole point of the `<Circle>` migration and the old pixel approximation was wrong
- [ ] Tapping the map moves the pin to where you tapped
- [ ] Searching a place in the picker returns sensible results
      *(this is now the OS geocoder, not Mapbox — coverage genuinely differs, and this is
      the check that decides whether Google Places needs to be a fast-follow)*
- [ ] The built artifact targets **Android API 36** — confirm in Play Console on upload;
      the target-API warning must be absent

---

## 2. Day 2 — notifications and geofencing

The highest-risk section. Every item here fixes something that has never once worked.

### 2.1 The alarm channel
- [ ] Android → Settings → Apps → Proxi → Notifications. A channel named
      **"Proxi Location Alerts"** exists, and its importance is **Urgent / MAX**
- [ ] The **old `proxi-alarm` channel is gone** (only `proxi-alarm-v2` should exist)
- [ ] Turn **Do Not Disturb on**, then trigger a reminder. It must still sound.
      *DND bypass has never once applied in this app — do not assume it works because the
      code says `bypassDnd: true`*
- [ ] The custom sound plays, and the vibration pattern is the double-buzz, not the default

### 2.2 No more spam
- [ ] Walk into a geofence: **exactly one** notification
- [ ] Stay inside for 10+ minutes: **no further notifications**
      *(previously one per minute — this was the worst bug in the app)*
- [ ] Stand near the boundary and let GPS drift: still no repeats *(the ×1.15 exit ring)*
- [ ] Leave properly and come back: **one** new notification

### 2.3 Timeframes
- [ ] Set a reminder with a window that has not started, then enter the fence. Nothing
      fires
- [ ] **Stay inside** until the window opens. It fires once, then.
      *This is the case a naive occupancy fix breaks — the alert is owed, not skipped*

### 2.4 `once` reminders
- [ ] Trigger a `once` reminder. It shows **Completed** and becomes disabled
- [ ] Force-quit and reopen: still Completed *(the foreground re-fetch)*
- [ ] **Reinstall the app and sign in: still Completed.** If it comes back uncompleted, the
      backend is not accepting the `triggered` field — see the open question in
      `SESSION_LOG.md`
- [ ] A `triggered` entry appears in the Activity tab
      *(background activity logging has never worked — it read the JWT from the wrong
      store — so this is a first)*

### 2.5 Actions and snooze
- [ ] **Done** and **Snooze** buttons appear on the notification — on **both** platforms
      *(they have never rendered on iOS)*
- [ ] Done marks the reminder complete
- [ ] Snooze re-fires in ~10 minutes, on the alarm channel, with the **correct title** —
      not "undefined"
- [ ] Snooze accuracy **under Doze**: leave an Android device untouched and unplugged for
      the full 10 minutes and confirm it is not delayed

### 2.6 iOS specifically
- [ ] Enable a **Focus mode**, then trigger a reminder. It breaks through
      *(`timeSensitive`)*
- [ ] No prompt or error mentioning Critical Alerts *(the entitlement was removed)*

### 2.7 Haptics
- [ ] Toggling, saving, and deleting a reminder each produce distinct feedback
- [ ] A geofence firing **while the app is open** produces a haptic
- [ ] Turn system haptics off — the app does not buzz

---

## 3. Day 3 — screens, compliance, consistency

- [ ] **Three tabs** — Home, Activity, Settings. No Explorer
- [ ] The floating action button does not overlap any tab label
- [ ] Tapping a reminder opens its details; delete works from there and asks first
- [ ] The stats row shows correct Total / Active / Disabled counts
- [ ] **No "Coming soon" alert anywhere in the app**
- [ ] **One accent colour throughout, in both themes.** Look specifically for a class-styled
      element next to an icon — they used to be different colours
- [ ] The location picker looks correct in both themes *(it was just rebuilt in NativeWind
      from a hand-rolled palette — most likely place for a visual regression)*
- [ ] **A reminder saves with the icon you chose**, not 📍
- [ ] Choosing a location returns to add-reminder with the place filled in, every time —
      including on a slow device *(this replaced a genuine race)*
- [ ] Leaving and re-entering add-reminder does not resurrect a stale location
- [ ] The splash screen does not linger after the app is ready
- [ ] Signing out and back in works; no route errors reaching login or signup

### Permissions
- [ ] A fresh install asks for location **only after the first reminder is saved**, with
      the explanation — not on launch *(Apple 5.1.5)*
- [ ] You are asked for foreground location **once**, not twice
- [ ] Declining still saves the reminder
- [ ] The Settings notifications switch reflects the real OS permission, and updates when
      you change it in system settings and come back

### Account deletion — Apple 5.1.1(v)
- [ ] Settings → Delete Account shows a confirmation naming what is lost
- [ ] **Currently expected to fail with a 404.** `DELETE /api/auth/me` does not exist yet.
      Confirm it fails *gracefully* — an error alert, the user still signed in, nothing
      wiped locally
- [ ] Once the endpoint ships: the account is gone, local data is cleared, geofencing stops,
      and you land on login. Signing in again must fail

---

## 4. Background states

Test the geofence in **all four**. They fail independently, and the last two are where
location apps usually break.

- [ ] App **foregrounded**
- [ ] App **backgrounded**
- [ ] App **force-quit / terminated**
- [ ] **After a device reboot**, without opening the app *(validates `startOnBoot`)*

---

## 5. Before submitting

- [ ] `supportsTablet` is currently **`true`** in `app.json`. That obliges you to supply
      iPad screenshots and to have the app look right on one. If you have not tested on
      iPad, set it to `false` — a one-line change that removes an entire review surface
- [ ] The Android Google Maps key is **restricted** to the package name and the release
      SHA-1 in Google Cloud Console *before* it ships in a public binary
- [ ] `npx expo-doctor` clean
- [ ] Production builds succeed for both platforms
- [ ] A **demo account** exists, is seeded with reminders, and the credentials are in the
      review notes for both stores
