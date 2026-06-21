# Foodie Inc App

Full-stack food delivery app with a Spring Boot API and an Angular SSR frontend.

## Project layout
- `backend-api/` Spring Boot REST API
- `frontend-ui/foodie-app/` Angular 20 app (SSR enabled)

## Local development

Backend:
1. `cd backend-api`
2. `./mvnw spring-boot:run`

Frontend:
1. `cd frontend-ui/foodie-app`
2. `npm install`
3. `npm run start`

The default API base URL for development is `http://localhost:8080/api`.

## Production deployment

Backend (recommended env vars):
- `SPRING_PROFILES_ACTIVE=prod`
- `DB_URL=jdbc:mysql://<host>:3306/foodiedb?useSSL=true&serverTimezone=UTC`
- `DB_USERNAME=...`
- `DB_PASSWORD=...`
- `JWT_SECRET=...` (minimum 32 bytes recommended)
- `CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com`

Frontend:
- Build with `npm run build`
- Run SSR output with `node dist/foodie-app/server/server.mjs`
- The production API base URL is `/api` by default, so deploy behind a reverse proxy that routes `/api` to the backend service.

## Notes
- `frontend-ui/` also contains a legacy `package.json`. The active app is in `frontend-ui/foodie-app/`.
- After updating dependencies, run `npm install` in `frontend-ui/foodie-app` to refresh `package-lock.json`.
