# 🕹️ Arcade Vault: The Resurrection of Retro
### From 30,000 Files of Chaos to a High-Performance Native Engine

![React Native](https://img.shields.io/badge/React_Native-SDK_54-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)
![Expo](https://img.shields.io/badge/Expo-EAS_Ready-000020?style=for-the-badge&logo=expo)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

> "This isn't just a gaming app. It's the story of a migration, a battle against legacy code, and a victory for modern mobile architecture."

---

## 📥 Download & Play
**Download the latest Android APK here:** [📲 Download Arcade Vault (Android APK)](https://expo.dev/accounts/benmoshe/projects/arcade-vault/builds/ba647825-ec41-4e90-8e96-f58391a429a2)

---

## 📖 The Journey (The Backstory)
This project began with a daunting challenge. I inherited a codebase from a web-based environment (Replit) that was drowning in over **30,000 files** of "bloatware". It was broken, the SDK was outdated, and it refused to run on a physical device.

As a 3rd-year Computer Science student, I decided to treat this as a professional **Reverse Engineering & Migration** mission. I stripped the project to its core, deleted the noise, and rebuilt it as a premium **React Native** application.

---

## 🛠️ Setup & Installation (For Developers)
If you want to run this project locally on your machine:
1. **Clone the repository:** `git clone https://github.com/BenMosheashvili/Arcade-Vault-Offline-Games.git`
2. **Install dependencies:** `npm install --legacy-peer-deps` (Crucial for SDK 54 compatibility).
3. **Start the development server:** `npx expo start -c`
4. **Scan the QR:** Use the **Expo Go** app on your Android/iOS device.

---

## 🎮 The Master Engines

### 🧊 Tetris Pro: The Matrix Implementation
This isn't a simple "falling blocks" game. The Tetris engine was built using a 2D Matrix rotation algorithm.
* **Ghost Piece Calculation:** Real-time projection of the block's landing position.
* **Wall Kick Logic:** Mathematically handling rotations against grid boundaries.
* **Rotation Matrix:**
  $$R = \begin{pmatrix} 0 & 1 \\ -1 & 0 \end{pmatrix}$$ 
  Applied to every tetromino coordinate during a spin.

### 🏓 Pong Evolution: Adaptive AI
The Pong engine features a dynamic AI that simulates human error. Instead of a "perfect wall", the CPU paddle uses a linear interpolation (Lerp) with a reaction delay, making the difficulty feel natural and challenging.

### 🐍 Snake & Beyond
Optimized for the lowest possible latency, utilizing React's `useRef` to maintain game state without triggering unnecessary re-renders, ensuring a buttery-smooth experience.

---

## 🚧 The "Battle of SDK 54" (Lessons Learned)
During development, we hit a wall—the infamous **Error 500 (Unable to resolve module)**.
* **The Conflict:** Peer dependency mismatches between React 18/19 and Expo's core.
* **The Strategy:** A full wipe of `node_modules` and a forced resolution using `--legacy-peer-deps`.
* **The Deployment Fix:** Implementing a custom `.npmrc` configuration to allow the **EAS Build** server to bypass dependency locks.

---

## 🚀 Future Roadmap
* [ ] Global Leaderboards (Firebase Integration)
* [ ] Bluetooth Multiplayer for Pong
* [ ] Achievement System (Native Haptics)

---

## 👨‍💻 Developed By
**Ben Moshiaishvili** - *3rd Year Computer Science Student @ Ashkelon Academic College*

> **Developer's Note:** While I have a deep-seated love for the flexibility of **JavaScript**, I chose to architect this project in **TypeScript**. This choice was driven by a commitment to high-quality, strict, and predictable code—ensuring the Arcade Vault is as stable as it is fun.

---
