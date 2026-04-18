# Proxi Deployment Audit Report

Date: 18 April 2026
Project: Proxi (Expo React Native)
Scope: Production readiness for Apple App Store and Google Play Store

## 1. Executive Summary

Proxi has moved beyond prototype stage and now includes real backend integration for authentication, reminders, and activity logs, plus live location and notification logic.

The app is not yet ready for store deployment because release infrastructure and compliance configuration are incomplete.

Main blockers are:
- Missing EAS build configuration
- Missing app identifiers and build version metadata in app config
- Placeholder Google Maps API keys still present
- Missing privacy/compliance deliverables for store submission

## 2. What Is Implemented

### 2.1 Backend/API Integration
Implemented and wired to API client:
- Auth: signup, login, logout, me
- Reminders: CRUD and toggle
- Activity log: read and write

References:
- [lib/api/auth.api.ts](lib/api/auth.api.ts)
- [lib/api/reminders.api.ts](lib/api/reminders.api.ts)
- [lib/api/activities.api.ts](lib/api/activities.api.ts)
- [context/reminderContext.tsx](context/reminderContext.tsx)

### 2.2 Session Persistence (Login Once)
Implemented:
- Token persisted in SecureStore
- User persisted in AsyncStorage
- Bootstrap restores cached user, refreshes profile when online
- Forced logout only on confirmed 401 invalid session

References:
- [context/authContext.tsx](context/authContext.tsx)
- [lib/api/auth.api.ts](lib/api/auth.api.ts)

### 2.3 Location + Geofencing
Implemented:
- Foreground and background permission flow
- Background location task and periodic fetch backup
- Proximity checks and once/always reminder behavior

References:
- [lib/location/permissions.ts](lib/location/permissions.ts)
- [lib/location/geofencing.ts](lib/location/geofencing.ts)

### 2.4 Notifications
Implemented:
- Android notification channel
- Custom sound support
- Notification action categories (Done/Snooze)
- Response listener wiring in app root

References:
- [lib/notifications/notifications.ts](lib/notifications/notifications.ts)
- [app/_layout.tsx](app/_layout.tsx)
- [app.json](app.json)

### 2.5 Core Product Screens
Implemented with live data:
- Home: live distance and reminder state
- Explorer: live distance and reminder listing from context
- Activity: API-backed grouped timeline
- Add reminder and location picker flows

References:
- [app/(tab)/home.tsx](app/(tab)/home.tsx)
- [app/(tab)/explorer.tsx](app/(tab)/explorer.tsx)
- [app/(tab)/activity.tsx](app/(tab)/activity.tsx)
- [app/add-reminder.tsx](app/add-reminder.tsx)
- [app/location-picker.tsx](app/location-picker.tsx)

## 3. Deployment Blockers (Must Fix Before Store Release)

### 3.1 Missing EAS Build Configuration
No EAS build profile file exists.

Missing file:
- [eas.json](eas.json)

Impact:
- Cannot run standardized cloud builds for release artifacts.

### 3.2 Missing App Identity and Version Metadata
Current app config is missing required store identity/version fields.

In [app.json](app.json), missing:
- `expo.ios.bundleIdentifier`
- `expo.android.package`
- `expo.ios.buildNumber`
- `expo.android.versionCode`

Impact:
- Store binaries cannot be uniquely identified/versioned for submission and updates.

### 3.3 Placeholder Google Maps Keys
Current config contains placeholders:
- `YOUR_ANDROID_KEY`
- `YOUR_IOS_KEY`

Reference:
- [app.json](app.json)

Impact:
- Map-related production behavior may fail or be rejected during review testing.

### 3.4 Missing Legal/Compliance Assets
No privacy policy file/link is present in repo.
No App Store privacy details / Play Data Safety mapping artifacts found.

Impact:
- Submission will stall during metadata/compliance steps.

## 4. High-Risk Review Items

### 4.1 Critical Alert Claim on iOS
`UNAuthorizationOptionCriticalAlert` is enabled.

Reference:
- [app.json](app.json)

Risk:
- Apple requires special entitlement/justification for critical alerts.
- If not approved, app review may reject or delay release.

### 4.2 Permission Timing Strategy
Permissions are requested aggressively in startup flows.

References:
- [app/_layout.tsx](app/_layout.tsx)
- [lib/location/permissions.ts](lib/location/permissions.ts)

Risk:
- App review and user trust are better when background location is requested contextually after clear user intent.

### 4.3 Notification Done Action Is Partial
Done action currently logs only and does not fully mutate reminder state.

Reference:
- [app/_layout.tsx](app/_layout.tsx)

Risk:
- Feature behavior may appear incomplete during QA/review.

## 5. Non-Blocking Gaps (Polish / Quality)

### 5.1 Lint Warnings
Current lint run reports warnings (no hard errors):
- [app/(tab)/settings.tsx](app/(tab)/settings.tsx)
- [components/signUpScreen.tsx](components/signUpScreen.tsx)
- [components/splashScreen.tsx](components/splashScreen.tsx)

### 5.2 Explorer Action Stubs
Some actions still show temporary alerts:
- Edit
- Duplicate
- Share
- Archive

Reference:
- [app/(tab)/explorer.tsx](app/(tab)/explorer.tsx)

## 6. Environment and Secret Handling Status

### 6.1 Positive
- `.env` is gitignored.
- Runtime API base URL configured for production backend.

References:
- [.gitignore](.gitignore)
- [.env](.env)
- [lib/api/client.ts](lib/api/client.ts)

### 6.2 Needs Hardening
- Build-time secrets and profile-specific env setup for EAS are not yet formalized.

## 7. Recommended Next Steps (Priority Order)

### Priority 1: Release Infrastructure
1. Create [eas.json](eas.json) with `development`, `preview`, and `production` profiles.
2. Add app identity/version fields to [app.json](app.json):
   - `ios.bundleIdentifier`
   - `android.package`
   - `ios.buildNumber`
   - `android.versionCode`

### Priority 2: Production Config and Credentials
1. Replace placeholder Google Maps keys in [app.json](app.json).
2. Move release secrets to EAS environment/secrets.

### Priority 3: Compliance Package
1. Publish a privacy policy URL.
2. Prepare App Store privacy responses.
3. Prepare Play Console Data Safety form.
4. Validate location permission rationale text against actual behavior.

### Priority 4: Product Completeness for Review
1. Implement real behavior for notification Done action.
2. Decide whether critical alerts are truly required; remove if not required.
3. Address lint warnings and remove noisy debug logs in release paths.

### Priority 5: QA and Submission
1. Perform device QA on iOS and Android release builds:
   - Fresh install
   - Login persistence across restart/offline
   - Background location trigger
   - Notification tap actions and snooze
   - Logout/login cycle
2. Build release binaries via EAS.
3. Submit to App Store Connect and Play Console.

## 8. Go/No-Go Decision

Current decision: NO-GO for store submission.

Reason:
- Release build pipeline and store identity/version metadata are incomplete.

Go-live condition:
- Priority 1 and Priority 2 completed, then compliance package and QA sign-off done.
