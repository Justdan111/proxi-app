# Store listing copy

Draft copy for both stores. Character limits are enforced by the consoles, so the counts
below are the real constraint, not a style preference.

Nothing here promises a full-screen alarm takeover. That is deliberate: it is impossible
for a third-party iOS app, and a listing that implies it earns one-star reviews from people
who expected it.

---

## Names and identity

| Field | Value |
|---|---|
| App name (both stores) | **Proxi** |
| Apple subtitle (30 max) | `Reminders that know where` — 26 |
| Play short description (80 max) | `Location reminders that actually reach you when you arrive.` — 59 |
| Bundle ID | `com.danemmanuel.proxi` |
| Android package | `com.danemmanuel.proxi` |
| Primary category | Productivity |
| Secondary category (Apple) | Utilities |
| Content rating | 4+ / Everyone |

`<TO FILL — check "Proxi" is not taken on either store before enrolling. If it is, the
whole listing changes and it is cheaper to find out now.>`

---

## Description

Usable in both stores. Apple allows 4000 characters, Play 4000.

```
Some things you can only do in a particular place. Buy milk at the shop. Return the
book when you pass the library. Ask about the invoice when you're actually at the office.

A reminder that fires at 9am is no use for any of them.

Proxi reminds you when you arrive.

HOW IT WORKS
Save a place, write the reminder, choose how far out to trigger. When you arrive, Proxi
alerts you — even if the app is closed.

• Set a radius from 100m to 1km
• Trigger once and it completes itself, or every time you visit
• Limit a reminder to certain hours, so the office one stays quiet at the weekend
• See a history of everything that fired

BUILT TO ACTUALLY REACH YOU
Proxi's alerts use a high-priority notification channel with its own sound and vibration,
and can break through Do Not Disturb and Focus modes. A one-line banner is easy to miss
when you're walking.

ABOUT YOUR LOCATION
Proxi needs "Always" location access, because a reminder that only works while you're
staring at the app is not a reminder.

Your position stays on your phone. Proxi compares it against your saved places on the
device itself and never sends your location to our servers. The only coordinates we store
are the places you deliberately save, so your reminders survive reinstalling the app.

No ads. No trackers. No analytics SDKs. Delete your account from inside the app and your
data goes with it.
```

Word on the "break through Do Not Disturb" line: that is true on Android via the alarm
channel's DND bypass, and on iOS via `timeSensitive`, which breaks through Focus modes.
**Verify both on a device before publishing this claim.** It is currently unverified.

---

## Keywords

Apple gives one 100-character comma-separated field. No spaces after commas, and never
repeat the app name or the category — both are already indexed.

```
location,reminder,gps,geofence,arrive,nearby,place,errand,todo,task,alert,trigger,shopping
```
93 characters.

Play has no keyword field — it indexes the description, which is why the copy above leads
with the words people would actually search.

---

## Screenshots

Required sizes:

| Store | Required |
|---|---|
| Apple | 6.9" iPhone **and** 6.5" iPhone. iPad only if you keep `supportsTablet: true` |
| Play | Phone screenshots, plus a 1024×500 feature graphic |

`supportsTablet` is currently **true** in `app.json`, which obliges you to supply iPad
screenshots and to have the app look right on one. If you have not tested on iPad, set it
to false before building — that is a one-line change and removes a whole review surface.

Suggested five, in order:

1. **Home** with three or four reminders — the app's actual job, first
2. **A notification arriving** on the lock screen — the payoff, and the thing that
   differentiates it
3. **Add reminder** showing the map and radius circle
4. **The location picker** with a search result selected
5. **Activity** showing a history of triggers

Seed a demo account with plausible reminders before capturing. Empty states make an app
look unfinished.

---

## URLs

| Field | Value |
|---|---|
| Privacy policy URL | `<TO FILL — must be public, no login. Required by both stores.>` |
| Support URL | `<TO FILL — Apple requires this. A single page with an email address is enough.>` |
| Marketing URL | Optional; omit rather than point at a placeholder |

---

## Review notes

Both stores let you write to the reviewer. Use it — background location is the single most
questioned permission on both platforms, and an unexplained one invites a rejection.

The App Store text is in `DATA_DISCLOSURES.md`. Play's background location declaration is
there too, and Play additionally wants a demo video.

**A demo account is not optional.** A reviewer who cannot get past the login screen rejects
the app without looking at it.
