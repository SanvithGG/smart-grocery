# Smart Grocery Plan

Last updated: 2026-04-02

## Objective

Continue the Smart Grocery app from the current working state and move from a functioning prototype to a cleaner, verified, resumable project.

## Current Baseline

The following appear to be working in the current codebase:

- authentication
- grocery CRUD
- dashboard summary and recommendation features
- frontend login, dashboard, and inventory pages
- category dropdown and catalog suggestion flow
- backend validation and structured API error responses
- backend tests for service and controller coverage
- expiry-date tracking for purchased items
- user-scoped expiry reminders with delete-on-acknowledge backend behavior
- dashboard slider and popup flow for operational sections
- dashboard kitchen reminder popup with manual delete
- top-edge home notifications and bell notification center with deep links

## Next Pending Tasks

### 1. Perform Live End-to-End Check

- run backend locally
- run frontend locally
- verify login/register flow manually in a browser
- verify inventory CRUD flow manually in a browser
- verify dashboard summary, recommendations, low-stock popup, and kitchen reminder popup manually in a browser
- verify category and catalog suggestion APIs from the UI
- verify expiry-date entry and purchased-item reminder generation from the UI
- verify bell notification behavior, deep links, and delete actions from the UI

### 2. Clean Up Configuration

- move sensitive local config out of tracked defaults where appropriate
- confirm `application.properties.template` is usable as the shared example config
- review whether DB credentials and JWT secret should stay in the tracked local file

### 3. Prepare First Commit Baseline

- review generated and local-only files
- ensure `.gitignore` covers build artifacts and environment-specific files
- create a clean initial commit once the current state is verified

### 4. Notification and UX Hardening

- decide whether the toast notifications should remain timed or become fully persistent in the bell only
- confirm whether availability alerts should also open a dedicated dashboard or inventory popup
- review the bell UI for mobile responsiveness and overflow handling with many notifications
- consider centralizing notification fetching/state instead of duplicating it across pages

## Recommended Immediate Next Step

Run the UI manually in a browser before more feature work. The repo now has expiry tracking, dashboard popup navigation, home toasts, and a bell notification center on top of the previously verified flows, so the highest-value next step is validating those interactive paths end to end in the browser.
