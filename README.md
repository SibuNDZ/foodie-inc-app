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

Stripe and web push are optional locally. `stripe.*` and `vapid.*` default to blank,
so the app boots without them; web push simply stays disabled. Set `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET` and the `VAPID_*` variables to exercise those paths.

## Public routes

| Route | Purpose |
| --- | --- |
| `/`, `/restaurants` | Restaurant listing. Accepts `?query=` to filter. |
| `/restaurant/:id` | Restaurant detail and menu |
| `/corporate-orders` | Corporate ordering pitch and enquiry form |
| `/become-a-driver` | Courier pitch |
| `/partner-with-us` | Restaurant onboarding pitch |
| `/about-us` | About the company |
| `/careers` | Open roles and speculative applications |

## Restaurant search API

`GET /api/restaurants` takes three optional parameters and stays backward compatible
without them:

- `query` — name or cuisine substring
- `lat`, `lng` — caller coordinates; both are required for either to take effect

With valid coordinates each restaurant gains a `distanceKm` and the list is sorted
nearest-first, with restaurants that have no coordinates last. Coordinates outside the
WGS-84 range are ignored rather than rejected, so a bad geolocation reading degrades to
the default listing.

Restaurant coordinates are set by owners on `/owner/dashboard`. There is no geocoder,
so latitude and longitude are entered directly.

## Home page dish carousel

`GET /api/dishes/showcase?limit=8` (public) returns real dish photos for the carousel:
available dishes that carry a non-blank `imageUrl`, from active restaurants, newest
first. `limit` is clamped to 1..12.

The carousel degrades in three steps, so it never renders empty or broken:

1. Static category tiles in `public/categories/` are what gets server-rendered.
2. After hydration it fetches the showcase and swaps in real photos.
3. Any dish whose image fails to load is dropped; if none survive, the tiles return.

Real photos therefore only appear once restaurant owners upload dish images through
`/owner/dashboard`. Until then the tiles are what visitors see.

## Placeholders to replace before launch

- `APP_STORE_LINKS` in `components/customer/app-download/app-download.ts` points at the
  store home pages; there is no published native app yet. The badges also use icon-and-text
  buttons rather than Apple's and Google's official badge artwork.
- `SOCIAL_LINKS` in `components/layout/footer/footer.ts` points at each platform's home
  page rather than a Foodie Inc account.
- `CORPORATE_ENQUIRY_ADDRESS` and `CAREERS_ENQUIRY_ADDRESS` compose `mailto:` drafts;
  there is no enquiries endpoint on the API.

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
