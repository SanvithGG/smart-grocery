# Smart Grocery

Smart Grocery is a portfolio-ready full-stack grocery planning app built with React, Spring Boot, MySQL, JWT authentication, admin workflows, inventory tracking, low-stock alerts, restock recommendations, and expiry reminders.

The project demonstrates an end-to-end product flow: users can manage grocery inventory and purchase queues, while admins can manage products, categories, users, and reports from a separate workspace.

## Portfolio Focus

- Full-stack architecture with a React frontend and Spring Boot REST API
- JWT-based authentication with protected frontend routing
- Role-based user and admin experiences
- User-scoped inventory, buy queue, dashboard, and expiry reminder flows
- AI-assisted catalog suggestion support through Gemini-backed enrichment
- Validation, error handling, service/controller coverage, and recorded verification

## Core Features

- Register, login, and access protected app screens
- Add, search, filter, update, and delete grocery items
- Track purchased and pending items
- Set expiry dates before marking items as purchased
- View dashboard cards for total, pending, purchased, and low-stock items
- Review recommendation queues and low-stock watchlists
- Receive expiry alerts for items expiring soon or today
- Acknowledge expiry alerts and remove completed purchased items
- Use admin screens for users, products, categories, purchase queues, and reports

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Axios, React Router
- Backend: Spring Boot 3, Spring Security, Spring Validation, Spring Data JPA
- Database: MySQL
- Auth: JWT and Google login support
- Tooling: Maven Wrapper, ESLint, npm

## Repository Layout

```text
Smart_Grocery/
  backend/    Spring Boot API
  frontend/   React app
  docs/       report assets, screenshots, and diagrams
  tools/      helper scripts
```

## Prerequisites

- Java 21
- Node.js 20+ and npm
- MySQL 8+

## Backend Setup

1. Start or confirm a local MySQL instance.
2. Copy the example config from `backend/src/main/resources/application.properties.template`.
3. Update the copied file with local database credentials and a JWT secret.
4. Start the backend from the `backend` directory.

Example backend config fields:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/Smart_GG?createDatabaseIfNotExist=true
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD
app.jwt.secret=REPLACE_WITH_A_LONG_RANDOM_SECRET
app.cors.allowed-origins=http://localhost:5173
```

Run the backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Backend base URL:

```text
http://localhost:8080
```

## Frontend Setup

Install dependencies and start the Vite dev server from the `frontend` directory:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Local Run Flow

1. Start MySQL.
2. Start the backend on port `8080`.
3. Start the frontend on port `5173`.
4. Register a user from the frontend.
5. Log in and verify the dashboard, inventory, quick-buy, and admin flows.

## Screenshots

User screens:

- Login: `docs/report_assets/ui_auth_login.png`
- Register: `docs/report_assets/ui_auth_register.png`
- Home catalog: `docs/report_assets/ui_home_catalog.png`
- Inventory: `docs/report_assets/ui_inventory.png`
- Quick buy: `docs/report_assets/ui_quick_buy.png`
- Shopping list: `docs/report_assets/ui_shopping_list.png`
- Dashboard overview: `docs/report_assets/ui_dashboard_overview.png`
- Dashboard recommendations: `docs/report_assets/ui_dashboard_recommendations.png`
- Dashboard expiry reminders: `docs/report_assets/ui_dashboard_expiry.png`

Admin screens:

- Admin dashboard: `docs/report_assets/ui_admin_dashboard.png`
- Admin users: `docs/report_assets/ui_admin_users.png`
- Admin products: `docs/report_assets/ui_admin_products.png`
- Admin categories: `docs/report_assets/ui_admin_categories.png`
- Admin purchase queue: `docs/report_assets/ui_admin_purchase_queue.png`
- Admin reports: `docs/report_assets/ui_admin_reports.png`

Architecture:

- Architecture diagram: `docs/report_assets/architecture_diagram.png`
- ER diagram: `docs/report_assets/er_diagram.png`
- Module interaction: `docs/report_assets/module_interaction.png`

## Verification Status

Latest recorded verification:

- `frontend`: `npm run lint`
- `frontend`: `npm run build` may fail in some Windows environments because Vite/Tailwind can hit native binding or `spawn EPERM` issues
- `backend`: `.\mvnw.cmd test` with 50 passing tests
- `backend`: `.\mvnw.cmd spring-boot:run` with manual API testing in Postman
