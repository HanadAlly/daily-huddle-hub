# Daily Huddle Hub

Daily Huddle Hub is a modern team standup application that enables teams to share daily updates, track progress, and improve communication in a simple and collaborative environment.

## Features

* User authentication with email and password
* Google OAuth sign-in
* Daily standup posting
* Team activity feed
* Responsive user interface
* Real-time backend powered by Supabase
* Secure user session management
* Fast and scalable deployment using Vercel

## Tech Stack

### Frontend

* React
* TypeScript
* TanStack Start
* TanStack Router
* Tailwind CSS
* ShadCN UI
* Lucide React Icons

### Backend & Database

* Supabase Authentication
* Supabase PostgreSQL Database

### Deployment

* Vercel

## Project Structure

```text
src/
├── components/
│   ├── ui/
│   └── shared/
├── integrations/
│   ├── supabase/
│   └── lovable/
├── routes/
├── hooks/
├── lib/
├── styles/
└── server.ts
```

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd daily-huddle-hub
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

## Environment Variables

Create a `.env` file in the project root and add:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Building for Production

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Deployment

This project is configured for deployment on Vercel.

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure environment variables.
4. Deploy.

## Authentication

The application supports:

* Email and Password Authentication
* Google OAuth Authentication

Authentication and session management are handled through Supabase.

## Future Improvements

* Team management
* User profiles
* Notifications
* Comment system
* Analytics dashboard
* Mobile application support

## Author

Ali Hanad
