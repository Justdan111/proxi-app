# Proxi Launch Readiness Audit (Updated)

Date: 23 April 2026  
Project: Proxi (Expo React Native)  
Scope: Production readiness for Apple App Store and Google Play Store

This report supersedes the previous audit dated 18 April 2026.

## 1. Executive Summary

Proxi has strong product and infrastructure progress and is close to release readiness, but it is **not yet ready** for store submission.

Current decision: **NO-GO**

Primary reasons:
- Android release identity is incomplete (`android.package` not configured).
- Notifications plugin references a missing icon asset.
- Required Mapbox native build secret is not configured (`MAPBOX_DOWNLOADS_TOKEN`).
- Compliance package (privacy policy + store privacy declarations) is not yet complete.

## 2. What Is Done

### 2.1 Build and Release Infrastructure
- EAS build profiles are implemented for development, preview, and production.
- Production build auto-increment is configured.
- EAS submit configuration exists.

Reference:
- [eas.json](eas.json)

### 2.2 App Identity (Partial)
- iOS bundle identifier is configured.

Reference:
- [app.json](app.json)

### 2.3 Core Product Functionality
Implemented and integrated:
- Auth/session persistence
- Reminder CRUD + toggle
- Activity logging
- Background geofencing flow
- Notification categories and response listener wiring
- Add reminder and location picker flows with corrected location param contract

References:
- [context/authContext.tsx](context/authContext.tsx)
- [context/reminderContext.tsx](context/reminderContext.tsx)
- [lib/location/geofencing.ts](lib/location/geofencing.ts)
- [lib/notifications/notifications.ts](lib/notifications/notifications.ts)
- [app/_layout.tsx](app/_layout.tsx)
- [app/add-reminder.tsx](app/add-reminder.tsx)
- [app/location-picker.tsx](app/location-picker.tsx)

### 2.4 Backend/API Production Defaults
- Production API fallback is configured.
- Token auth plumbing is in place.

Reference:
- [lib/api/client.ts](lib/api/client.ts)

## 3. Remaining Launch Blockers (Must Fix)

### 3.1 Missing Android Package Name
`android.package` is not configured in Expo config.

Impact:
- Play Store release identity is incomplete.

Fix:
- Add `expo.android.package` in [app.json](app.json).

### 3.2 Missing Notification Icon Asset
Expo notifications plugin points to `./assets/notification-icon.png`, but file is missing.

Impact:
- Build/runtime notification icon issues and potential submission QA failures.

Fix:
- Add the asset at the configured path, or update the config to a real existing asset.

Reference:
- [app.json](app.json)

### 3.3 Missing Mapbox Native Build Secret
Resolved config check warns that `MAPBOX_DOWNLOADS_TOKEN` is not set.

Impact:
- Native iOS/Android builds with `@rnmapbox/maps` may fail during dependency install.

Fix:
- Add `MAPBOX_DOWNLOADS_TOKEN` to EAS secrets/environment for release builds.

Reference:
- [app.config.ts](app.config.ts)

### 3.4 Compliance Deliverables Incomplete
No privacy policy artifact/link was found in repo, and store privacy declarations are not yet documented as complete.

Impact:
- Store submission blocked or delayed during metadata/compliance review.

Fix:
- Publish privacy policy URL.
- Complete App Store privacy labels.
- Complete Play Console Data Safety form.

## 4. High-Risk Review Items

### 4.1 iOS Critical Alerts Flag Enabled
`UNAuthorizationOptionCriticalAlert` is enabled.

Risk:
- Apple generally requires entitlement approval and clear justification for critical alerts.

Action:
- Remove unless absolutely required and approved.

Reference:
- [app.json](app.json)

### 4.2 Notification "Done" Action Is Incomplete
Current handler logs instead of applying a reminder state mutation.

Risk:
- Reviewer-visible functionality appears partial.

Reference:
- [app/_layout.tsx](app/_layout.tsx)

### 4.3 Permission Timing Strategy
Background/location permission request flow is startup-centric.

Risk:
- Higher review scrutiny and poorer user trust/conversion than contextual prompts.

Reference:
- [app/_layout.tsx](app/_layout.tsx)

## 5. Quality and Polish Gaps (Non-Blocking but Recommended)

### 5.1 Lint Status
Current lint run reports 4 warnings (0 errors):
- [app/(tab)/settings.tsx](app/(tab)/settings.tsx)
- [app/location-picker.tsx](app/location-picker.tsx)
- [components/signUpScreen.tsx](components/signUpScreen.tsx)
- [components/splashScreen.tsx](components/splashScreen.tsx)

### 5.2 Explorer Screen Placeholder Actions
The following actions still show "Coming soon" alerts:
- Edit
- Duplicate
- Share
- Archive

Reference:
- [app/(tab)/explorer.tsx](app/(tab)/explorer.tsx)

## 6. Changes Since Previous Audit

Resolved since the earlier report:
- EAS build configuration is now present and valid.
- Previous Google Maps placeholder-key blocker is outdated; current implementation uses Mapbox token flow.

Updated map-related release blocker:
- Ensure both runtime token (`EXPO_PUBLIC_MAPBOX_TOKEN`) and native download token (`MAPBOX_DOWNLOADS_TOKEN`) are configured in release environment.

## 7. Final Go/No-Go Status

Current decision: **NO-GO**

Go-live criteria:
1. Configure `android.package` in [app.json](app.json).
2. Fix notifications icon asset path/file mismatch.
3. Set required Mapbox release secrets for EAS build.
4. Complete privacy policy + App Store privacy + Play Data Safety.
5. Run final physical-device QA on release builds and verify background location + notification action behavior.

## 8. Recommended Immediate Next Actions

1. Patch [app.json](app.json) for `android.package` and notification icon correctness.
2. Add EAS secrets: `MAPBOX_DOWNLOADS_TOKEN` and `EXPO_PUBLIC_MAPBOX_TOKEN`.
3. Remove or justify critical alerts usage before iOS submission.
4. Implement full "Done" notification action behavior.
5. Finish compliance package and submission metadata.
