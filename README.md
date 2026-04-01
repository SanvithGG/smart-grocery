# Smart Grocery

Full-stack smart grocery management app with JWT auth, inventory tracking, dashboard insights, low-stock alerts, and recommendations.

## Stack

- Frontend: React, Vite, Tailwind CSS, Axios, React Router
- Backend: Spring Boot, Spring Security, JPA, MySQL, JWT

## Current Scope

### Sprint 1

- user registration
- user login
- JWT authentication
- protected frontend routes

### Sprint 2

- grocery item CRUD
- user-scoped grocery data
- inventory management UI

### Sprint 3

- dashboard summary
- low-stock alerts
- recommendation queue

### Sprint 4

- login page UI
- dashboard UI
- inventory page UI
- search/category/status filters
- category dropdown from backend
- catalog suggestions with autofill

## Project Structure

```text
Smart_Grocery/
  backend/
  frontend/
  STATUS.md
  PLAN.md
```

## Backend Setup

1. Open a terminal in `backend`
2. Configure database and app properties
3. Run the Spring Boot app

Example config file:

`backend/src/main/resources/application.properties`

Template:

`backend/src/main/resources/application.properties.template`

Run command:

```powershell
./mvnw spring-boot:run
```

Default backend URL:

`http://localhost:8080`

## Frontend Setup

1. Open a terminal in `frontend`
2. Install dependencies
3. Start the Vite dev server

Run commands:

```powershell
npm install
npm run dev
```

Default frontend URL:

`http://localhost:5173`

## Notes

- The frontend expects the backend to be running locally.
- The backend currently uses MySQL.
- `STATUS.md` records the recovered current project state.
- `PLAN.md` records the next likely tasks.

## Resume Prompt

Use this in a future chat from `S:\Smart_Grocery`:

```text
Continue Smart Grocery from the current repo state. Sprint 1 auth is done, Sprint 2 grocery CRUD is done, Sprint 3 low-stock/recommendations/summary is done, and Sprint 4 frontend with login, dashboard, inventory, category dropdown, and catalog suggestions is working. Continue from the next pending task.
```
