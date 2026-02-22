# Proxi App - Audit Report

## 1. Features NOT Implemented Yet

### Real Maps Integration
- **Current state**: Using custom SVG drawings to simulate maps
- **Installed but unused**: `expo-maps`, `react-native-maps` packages are in `package.json` but never imported
- **What's needed**: Replace SVG maps in `location-picker.tsx` and `add-reminder.tsx` with actual `MapView` components

### Real Location Services
- **Current state**: Using hardcoded coordinates (Abuja, Nigeria area)
- **Installed but unused**: `expo-location` package exists but not integrated
- **What's needed**: 
  - Request location permissions
  - Get real user GPS coordinates
  - Background location tracking for proximity detection

### Places API Search
- **Current state**: Using hardcoded `POPULAR_LOCATIONS` array in `location-picker.tsx`
- **TODO comment**: `// TODO: Replace with actual Places API search`
- **What's needed**: Google Places API or similar for location search

### Push Notifications
- **Current state**: Only in-app modal notifications (simulate with navigation to `/notification` screen)
- **What's needed**: 
  - `expo-notifications` for local push notifications
  - Background notification triggers when entering geofences

### Geofencing
- **Current state**: Only simulated proximity detection in `lib/simulation/simulationContext.tsx`
- **What's needed**: Real geofencing using `expo-location` TaskManager for background location

---

## 2. Backend API - NOT Built Yet

All data is stored **locally in React state**. These TODOs exist in `context/reminderContext.tsx`:

| Feature | Current State | Location |
|---------|---------------|----------|
| Create Reminder | Local state only | Line 78-79 |
| Delete Reminder | Local state only | Line 85-86 |
| Toggle Reminder | Local state only | Line 94-95 |
| Update Reminder | Local state only | Line 103-104 |
| Fetch Reminders | Local state only | `home.tsx` Line 78 |

### Authentication
- **Current state**: Fake login/signup in `authContext.tsx` - just stores user in `AsyncStorage`, no real validation
- **What's needed**: Real authentication API

---

## 3. APIs You Need to Build (Go Backend)

### Auth Endpoints
```
POST   /api/auth/signup          { email, password, name }
POST   /api/auth/login           { email, password }
POST   /api/auth/logout
GET    /api/auth/me              → user profile
```

### Reminders CRUD
```
GET    /api/reminders            → list all user reminders
POST   /api/reminders            → create reminder
GET    /api/reminders/:id        → get single reminder
PUT    /api/reminders/:id        → update reminder
PATCH  /api/reminders/:id/toggle → toggle enabled state
DELETE /api/reminders/:id        → delete reminder
```

### Reminder Schema
```json
{
  "id": "string",
  "userId": "string",
  "title": "string",
  "location": "string",
  "address": "string",
  "radius": 300,
  "enabled": true,
  "icon": "⛽",
  "frequency": "once | always",
  "timeframe": {
    "startTime": "08:00",
    "endTime": "20:00"
  },
  "coordinates": {
    "latitude": 9.0820,
    "longitude": 7.4800
  },
  "triggered": false,
  "createdAt": "timestamp"
}
```

### Activity/History (for Activity tab)
```
GET    /api/activities           → list activity history
POST   /api/activities           → log activity event
```

---

## 4. Other Incomplete Features

| Feature | File | Issue |
|---------|------|-------|
| **Explorer screen** | `app/(tab)/explorer.tsx` | Uses local mock data, not from reminderContext |
| **Activity screen** | `app/(tab)/activity.tsx` | Hardcoded activities, no real data |
| **Edit reminder** | `app/(tab)/explorer.tsx` | Just logs to console, no edit screen |
| **Share/Archive** | `app/(tab)/explorer.tsx` | Console.log only |
| **Profile edit** | `app/(tab)/settings.tsx` | No profile editing functionality |
| **User location display** | `app/(tab)/home.tsx` | Hardcoded to "Abuja, NG" |
| **Distance calculation** | Reminders | Shows `--`, need real GPS to calculate |

---

## 5. Next Phase Recommendations

### Phase 1: Backend Foundation
1. Build Go backend with auth + reminders CRUD
2. Add API client to React Native app
3. Replace local state with API calls

### Phase 2: Real Location
1. Integrate `expo-location` for GPS
2. Replace SVG maps with `react-native-maps`
3. Implement Google Places API for search

### Phase 3: Notifications
1. Add `expo-notifications`
2. Implement geofencing with background tasks
3. Trigger local notifications on proximity

### Phase 4: Polish
1. Activity logging
2. Edit reminder flow
3. Cloud sync across devices

---

## 6. Package Dependencies Status

### Installed & Used
- `expo-router` - Navigation ✅
- `react-native-reanimated` - Animations ✅
- `nativewind` / `tailwindcss` - Styling ✅
- `@react-native-async-storage/async-storage` - Local storage ✅
- `lucide-react-native` - Icons ✅
- `react-native-svg` - SVG rendering ✅

### Installed & NOT Used
- `expo-location` - GPS/Location services ❌
- `expo-maps` - Maps ❌
- `react-native-maps` - Maps ❌

### NOT Installed (Needed)
- `expo-notifications` - Push notifications
- `expo-task-manager` - Background tasks
- `axios` or native fetch wrapper - API calls
