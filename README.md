# 🗳️ ElectZone - School E-Voting System

A modern, secure, and real-time electronic voting system built for schools and educational institutions.

## ✨ Features

- **🔐 Secure Voting** - Anonymous voting with encrypted payloads and vote hashing
- **⚡ Real-time Results** - Live vote counting and turnout statistics via Supabase Realtime
- **📊 Admin Dashboard** - Comprehensive election monitoring with charts and analytics
- **🎯 User-Friendly** - Simple and intuitive voting interface for students
- **🔒 Access Control** - Role-based authentication (Voters & Admin)
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **🚀 Fast & Modern** - Built with React, Vite, and Supabase

## 🛠️ Tech Stack

**Frontend:**
- React 19
- Vite
- React Router
- CSS3 (Custom animations & responsive design)

**Backend:**
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Real-time subscriptions
- JSONB for vote storage

**Security:**
- Anonymous voting with UUID tokens
- SHA-256 payload hashing
- PostgreSQL views for vote counting
- RLS policies for data protection

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/Amarillora/ElectZone.git
cd ElectZone
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
Create a `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON=your_supabase_anon_key
```

4. Run development server
```bash
npm run dev
```

5. Build for production
```bash
npm run build
```

## 📖 Usage

### Voter Login
- Navigate to `/login`
- Enter your Student ID (e.g., `2021001`)
- Vote for candidates in each position
- Review and submit your ballot

### Admin Access
- Navigate to `/login`
- Enter admin code: `ADmin69`
- Monitor election in real-time
- View results and statistics

## 📁 Project Structure

```
elect-zone/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── utils/          # Utility functions
│   └── css/            # Stylesheets
├── public/             # Static assets
└── supabase-schema.sql # Database schema
```

## 🔧 Configuration

### Database Setup
Run the `supabase-schema.sql` file in your Supabase SQL Editor to create:
- Tables (voters, elections, candidates, votes, admins)
- RLS policies
- Helper functions
- Views for reporting
- Seed data

## 🌟 Key Features

### For Voters
- One-time voting per election
- Anonymous ballot submission
- Real-time vote confirmation
- Mobile-responsive interface

### For Admins
- Live election monitoring
- Candidate management
- Vote count tracking
- Turnout statistics
- Real-time updates

## 📊 Database Schema

- **voters** - Student information and voting status
- **elections** - Election details and status
- **candidates** - Candidate profiles by position
- **votes** - Anonymous vote records with JSONB payload
- **admins** - Administrator accounts

## 🔒 Security Features

- Row Level Security (RLS) enabled
- Vote tokens for anonymity
- Payload hashing for integrity
- Double voting prevention
- Secure admin authentication

## 🚀 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

**Recommended Hosting:**
- Frontend: Vercel / Netlify
- Backend: Supabase (already configured)

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**Amarillora**
- GitHub: [@Amarillora](https://github.com/Amarillora)

## 🙏 Acknowledgments

- Supabase for backend infrastructure
- React team for the amazing framework
- Vite for blazing fast build tool

---

**⭐ Star this repo if you find it useful!**

