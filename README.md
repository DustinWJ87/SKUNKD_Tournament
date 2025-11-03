# 🎮 SKUNKD Tournament Platform

A modern, full-featured tournament management platform for gaming events. Built with Next.js 14, TypeScript, Prisma, and Tailwind CSS.

## ✨ Features

### 🎯 Core Features
- **Event Management** - Create, manage, and track gaming tournaments
- **User Authentication** - Secure login with NextAuth.js
- **Team Formation** - Create teams and register as groups
- **Seat Selection** - Interactive seat map with real-time reservations
- **Player Profiles** - Track stats, achievements, and tournament history
- **Admin Dashboard** - Full administrative control panel
- **Registration System** - Player and team registration with waitlists

### 🔥 Advanced Features
- **Role-Based Access Control** - Admin, Organizer, and Player roles
- **Real-time Updates** - Live seat availability and registration status
- **Payment Integration** - Entry fees and prize pool tracking
- **Event Status Tracking** - Draft, Published, In Progress, Completed
- **Check-in System** - Track player attendance
- **Responsive Design** - Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DustinWJ87/SKUNKD_Tournament.git
   cd SKUNKD_Tournament
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/skunkd_tournaments"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev --name init
   
   # (Optional) Seed the database
   npx prisma db seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
SKUNKD_Tournament/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   └── events/        # Public event pages
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   └── profile/           # User profiles
│   ├── components/
│   │   ├── layout/            # Layout components
│   │   └── seat-selection/    # Seat map components
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   └── prisma.ts          # Prisma client
│   └── styles/
│       └── globals.css        # Global styles
├── .env.example               # Environment variables template
├── next.config.mjs            # Next.js configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

## 🎨 Database Schema

The platform uses the following main models:

- **User** - Player accounts with roles (Admin, Organizer, Player)
- **Event** - Tournament events with dates, capacity, and rules
- **EventRegistration** - Player registrations for events
- **Team** - Player teams for team-based tournaments
- **TeamMember** - Team membership with roles (Captain, Member)
- **Seat** - Physical or virtual seats for events
- **SeatReservation** - Seat assignments and reservations

## 🔐 Authentication

The platform uses NextAuth.js with:
- Credentials provider (email/password)
- JWT session strategy
- Role-based access control
- Protected routes and API endpoints

## 📊 API Routes

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create new event (Admin/Organizer only)
- `GET /api/events/[id]` - Get event details
- `PATCH /api/events/[id]` - Update event (Admin/Organizer only)
- `DELETE /api/events/[id]` - Delete event (Admin only)

### Registrations
- `POST /api/events/[id]/register` - Register for event
- `DELETE /api/events/[id]/register` - Cancel registration
- `GET /api/registrations` - Get user's registrations

### Teams
- `GET /api/teams` - List user's teams
- `POST /api/teams` - Create new team
- `PATCH /api/teams/[id]` - Update team
- `POST /api/teams/[id]/members` - Add team member

## 🎯 Roadmap

- [ ] Email notifications
- [ ] Discord integration
- [ ] Tournament brackets
- [ ] Live streaming integration
- [ ] Mobile app
- [ ] Payment processing (Stripe)
- [ ] Analytics dashboard
- [ ] Tournament leaderboards

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma for the excellent database toolkit
- Tailwind CSS for the utility-first CSS framework

---

Built with ❤️ for the gaming community
