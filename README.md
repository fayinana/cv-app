# CVSmart - AI-Powered Resume Analysis Platform

A modern Next.js application that helps job seekers optimize their resumes using AI-powered analysis, matching resumes against job descriptions to provide actionable feedback.

## Features

- 🤖 AI-powered resume analysis using Google Gemini
- 📄 PDF resume upload and text extraction
- 🎯 Job description matching with scoring
- 👤 User authentication and profiles
- 🌐 Multi-language support (English, Amharic, Oromo)
- 🎨 Dark/Light theme support
- 📊 Detailed feedback on strengths and gaps

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Authentication:** Supabase Auth
- **Database:** Supabase (PostgreSQL)
- **AI:** Google Gemini API
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Language:** TypeScript

## Prerequisites

- Node.js 18+ installed
- A Supabase account ([sign up here](https://supabase.com))
- Google AI API key 

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd cv-app
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google AI (Optional - for enhanced analysis)
GOOGLE_API_KEY=your-google-api-key

# SerpAPI (Optional - for job recommendations)
SERPAPI_API_KEY=your-serpapi-key
```

**Getting Supabase Credentials:**
1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to Project Settings → API
3. Copy the `URL` and `anon/public` key
4. Copy the `service_role` key (keep this secret!)

**Getting Google AI API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add it to your `.env.local`

### 3. Database Setup

Run the Supabase migrations to set up your database:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL in supabase/migrations/001_create_profiles.sql
# in your Supabase SQL Editor
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
cv-app/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main application pages
│   ├── api/               # API routes
│   └── actions/           # Server actions
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── forms/            # Form components
│   ├── ui/               # UI components (Radix)
│   └── layout/           # Layout components
├── lib/                   # Utility libraries
│   ├── ai/               # AI integration (Gemini)
│   ├── logic/            # Business logic
│   ├── supabase/         # Supabase clients
│   └── types.ts          # TypeScript types
├── messages/             # i18n translations
└── supabase/             # Database migrations
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Key Features Explained

### Resume Analysis
- Upload PDF resumes (searchable PDFs only)
- Paste resume text directly
- AI-powered analysis comparing resume to job description
- Scoring system (0-100) with detailed feedback
- Identifies strengths and gaps

### Authentication
- Email/password authentication via Supabase
- Password reset functionality
- Protected routes with middleware
- User profile management

### Internationalization
- Support for English, Amharic, and Oromo
- Easy language switching
- Localized content throughout the app

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `GOOGLE_API_KEY` | Yes | Google Gemini API key for AI analysis |
| `SERPAPI_API_KEY` | Yes | SerpAPI key for job recommendations |

## Troubleshooting

### "Failed to fetch" error on login
- Ensure your `.env.local` file has correct Supabase credentials
- Restart the dev server after changing environment variables
- Check Supabase project is active and accessible

### PDF text extraction fails
- Only searchable PDFs are supported (not scanned images)
- Try copying and pasting text directly as an alternative
- Consider using DOCX format (coming soon)

### Google Fonts timeout
- This is a network issue and non-critical
- The app will use fallback fonts automatically

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
