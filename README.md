# KnowASport — Tamil Nadu Sports Discovery & Tournament Management Platform

KnowASport is a sports discovery and tournament management web application built for Tamil Nadu. It enables athletes to discover local sports events, register individually or as a team, pay entry fees securely via Razorpay, and present digital QR passes for event check-in. It also empowers verified organizers to host, manage, and verify tournament entries.

---

## 🏆 Key Features

- **Public Event Discovery**: Discover football leagues, cricket tournaments, badminton opens, and kabaddi matches across Tamil Nadu (Coimbatore, Chennai, Madurai, Tiruppur, Salem, Erode, Trichy).
- **Sports Editorial & News Hub**: Read authentic sports stories, local tournament updates, and athlete spotlights (`/blog` and `/blog/:slug`).
- **Individual & Team Registrations**: Complete registration flows with automatic squad management and unique registration codes.
- **Secure Razorpay Payment Integration**: Integrated Razorpay order creation, payment verification signatures, and payment webhooks.
- **Digital QR Ticket Passes & Organizer Mobile Web Check-in**: High-contrast QR ticket passes with real-time verification and manual fallback check-in.
- **Organizer Platform**: Become an organizer, get verified, create tournaments, manage rosters, and track check-in analytics.
- **Internal Admin Control Console**: Secure private Admin panel (`/admin/login`) for platform operations, organizer identity verification, event publishing approvals, transaction audit logs, and Tamil Nadu district reporting.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Lucide React
- **Backend & Database**: Supabase (PostgreSQL, Supabase Auth, Row Level Security, Edge Functions)
- **Payments**: Razorpay API
- **Deployment & Router**: React Router v7

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm / pnpm / yarn

### 2. Installation
```bash
# Clone repository
git clone https://github.com/Shafiq-11/KnowASport.git
cd KnowASport

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 4. Running Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## 📜 License
MIT License. Created for Tamil Nadu sports community.
