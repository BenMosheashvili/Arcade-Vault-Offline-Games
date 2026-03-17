# 🕹️ Arcade Vault: The Resurrection of Retro
### From 30,000 Files of Chaos to a High-Performance Native Engine

![React Native](https://img.shields.io/badge/React_Native-SDK_54-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)
![Expo](https://img.shields.io/badge/Expo-EAS_Ready-000020?style=for-the-badge&logo=expo)

> "This isn't just a gaming app. It's the story of a migration, a battle against legacy code, and a victory for modern mobile architecture."

---

## 📸 Preview
![Arcade Vault Demo](./screenshots/demo.png) 
*(כאן תופיע התמונה אחרי שתעלה אותה לתיקיית screenshots)*

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
2. **Install dependencies:** `npm install --legacy-peer-deps` 
3. **Start the development server:** `npx expo start -c`

---

## 🎮 The Master Engines

### 🧊 Tetris Pro: The Matrix Implementation
The Tetris engine was built using a 2D Matrix rotation algorithm.
* **Ghost Piece Calculation:** Real-time projection of the block's landing position.
* **Wall Kick Logic:** Mathematically handling rotations against grid boundaries.
* **Rotation Matrix:**
  $$R = \begin{pmatrix} 0 & 1 \\ -1 & 0 \end{pmatrix}$$ 

### 🏓 Pong Evolution: Adaptive AI
The Pong engine features a dynamic AI that simulates human error. Instead of a "perfect wall", the CPU paddle uses a linear interpolation (Lerp) with a reaction delay.

---

## 👨‍💻 Developed By
**Ben Moshiaishvili** - *3rd Year Computer Science Student @ Ashkelon Academic College*

> **Developer's Note:** While I have a deep-seated love for the flexibility of **JavaScript**, I chose to architect this project in **TypeScript**. This choice was driven by a commitment to high-quality, strict, and predictable code—ensuring the Arcade Vault is as stable as it is fun.
