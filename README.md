# Smart Grocery

Smart Grocery is a full-stack grocery planning app with JWT auth, user-scoped inventory management, dashboard insights, low-stock alerts, restock recommendations, and home kitchen expiry reminders for purchased items that are close to expiring or expire today.

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS, Axios, React Router
- Backend: Spring Boot 4, Spring Security, Spring Validation, JPA, MySQL, JWT
- Tooling: ESLint, Maven Wrapper

## Completed Scope

### Sprint 1: Authentication

- user registration
- user login
- JWT token issuance
- protected frontend routing

### Sprint 2: Grocery CRUD

- add grocery items
- list grocery items for the current user
- update purchased status
- delete grocery items
- search, category, and purchased-state filtering

### Sprint 3: Smart Dashboard

- summary cards for total, pending, purchased, and low-stock items
- low-stock watchlist
- recommendation queue

### Sprint 4: Frontend Inventory and Dashboard

- polished auth, dashboard, and inventory screens
- category dropdown populated from backend data
- catalog suggestion cards with click-to-autofill
- protected app shell flow after login

### Sprint 5: Validation and Verification

- consistent backend JSON error responses
- frontend API error extraction for validation and auth failures
- backend service and controller tests
- passing frontend lint and production build

### Sprint 6: Expiry Tracking

- purchased items can store an expiry date
- authenticated users receive user-scoped expiry alerts for items expiring soon or today
- acknowledging an expiry alert deletes that purchased item from the database
- inventory UI supports setting expiry dates before marking an item as purchased

## Repository Layout

```text
Smart_Grocery/
  backend/    Spring Boot API
  frontend/   React app
  STATUS.md   current repo handoff/status
  PLAN.md     next pending work
```

## Prerequisites

- Java 21
- Node.js 20+ and npm
- MySQL 8+

## Backend Setup

1. Create or confirm a MySQL instance is running locally.
2. Copy the example config from `backend/src/main/resources/application.properties.template`.
3. Update the copied file values for your local database credentials and JWT secret.
4. Start the backend from the `backend` directory.

Example backend config fields:

- `spring.datasource.url=jdbc:mysql://localhost:3306/Smart_GG?createDatabaseIfNotExist=true`
- `spring.datasource.username=YOUR_DB_USERNAME`
- `spring.datasource.password=YOUR_DB_PASSWORD`
- `app.jwt.secret=REPLACE_WITH_A_LONG_RANDOM_SECRET`
- `app.cors.allowed-origins=http://localhost:5173`

Run commands:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Backend base URL:

`http://localhost:8080`

## Frontend Setup

1. Install dependencies from the `frontend` directory.
2. Start the Vite dev server.
3. Open the local app in a browser after the backend is running.

Run commands:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL:

`http://localhost:5173`

## Local Run Flow

1. Start MySQL.
2. Start the backend on port `8080`.
3. Start the frontend on port `5173`.
4. Register a user from the frontend.
5. Login and verify the dashboard and inventory flows.

## Verification Status

The latest recorded verification in this repo is:

- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `backend`: `.\mvnw.cmd test` with 32 passing tests

## Known Limitations

- The live browser-level end-to-end pass is still a pending verification step.
- The frontend API base URL is currently hardcoded to `http://localhost:8080`.
- Local backend credentials should be kept in an untracked local config rather than shared defaults.

