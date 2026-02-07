# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```



# Proxi

**Proxi** is a location-based reminder app that helps you remember things based on *where you are*, not *what time it is*.

Instead of setting alarms for specific times, Proxi lets you attach reminders to real-world locations. When you get close to that place, Proxi notifies you — quietly and intelligently.

---

## 🚩 The Problem

Traditional reminders are time-based, but many tasks only make sense in specific places.

Examples:

* Buying fuel when near a fuel station
* Picking up groceries when close to a store
* Remembering an errand when passing a location

Time-based reminders either trigger too early, too late, or get ignored entirely.

---

## 💡 The Solution

Proxi uses **location awareness** instead of time.

You create a reminder, choose a location, and define how close you need to be. When you enter that area, Proxi sends a notification.

No constant alerts. No clutter. Just the right reminder at the right place.

---

## 🧠 How Proxi Works

1. **Create a reminder**
   Write what you want to remember (e.g. “Buy fuel”).

2. **Select a location**
   Choose the place where the reminder should trigger.

3. **Set a proximity radius**
   Decide how close you need to be (e.g. 100m, 300m).

4. **Background location monitoring**
   Proxi quietly listens for location changes using GPS and geofencing.

5. **Proximity detected**
   When you enter the radius, Proxi detects it instantly.

6. **Notification triggered**
   You receive a local notification like:

   > “You’re nearby — don’t forget to buy fuel.”

---

## ✨ Why Proxi Feels Smart

* Uses location instead of time
* Works even when the app is closed
* Battery-efficient geofencing
* No unnecessary notifications
* Simple and distraction-free design

Proxi feels intelligent without being complicated.

---

## 🧱 Tech Overview

### Mobile App

* Built with **Expo (React Native)**
* Uses:

  * GPS location tracking
  * Geofencing
  * Local notifications
  * Dark & Light mode support
* Styled with **NativeWind**
* Smooth animations using React Native animations

### Backend

* Built with **Go**
* Responsibilities:

  * User authentication
  * Reminder storage
  * Syncing across devices
  * Backup and future analytics

The mobile app handles real-time location logic, while the backend focuses on data and accounts. This keeps the app fast and reliable.

---

## 🎯 Core Philosophy

Proxi is designed to be:

* Simple
* Quiet
* Useful
* Context-aware

It stays out of the way until the moment you need it.

---

## 🏁 One-Line Summary

**Proxi helps you remember things based on where you are, not what time it is.**

---

## 🚀 Status

This project is currently under active development.

Future plans include:

* Cloud sync
* Advanced location rules
* Analytics (optional)
* Expanded notification controls
