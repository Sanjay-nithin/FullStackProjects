from pathlib import Path
import os
from urllib.parse import urlparse
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env at project root (BASE_DIR)
load_dotenv(BASE_DIR / '.env')


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', '+*))3*=h(w+2n%=l1h+i#cb+slo6izrxfbw&opyz%g*lycli0k')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DJANGO_DEBUG', 'False').lower() in ('1', 'true', 'yes')

ALLOWED_HOSTS = os.getenv('DJANGO_ALLOWED_HOSTS', '*').split(',')

# Supabase configuration (REST/Storage)
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ImproperlyConfigured('SUPABASE_URL and SUPABASE_KEY are required for this project.')
# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'books',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders'
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware", 
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/3.1/ref/settings/#databases

# DATABASES: Single-variable config with DATABASE_URL (Supabase-friendly). In DEBUG, fallback to sqlite.
DATABASE_URL = (os.getenv('SUPABASE_URL') or '').strip()
if not DATABASE_URL:
    raise ImproperlyConfigured('DATABASE_URL is required and must be a Postgres URI from Supabase.')

scheme = DATABASE_URL.split(':', 1)[0]
if scheme not in {"postgres", "postgresql", "postgresql+psycopg2"}:
    raise ImproperlyConfigured('DATABASE_URL must start with postgresql:// (not your REST https URL).')

parsed = urlparse(DATABASE_URL)
DB_NAME = parsed.path[1:] if parsed.path.startswith('/') else parsed.path
if not DB_NAME:
    raise ImproperlyConfigured('DATABASE_URL is missing the database name (path segment).')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': DB_NAME,
        'USER': parsed.username or '',
        'PASSWORD': parsed.password or '',
        'HOST': parsed.hostname or 'localhost',
        'PORT': str(parsed.port or '5432'),
        'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', '60')),
        'OPTIONS': {'sslmode': 'require'},
    }
}

# Password validation
# https://docs.djangoproject.com/en/3.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/3.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.1/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    )
}

AUTH_USER_MODEL = "books.User"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


CORS_ALLOWED_ORIGINS = [o.strip() for o in os.getenv('CORS_ALLOWED_ORIGINS', '').split(',') if o.strip()]
CORS_ALLOW_CREDENTIALS = True  # Allow cookies/auth headers when needed

# Explicitly list common headers instead of wildcard to satisfy some strict browsers/proxies
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-language',
    'content-language',
    'content-type',
    'authorization',
    'origin',
    'user-agent',
    'cache-control',
    'x-requested-with',
    'x-csrftoken'
]

# Methods (default is sufficient, but we make it explicit for clarity)
CORS_ALLOW_METHODS = [
    'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'
]

# Expose Authorization so frontend can read it if ever returned
CORS_EXPOSE_HEADERS = ['Authorization', 'Content-Type']

# Email settings for password reset
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = os.getenv('EMAIL_PORT', 465)
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', True)
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', False)
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')  
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
EMAIL_TIMEOUT = os.getenv('EMAIL_TIMEOUT', 20)

CSRF_TRUSTED_ORIGINS = os.getenv('CSRF_TRUSTED_ORIGINS')
if CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in CSRF_TRUSTED_ORIGINS.split(',') if o.strip()]
