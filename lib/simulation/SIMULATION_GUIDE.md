# Proxi - Location Simulation Test Guide

## Summary of Changes

### 1. New Reminder Context (`context/reminderContext.tsx`)
Created a comprehensive context that manages:
- **Reminders storage** with full CRUD operations
- **Test locations** (8 pre-defined locations in Abuja area: Shell Gas Station, Shoprite Mall, Transcorp Hilton, etc.)
- **Location simulation system** that simulates user movement along a path
- **Proximity detection** using Haversine formula to calculate real distances
- **Proximity alerts** that trigger when user enters a reminder's radius

### 2. Updated Location Picker (`app/location-picker.tsx`)
- **Interactive SVG map** showing all test locations on a grid
- **Search functionality** to filter locations by name, address, or category
- **Visual markers** for each location with emoji icons
- **User location indicator** (blue dot)
- **Selected location highlighting** (green accent)
- **"SIMULATION MODE" badge** to indicate test environment
- **Quick-select list** of all available test locations
- **Confirm button** that passes location data back to add-reminder

### 3. Enhanced Add Reminder Screen (`app/add-reminder.tsx`)
- **Repeat options**: "Once" (triggers once then auto-disables) or "Always" (triggers every time)
- **Time frame toggle** with start/end time inputs
- **Visual map preview** showing the location and radius
- **Dynamic radius visualization** with dashed circle
- **Radius options**: 100m, 300m, 500m
- Saves reminders to the context for persistence

### 4. Updated Home Screen (`app/(tab)/home.tsx`)
- **Displays reminders from context** (new reminders appear immediately)
- **Simulation control button** in header (navigation icon)
- **Simulation status banner** when running
- **Full simulation modal** with:
  - Live map showing user movement and reminder zones
  - Start/Stop simulation controls
  - Active reminders tracking list
  - Visual radius zones around each reminder
- **Proximity notification modal** that shows:
  - Animated alert when user enters a reminder's zone
  - Distance information
  - "Got it" and "Dismiss" buttons

### 5. Root Layout Update (`app/_layout.tsx`)
- Added `ReminderProvider` wrapper to make context available throughout the app

---

## How to Test the Full Simulation

1. **Open the app** and navigate to the Home screen
2. **Tap the navigation icon** (top right, next to the bell) to open the simulation modal
3. **View the map** showing your simulated position and reminder locations with their radius zones
4. **Tap "Start Simulation"** - Your virtual position will move towards Shell Gas Station
5. **Watch the distance update** in real-time on the tracked reminders
6. **When you enter a reminder's radius** (e.g., the "Buy fuel" reminder at Shell Gas Station), a **proximity notification** will pop up
7. **The notification shows** the reminder details, location, and exact distance

---

## Adding New Reminders (Test Flow)

1. From Home, tap **"Add New"** or the **plus button** in the tab bar
2. Enter a reminder title (e.g., "Buy groceries")
3. Tap on the location to open the **Location Picker**
4. **Search** for a location or **select from the list** (e.g., "Shoprite Mall")
5. **Confirm** the location selection
6. Choose **repeat mode**: Once or Always
7. Optionally enable **time frame** restrictions
8. Select **proximity radius** (100m, 300m, or 500m)
9. Tap **"Save Reminder"**
10. The new reminder appears on the Home screen immediately!

---

## Test Locations Available

| Location | Address | Category | Icon |
|----------|---------|----------|------|
| Shell Gas Station | Wuse II, Abuja | Fuel | ⛽ |
| Shoprite Mall | Jabi, Abuja | Shopping | 🛒 |
| Transcorp Hilton | Maitama, Abuja | Hotel | 🏨 |
| National Mosque | Central Area, Abuja | Landmark | 🕌 |
| Jabi Lake Mall | Jabi, Abuja | Shopping | 🏬 |
| Wuse Market | Wuse Zone 5, Abuja | Market | 🛍️ |
| Gym & Fitness Center | Garki, Abuja | Fitness | 💪 |
| Home | Maitama District, Abuja | Home | 🏠 |

---

## Simulation Path

The simulation moves the user from **Home (Maitama)** towards **Shell Gas Station (Wuse II)** in 7 steps:

```
Start: Home (9.0765, 7.3986)
  ↓
Step 1: (9.0770, 7.4100)
  ↓
Step 2: (9.0780, 7.4300)
  ↓
Step 3: (9.0790, 7.4500)
  ↓
Step 4: (9.0800, 7.4650)
  ↓
Step 5: (9.0810, 7.4750)
  ↓
End: Shell Gas Station (9.0820, 7.4800)
```

Each step takes **2 seconds**, so the full simulation runs for approximately **14 seconds**.

---

## Features Demonstrated

- ✅ Location-based reminders
- ✅ Interactive map with test locations
- ✅ Location search functionality
- ✅ Repeat once / repeat always options
- ✅ Time frame restrictions
- ✅ Proximity radius selection (100m, 300m, 500m)
- ✅ Real-time distance calculation
- ✅ Proximity notification when entering zone
- ✅ Simulation mode for testing without real GPS
