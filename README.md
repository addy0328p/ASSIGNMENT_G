<h2 align="center">GROWW ASSIGNMENT</h2>

---

# 🎯 FinBoard – Customizable Finance Dashboard  
**Groww Frontend Assignment**

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3+-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Deployed](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)](https://assignment-g.vercel.app/)

A **real-time, customizable finance dashboard** that enables users to create widgets by connecting to financial APIs and visualizing selected data fields in multiple formats.

🔗 **Live Demo:** https://assignment-g.vercel.app/

---

## 🖼️ Project Preview

<p align="center">
  <img src="https://github.com/addy0328p/ASSIGNMENT_G/blob/main/Screenshot%202025-12-27%20110907.png" width="900" alt="FinBoard Dashboard" />
</p>

<p align="center">
  <img src="https://github.com/addy0328p/ASSIGNMENT_G/blob/main/Screenshot%202025-12-27%20111131.png" width="900" alt="Add Widget Modal" />
</p>

<p align="center">
  <img src="https://github.com/addy0328p/ASSIGNMENT_G/blob/main/Screenshot%202025-12-27%20110842.png" width="900" alt="Widget Configuration & Data View" />
</p>

---

## ✨ Key Features

### 🧩 Widget Management
- Add finance widgets using predefined or custom APIs
- Display data as **Card**, **Table**, or **Chart**
- Drag & drop widgets to rearrange the dashboard
- Instantly delete widgets
- Custom widget titles

### 🔌 API Integration
- Built-in support for:
  - **Coinbase** (Crypto exchange rates)
  - **Twelve Data** (Stock & crypto time series)
  - **Alpha Vantage** (Stock market data)
- Support for **custom JSON APIs**
- Interactive JSON field explorer
- Nested object & array field selection

### ⏱ Real-Time Updates
- Auto-refresh widgets (5–300 seconds)
- Live countdown timer before refresh
- Client-side API rate-limit tracking
- Visual API usage indicators

### 🎨 User Experience
- Light / Dark theme toggle
- Fully responsive layout
- Clean modal-based widget creation
- Loading, error, and empty states handled gracefully

### 💾 Persistence & Export
- Widget and layout persistence via **localStorage**
- Dashboard restored on page reload
- Export dashboard configuration as JSON

---

## 🚀 Run Locally

```bash
git clone https://github.com/addy0328p/ASSIGNMENT_G.git
cd ASSIGNMENT_G/my-next-app
npm install
npm run dev
