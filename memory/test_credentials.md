# Test Credentials — Silent Hiking Indonesia

## Admin (Superadmin) — login at /admin/login
- Username: `admin`
- Email: `programingdistributor@gmail.com`
- Password: `54321Hiking.,`
- Role: `superadmin`

## Auth endpoints
- POST `/api/auth/login`  body: `{ "username": "admin", "password": "54321Hiking.," }`
- GET  `/api/auth/me`      (cookie `access_token` or `Authorization: Bearer <token>`)
- POST `/api/auth/logout`

## Notes
- Database: Supabase PostgreSQL (via Transaction Pooler). Connection in backend/.env `DATABASE_URL`.
- Schema managed by Alembic (`/app/backend/alembic`).
- Login returns a JWT token in response body AND sets httpOnly cookie. Frontend stores token in localStorage and sends `Authorization: Bearer`.
