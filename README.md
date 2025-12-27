# 🚀 FinBoard – Customizable Finance Dashboard

A modern, customizable **real-time finance dashboard** built using **Next.js** that allows users to connect financial APIs and visualize data through interactive widgets.

🔗 **Live Demo:** https://assignment-g.vercel.app/

---

## 🖼️ Project Preview

<p align="center">
  <img src="https://github.com/addy0328p/ASSIGNMENT_G/blob/main/Screenshot%202025-12-27%20110907.png" alt="FinBoard Dashboard" width="900" />
</p>

<p align="center">
  <img src="https://github.com/addy0328p/ASSIGNMENT_G/blob/main/Screenshot%202025-12-27%20111131.png" alt="Add Widget Modal" width="900" />
</p>

<p align="center">
  <img src="https://github.com/addy0328p/ASSIGNMENT_G/blob/main/Screenshot%202025-12-27%20110842.png" alt="Widget Data Display" width="900" />
</p>

---

## ✨ Features

### 🧩 Widget Management
- Create widgets using **predefined or custom financial APIs**
- Display data as:
  - 📊 Cards
  - 📋 Tables
  - 📈 Charts
- Drag & drop widgets to rearrange dashboard layout
- Delete widgets instantly

### 🔌 API Integration
- Test APIs before adding widgets
- Explore API JSON responses
- Select exact fields to display
- Built-in support for:
  - Coinbase
  - Twelve Data
  - Alpha Vantage
- Client-side API rate-limit tracking

### 🔄 Real-Time Updates
- Auto-refresh widgets at configurable intervals
- Countdown timer visible per widget
- Error and loading states handled gracefully

### 🎨 User Experience
- Light / Dark theme toggle
- Responsive layout (desktop & mobile)
- Smooth animations and modern UI
- Clean and intuitive modal-based configuration

### 💾 Persistence & Export
- Dashboard state saved using **LocalStorage**
- Restore widgets automatically on page reload
- Export dashboard configuration as JSON

---

## 🧭 How to Use

1. Click **Add Widget**
2. Choose a predefined API or switch to **Custom API**
3. Click **Test** to fetch sample data
4. Select required fields from the JSON explorer
5. Choose display type (Card / Table / Chart)
6. Set refresh interval and click **Add Widget**
7. Rearrange widgets using drag & drop

---

## ⚙️ Tech Stack

- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **Icons:** lucide-react
- **State Management:** React Hooks
- **Persistence:** Browser LocalStorage
- **Deployment:** Vercel

---

## 🧪 Run Locally

```bash
git clone https://github.com/addy0328p/ASSIGNMENT_G.git
cd ASSIGNMENT_G/my-next-app
npm install
npm run dev
