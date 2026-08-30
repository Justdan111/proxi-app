# Proxi Privacy Policy

**Effective date:** `<TO FILL — the date you publish this>`
**Provider:** `<TO FILL — your name or company, as enrolled with Apple and Google>`
**Contact:** `<TO FILL — support email>`

Proxi reminds you about things when you arrive somewhere. This policy explains what the
app collects, what it does not, and what you can do about it.

Every claim below was checked against the app's source code. Do not publish this document
after changing what the app sends without re-checking it — an inaccurate policy is worse
than a vague one.

---

## The short version

- Proxi stores the **places you save**, because reminders would not work otherwise.
- Proxi does **not** send your device's live location to our servers. Proximity is worked
  out on your phone.
- Proxi does **not** sell your data, show advertising, or use third-party analytics or
  tracking SDKs.
- Deleting your account deletes your data.

---

## What we collect

### Account information
When you create an account we collect your **name**, **email address**, and a **password**.
The password is stored only in hashed form on our server and is never readable by us. We
also generate an account identifier.

### Places you save
For each reminder you create we store:

- the name and address you chose for the place
- its **precise coordinates** (latitude and longitude)
- the radius, the repeat setting, any time window, and the icon

These are locations **you deliberately chose and saved**. They are stored on our server so
your reminders survive reinstalling the app and appear on any device you sign in to.

### Reminder activity
When a reminder is created, toggled, deleted, or triggered, we store a record containing
the reminder's title, its saved place name, its icon, the type of event, and the time. This
is what fills the Activity tab.

**This record does not contain your location.** It names the reminder that fired, not where
you were.

---

## What we do not collect

### Your device's live location
Proxi requests background location access, and while enabled it checks your position
frequently. **That position stays on your device.** It is compared on your phone against
the places you saved, and it is never transmitted to our servers, in the background or
otherwise.

If you want to verify this rather than take our word for it, the app is doing its proximity
check in `lib/location/geofencing.ts` and every network call it makes is in `lib/api/`.

### Advertising, analytics, and tracking
Proxi contains no advertising SDK, no analytics SDK, and no third-party tracking. We do not
build a profile of you, and we do not share data with data brokers.

---

## Why Proxi needs background location

A location reminder has to be able to notice you have arrived while the app is closed. That
requires "Always" location permission. Without it, Proxi can only check while you have the
app open, and reminders will mostly not fire.

Proxi asks for this permission **after you save your first reminder**, not when you first
open the app, so the reason is visible when you decide.

You can revoke it at any time in your device settings. The app keeps working; reminders
simply stop firing.

---

## Services your location passes through

Two things happen on your device that involve companies other than us:

- **Maps.** The map is drawn by Apple Maps on iOS and Google Maps on Android.
- **Address lookup.** Turning coordinates into an address, and searching for a place by
  name, is done by your operating system's geocoding service — Apple on iOS, Google on
  Android.

These are your platform's own services, governed by
[Apple's privacy policy](https://www.apple.com/legal/privacy/) and
[Google's privacy policy](https://policies.google.com/privacy). We do not receive anything
extra from them.

Our server is hosted on **Railway**, which processes the data described above on our behalf
as our hosting provider.

---

## Notifications

Proxi sends notifications when you arrive at a saved place, and when a snoozed reminder is
due. These are generated on your device. Proxi does not use push notifications sent from a
server, so no notification token is collected.

---

## How long we keep things

Your account, your saved places, and your activity history are kept until you delete your
account. There is no separate retention period — deletion is the mechanism.

---

## Deleting your account

**Settings → Delete Account.** This permanently deletes your account, every place you have
saved, and your activity history. It cannot be undone, and it does not require contacting
us.

---

## Children

Proxi is not directed at children under 13, and we do not knowingly collect information
from them.

---

## Your rights

Depending on where you live, you may have the right to access, correct, export, or delete
your personal data. Deletion is available in the app. For anything else, contact us at the
address at the top of this policy and we will respond within 30 days.

`<TO FILL — if you have users in the EU or California, confirm with a lawyer whether you
need GDPR/CCPA-specific sections naming a legal basis and a data controller. This document
does not attempt to provide that.>`

---

## Changes

If we change what the app collects, we will update this policy and its effective date
before shipping the change.
