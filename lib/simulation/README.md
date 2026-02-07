# Simulation Archive

This folder contains simulation/test code that was used during development.
These files are not currently in use but are preserved for future testing purposes.

## Contents

- `simulationContext.tsx` - Full simulation context with test locations and proximity simulation
- `SimulationLocationPicker.tsx` - Test map-based location picker with SVG visualization
- `SIMULATION_GUIDE.md` - Documentation for how to use the simulation

## Why Archived?

The app was converted to production-ready state with:
- Real maps using `react-native-maps` instead of SVG test maps
- Clean reminder context ready for backend API integration
- Location services using `expo-location` for real GPS

## How to Re-enable Simulation

To use simulation mode again for testing without real location:

### 1. Replace the reminder context:
```bash
cp lib/simulation/simulationContext.tsx context/reminderContext.tsx
```

### 2. Replace the location picker:
```bash
cp lib/simulation/SimulationLocationPicker.tsx app/location-picker.tsx
```

### 3. Add simulation controls to home screen:
Add these to the useReminders destructure in `app/(tab)/home.tsx`:
```tsx
const { 
  reminders, 
  toggleReminder,
  proximityAlerts,
  currentSimulatedLocation,
  isSimulationRunning,
  startSimulation,
  stopSimulation,
} = useReminders();
```

Then add the simulation modal and controls (see SIMULATION_GUIDE.md for full code).

## Features in Simulation Mode

- **Test Locations**: 8 predefined locations in Abuja, Nigeria
- **Path Simulation**: Automated movement from home to Shell Gas Station
- **Proximity Detection**: Triggers notifications when simulated user enters a reminder's radius
- **SVG Map**: Visual representation of user position and reminder locations
