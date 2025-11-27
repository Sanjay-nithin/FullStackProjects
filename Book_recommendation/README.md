# Book Wise - Book Recommendation System

A modern full-stack book recommendation application built with Django REST Framework and React, featuring advanced search, personalized recommendations, and an intuitive user interface.

## Features

### Authentication & Authorization
- User registration and login with JWT authentication
- Role-based access (User/Admin dashboards)
- Secure API endpoints with token-based authentication

### Core Functionality
- **Personalized Book Recommendations**: Content-based suggestions using favorite genres, saved-book authors/genres, ratings, liked percentage, and preferred language
- **Live Search**: Real-time book search by title or author with debounced input
- **Book Exploration**: Infinite scroll pagination through book catalog
- **Book Details**: Comprehensive book information with rich details
- **User Preferences**: Genre selection and customization options
- **Saved Books**: Bookmark favorite books for later

### Modern UI/UX
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark/Light Theme Support**: Built with TailwindCSS
- **Animated Components**: Smooth transitions and loading states
- **Intuitive Navigation**: Breadcrumb navigation and clear page hierarchy

### Technical Features
- **RESTful API**: Well-documented endpoints with proper error handling
- **Pagination**: Efficient data loading with offset/limit pagination
- **Debounced Search**: Optimized search experience with debouncing
- **State Management**: React hooks for efficient state handling

## Architecture

### Backend (Django + DRF)
```
backend/
├── books/
│   ├── models.py          # Book, User, Genre models
│   ├── views.py           # API endpoints and business logic
│   ├── serializers.py     # Data serialization
│   ├── urls.py           # URL routing
│   └── migrations/       # Database migrations
├── backend/
│   ├── settings.py       # Django configuration
│   └── urls.py          # Main URL routing
└── requirements.txt      # Python dependencies
```

### Frontend (React + TypeScript)
```
book-oracle-70/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── auth/        # Authentication forms
│   │   └── layout/      # Layout components
│   ├── pages/           # Page components
│   │   ├── BookDetail.tsx      # Individual book view
│   │   ├── ExploreBooks.tsx    # Book exploration
│   │   ├── SearchPage.tsx      # Search interface
│   │   ├── UserDashboard.tsx   # User dashboard
│   │   └── AdminDashboard.tsx  # Admin dashboard
│   ├── services/        # API service layer
│   ├── types/          # TypeScript type definitions
│   └── App.tsx         # Main app component
├── package.json        # Node dependencies
└── tailwind.config.ts  # Tailwind configuration
```

## Prerequisites

- **Python**: 3.8 or higher
- **Node.js**: 16.0 or higher
- **npm** or **bun**: For package management
- **PostgreSQL (Supabase)**: Supabase-hosted PostgreSQL is the required production database

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Sanjay-nithin/Book_recommendation.git
cd Book_recommendation
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure Database (Supabase PostgreSQL)
This project is configured to require a valid PostgreSQL connection string via `DATABASE_URL` and Supabase REST credentials. Set the following environment variables (see the `.env` example below) and ensure `backend/backend/settings.py` reads them.

- `DATABASE_URL` must be a Postgres URI from your Supabase project (format: `postgres://<user>:<password>@<host>:<port>/<db>`). Do not use the Supabase REST URL.
- `SUPABASE_URL` and `SUPABASE_KEY` are your Supabase REST API credentials (from the Supabase project settings).
- The backend will fail fast if these are missing or invalid.

#### Start Django Server
```bash
python manage.py runserver 8000
```
**Server will be available at:** `http://127.0.0.1:8000`

### 3. Frontend Setup

#### Install Node Dependencies
```bash
cd book-oracle-70
npm install
```

#### Start Development Server
```bash
npm run dev
```
**Frontend will be available at:** `http://localhost:8081`

## Running the Application

### Separate Terminal Windows:

#### Terminal 1 - Backend (Django)
```bash
cd backend
python manage.py runserver 8000
```

#### Terminal 2 - Frontend (React)
```bash
cd book-oracle-70
npm run dev
```

## Deployment

The application is deployed with the frontend on Vercel and backend on Render.

### Live Application
Frontend: [https://book-recommendation-pink.vercel.app/](https://book-recommendation-pink.vercel.app/)


### Deployment Notes
- The backend requires Supabase PostgreSQL for production. For local development, you may use SQLite temporarily, but production deployment should use Postgres.
- Ensure CORS settings allow requests from your frontend domain
- Set up proper environment variables for security
- Monitor logs through Vercel/Render dashboards for debugging

## Creating Admin User
### In Backend Terminal (Book_Recommendation\backend)
```bash
python manage.py createsuperuser
```
Then fill the details that you are prompted for and sign in using the email and password you have given to create a superuser and

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | User login |
| POST | `/api/auth/register/` | User registration |
| GET | `/api/books/recommended/` | Personalized recommendations |
| GET | `/api/books/search/?q=<query>` | Search books |
| GET | `/api/books/explore/?offset=0&limit=10` | Explore books with pagination |
| GET | `/api/books/<book_id>/` | Get individual book details |
| POST | `/api/books/<book_id>/toggle-save/` | Save/unsave a book |
| GET | `/api/users/me/` | Get current user details |
| GET | `/api/users/saved-books/` | Get user's saved books |
| PUT | `/api/users/preferences/` | Update user genre preferences |

## Recommendation method

The system uses a lightweight content-based scoring model implemented in `backend/books/views.py` under the `recommended_books` endpoint.

Signals and weights:
- Favorite-genre similarity (Jaccard): 0.40
- Saved-books genre similarity (Jaccard): 0.20
- Author match with any saved book: 0.15
- Rating normalized (0–5 → 0–1): 0.15
- Liked percentage normalized (0–100 → 0–1): 0.05
- Language match with the user’s preferred language: 0.05

Additional details:
- Already saved books are excluded from recommendations.
- Cold start (no favorites/saved books): falls back to top-rated books.
- Data assumptions: `Book.genres` is a list of strings, `rating` in [0, 5], `liked_percentage` in [0, 100].
- The weights are easy to tune inside `recommended_books()` if you want to prioritize different signals.

## Key Components

### Frontend Pages
- **HomePage**: Landing page with authentication links
- **UserDashboard**: Main user interface with recommendations and saved books
- **SearchPage**: Live search with debounced input
- **ExploreBooks**: Infinite scroll book discovery
- **BookDetail**: Individual book information page

### Backend Models
- **User**: Custom user model with genre preferences
- **Book**: Comprehensive book model with metadata
- **Genre**: Book categorization system


## Database Schema

### Book Model
- title, author, isbn, description
- cover_image, publish_date, rating
- genres (JSONField), page_count, publisher
- language, created_at, updated_at

### User Model
- Personal info (name, email, username)
- favorite_genres (ManyToMany to Genre)
- saved_books (ManyToMany to Book)
- preferences (language, notifications)

### Genre Model
- name (unique)
- users (ManyToMany relationship)

## Styling & Components

- **UI Library**: shadcn/ui with Radix UI primitives
- **Styling**: TailwindCSS with custom animations
- **Icons**: Lucide React icons
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router with protected routes

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Authors

- **Sanjay Nithin** - *Developer & Creator*

## Acknowledgments

- Open Library API and GoodReads for book data inspiration
- Shadcn/ui for the excellent component library
- Django REST Framework community
- All contributors to the open-source ecosystem

---

If you found this project helpful, please consider starring the repository.

---

## Environment Variables (.env example)

Create a `.env` file in `backend/` with the following keys. Values shown are examples—replace with your own:

```
# Core Django
SECRET_KEY=replace-with-a-strong-secret
DEBUG=False

# Hosts and CORS
ALLOWED_HOSTS=yourdomain.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://your-frontend.example.com,http://localhost:8081
CSRF_TRUSTED_ORIGINS=https://your-frontend.example.com

# Supabase REST (not the Postgres URI)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-service-or-anon-key

# Database (Postgres URI from Supabase → Settings → Database)
DATABASE_URL=postgres://user:password@db.your-project-id.supabase.co:5432/postgres

# Optional email settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
```

Notes:
- `DATABASE_URL` must begin with `postgres://` or `postgresql://`.
- Do not set `DATABASE_URL` to the Supabase REST URL (which begins with `https://`).
- Ensure your frontend base URL is listed in `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`.
