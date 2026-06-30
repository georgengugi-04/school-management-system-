# Ikonex Academy Student Management System

A production-ready full-stack Student Management System built with Next.js 15, Node.js, Express, Prisma ORM, and MySQL.

---

## Features

- **Authentication** — JWT-based login with role-based access (Super Admin, Admin, Teacher)
- **Dashboard** — Live stats, charts (enrollment trend, grade distribution, class performance), activity log
- **Student Management** — Register, edit, delete, search, filter, paginate students; auto-generate admission numbers
- **Class Streams** — CRUD for class streams; assign subjects; performance overview
- **Subjects** — CRUD with class assignment (many-to-many)
- **Assessments** — Record CAT (0-40) and Exam (0-60) scores; duplicate prevention; auto-grading
- **Results** — Class rankings, subject averages, student positions
- **PDF Reports** — Individual report cards and class performance reports
- **Settings** — Configurable grading scales, change password
- **Dark Mode** — Full light/dark theme support
- **Mobile Responsive** — Works on all screen sizes

---

## Tech Stack

| Layer       | Technology                              |
|-------------|----------------------------------------|
| Frontend    | Next.js 15, React, TypeScript, Tailwind CSS |
| UI          | Shadcn-style components, Recharts, Lucide |
| State       | Zustand                                |
| Forms       | React Hook Form + Zod                  |
| HTTP Client | Axios with interceptors                |
| Backend     | Node.js, Express, TypeScript           |
| Database    | MySQL + Prisma ORM 5                   |
| Auth        | JWT (access + refresh tokens)          |
| PDF         | PDFKit                                 |
| Security    | Helmet, CORS, bcrypt, Rate Limiting    |
| Testing     | Jest + Supertest                       |
| Deployment  | Vercel (frontend) + Railway (backend + DB) |

---

## Project Structure

```
ikonex-academy/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Seed script (creates admin + sample data)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts     # Prisma client singleton
│   │   ├── controllers/        # Business logic
│   │   │   ├── authController.ts
│   │   │   ├── studentController.ts
│   │   │   ├── classStreamController.ts
│   │   │   ├── subjectController.ts
│   │   │   ├── assessmentController.ts
│   │   │   ├── dashboardController.ts
│   │   │   └── reportController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT + RBAC middleware
│   │   │   ├── errorHandler.ts
│   │   │   └── notFoundHandler.ts
│   │   ├── routes/             # Express route definitions
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   ├── helpers.ts      # Admission number generator, grade calculator
│   │   │   ├── response.ts     # Standardised API responses
│   │   │   └── logger.ts
│   │   └── index.ts            # Express app entry
│   ├── tests/
│   ├── .env                    # Fill in your values
│   ├── package.json
│   ├── tsconfig.json
│   └── railway.json            # Railway deployment config
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/          # Login page
│   │   │   └── dashboard/      # All dashboard pages
│   │   │       ├── page.tsx        # Dashboard home
│   │   │       ├── students/       # Students CRUD
│   │   │       ├── classes/        # Class streams
│   │   │       ├── subjects/       # Subjects
│   │   │       ├── assessments/    # Score entry
│   │   │       ├── results/        # Rankings
│   │   │       ├── reports/        # PDF generation
│   │   │       └── settings/       # Grading scales
│   │   ├── components/
│   │   │   ├── providers/      # ThemeProvider
│   │   │   └── ui/             # Toaster
│   │   ├── hooks/
│   │   │   └── use-toast.ts
│   │   ├── lib/
│   │   │   ├── api.ts          # Axios instance with interceptors
│   │   │   ├── services.ts     # All API service calls
│   │   │   └── utils.ts        # Helpers, formatters
│   │   ├── store/
│   │   │   └── authStore.ts    # Zustand auth state
│   │   └── types/
│   │       └── index.ts        # TypeScript types
│   ├── .env.local              # Fill in your values
│   ├── package.json
│   ├── tailwind.config.ts
│   └── vercel.json
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- MySQL 8.0+ (local) or Railway MySQL (remote)
- npm or yarn

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/ikonex-sms.git
cd ikonex-sms
```

### 2. Backend setup

```bash
cd backend
npm install

# Create environment file
cp .env .env.backup
# Edit .env and set your DATABASE_URL
```

Edit `backend/.env`:
```env
DATABASE_URL="mysql://root:password@localhost:3306/ikonex_academy"
JWT_SECRET=your_secret_here
FRONTEND_URL=http://localhost:3000
```

```bash
# Push schema to database
npx prisma db push

# Seed with sample data
npx ts-node prisma/seed.ts

# Start dev server
npm run dev
```

Backend runs on: `http://localhost:5000`

### 3. Frontend setup

```bash
cd ../frontend
npm install

# Create environment file
cp .env.local .env.local.backup
# Edit .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Frontend runs on: `http://localhost:3000`

### 4. Login

```
Email:    admin@ikonexacademy.com
Password: Admin@123
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/students` | List students (paginated, searchable) |
| POST | `/api/students` | Register student |
| GET | `/api/students/:id` | Get student + assessments |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Soft delete student |
| GET | `/api/classes` | List class streams |
| POST | `/api/classes` | Create class stream |
| PUT | `/api/classes/:id` | Update class stream |
| DELETE | `/api/classes/:id` | Delete class stream |
| POST | `/api/classes/:id/subjects` | Assign subjects |
| GET | `/api/subjects` | List subjects |
| POST | `/api/subjects` | Create subject |
| PUT | `/api/subjects/:id` | Update subject |
| DELETE | `/api/subjects/:id` | Delete subject |
| POST | `/api/assessments` | Record score |
| PUT | `/api/assessments/:id` | Update score |
| DELETE | `/api/assessments/:id` | Delete score |
| GET | `/api/assessments/student/:id` | Student scores |
| GET | `/api/assessments/class/:id/results` | Class results + rankings |
| GET | `/api/reports/student/:id/card` | Download student report card PDF |
| GET | `/api/reports/class/:id` | Download class report PDF |
| GET | `/api/reports/grading-scales` | Get grading scales |
| PUT | `/api/reports/grading-scales/:id` | Update grading scale |

---

## Deployment

### Railway (Backend + Database)

1. Create a Railway account at [railway.app](https://railway.app)
2. New Project → Add MySQL database → copy `MYSQL_PUBLIC_URL`
3. New Service → GitHub Repo → set Root Directory: `backend`
4. Add environment variables:
   ```
   DATABASE_URL=<your Railway MySQL public URL>
   JWT_SECRET=<generate a strong random string>
   FRONTEND_URL=<your Vercel URL>
   NODE_ENV=production
   ```
5. Set Build Command: `npm install && npx prisma generate && npm run build`
6. Set Start Command: `node dist/index.js`
7. After first deploy, run in Railway console: `npx prisma db push && npx ts-node prisma/seed.ts`

### Vercel (Frontend)

1. Import repo to [vercel.com](https://vercel.com)
2. Set Root Directory: `frontend`
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
   ```
4. Deploy

---

## Grading System

| Grade | Range | Remarks |
|-------|-------|---------|
| A | 80 – 100 | Excellent |
| B | 70 – 79 | Very Good |
| C | 60 – 69 | Good |
| D | 50 – 59 | Average |
| E | 0 – 49 | Below Average |

Configurable from Settings → Grading Scale.

---

## Security

- Passwords hashed with **bcrypt** (12 rounds)
- **JWT** access tokens (7 days) + refresh tokens (30 days)
- **Helmet** HTTP security headers
- **CORS** restricted to frontend domain
- **Rate limiting** — 100 requests/15min (20 for auth)
- **Input validation** via express-validator
- Prisma parameterised queries prevent SQL injection

---

## Demo Credentials

```
Admin:   admin@ikonexacademy.com  /  Admin@123
Teacher: teacher@ikonexacademy.com / Teacher@123
```

---

Built as a Software Developer Internship Assessment for Ikonex Systems.
