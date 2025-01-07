# Snug Chat Application

A modern, real-time chat application built with Next.js and Supabase.

## Tech Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui components
- shadcn-chat components

### Backend
- Supabase
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security
  - Built-in authentication
  - Database functions

## Features
- Real-time messaging
- Channel-based chat rooms
- User authentication
- Message search functionality
- Modern UI components
- Responsive design

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/snug.git
cd snug
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```
Then edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development Process

This project follows a structured development approach:
- Architecture defined in SECOND ARCH document
- Implementation guided by FINAL_IMPLEMENTATION_CHECKLIST
- Iterative development with continuous testing
- Focus on code quality and type safety

## License

[MIT License](LICENSE)
