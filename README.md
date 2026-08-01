# Enterprise EMR Appointment Management System

## Project Overview

This project is a MERN-based appointment management module for an enterprise EMR workflow. It supports role-based access for super admin, receptionist, and doctor users, and focuses on the operational parts of appointment scheduling:

- authentication with access token and refresh token flow
- department, doctor, patient, and receptionist management
- doctor schedule management with working sessions and breaks
- dynamic slot lookup based on active schedules
- appointment creation, update, cancellation, arrival, and completion
- protected frontend workspaces by role
- search, filtering, and server-side pagination
- realtime appointment updates using Socket.IO
- audit-friendly backend actions

The frontend is built with React, Ant Design, Tailwind CSS, React Router, Axios, and Socket.IO Client. The backend is built with Node.js, Express, MongoDB, Mongoose, JWT, and Socket.IO.

## Folder Structure

```text
enterprise-emr-appointment-system/
|-- client/
|   |-- src/
|   |   |-- assets/            # Static frontend assets
|   |   |-- components/        # Shared UI components such as login page
|   |   |-- constants/         # Auth and app constants
|   |   |-- context/           # Auth context and session state
|   |   |-- layouts/           # Shared shell and role-specific layouts
|   |   |-- pages/             # Super admin, doctor, receptionist pages
|   |   |-- routes/            # Protected, public, and redirect routes
|   |   |-- services/          # Axios clients, auth helpers, realtime client
|   |   |-- utils/             # Shared formatters and helpers
|   |-- vercel.json            # SPA routing config for Vercel deployment
|   |-- package.json
|
|-- server/
|   |-- src/
|   |   |-- config/            # Database connection and config setup
|   |   |-- constants/         # Roles, statuses, audit actions
|   |   |-- controllers/       # Request handlers
|   |   |-- middlewares/       # Auth, authorization, validation, errors
|   |   |-- models/            # Mongoose schemas
|   |   |-- routes/            # REST route modules
|   |   |-- seeds/             # Seed scripts such as super admin creation
|   |   |-- services/          # Core business logic
|   |   |-- sockets/           # Socket.IO setup and realtime event helpers
|   |   |-- utils/             # JWT, hashing, cookies, API errors
|   |   |-- validators/        # Express-validator request schemas
|   |-- package.json
|
|-- render.yaml                # Render blueprint for backend deployment
|-- ENGINEERING_DECISIONS.md   # Engineering rationale
|-- README.md
|-- package.json               # Root convenience scripts
```

## Architecture Overview

### Backend architecture

The backend follows a layered architecture:

- `routes` define the HTTP surface
- `validators` validate request payloads and query params
- `controllers` translate HTTP requests into service calls
- `services` contain business rules such as booking validation, schedule handling, token rotation, and user management
- `models` define MongoDB persistence using Mongoose
- `middlewares` enforce authentication, role authorization, centralized validation, and error handling
- `sockets` manage realtime appointment invalidation events over Socket.IO

This separation keeps transport concerns away from business rules and made later changes easier, including appointment completion, schedule pagination, refresh-token support, and realtime scheduler updates.

### Frontend architecture

The frontend is organized around role-based protected workspaces rather than a single monolithic dashboard:

- shared auth state lives in context
- a shared Axios client handles access token injection and refresh flow
- a shared realtime service manages authenticated Socket.IO subscriptions
- route guards enforce authentication and role access
- a shared console layout provides the responsive shell
- super admin, doctor, and receptionist pages are grouped by role

Ant Design is used for forms, tables, dropdowns, modals, drawers, and pagination. Tailwind CSS is used for layout, responsiveness, spacing, and styling consistency.

### Authentication flow

- login returns a short-lived access token and sets a refresh token cookie
- the access token is stored on the frontend for API authorization
- the refresh token remains in an `httpOnly` cookie
- when an API call returns `401`, the frontend attempts a single `/auth/refresh`
- if refresh succeeds, the original request is retried
- if refresh fails, the session is cleared and the user is redirected to `/login`

### Realtime flow

- appointment create, update, cancel, arrive, and complete actions emit a lightweight realtime event from the backend
- the frontend listens for appointment change events through Socket.IO
- dashboard and scheduler pages react by refetching their normal role-protected REST data
- this keeps realtime updates simple while preserving backend authorization rules

## Database Design

The data model is centered on operational scheduling.

### Core collections

- `User`
  - stores staff identity, email, password hash, role, active state, and login metadata
- `Department`
  - stores department name, code, description, and active status
- `Doctor`
  - links a doctor profile to a `User` and stores department, specialization, registration number, qualification, consultation duration, and active state
- `Patient`
  - stores patient demographic and contact information used during booking and lookup
- `DoctorSchedule`
  - stores recurring availability rules using working days, sessions, breaks, timezone, slot duration, and effective date range
- `Appointment`
  - stores patient, doctor, department, appointment date, start and end time, status, notes, reason, and audit fields such as who created, updated, arrived, completed, or cancelled the record
- `RefreshToken`
  - stores hashed refresh tokens with expiry and revocation details
- `AuditLog`
  - stores important system actions for traceability

### Booking design

Appointments and schedules are intentionally separate.

- schedules define recurring availability
- slots are generated dynamically from schedules
- appointments represent actual booked slots

This avoids pre-creating massive slot tables while still allowing strict booking validation.

### Double booking prevention

Double booking is prevented in two layers:

- application-level validation checks that a requested slot exists in the doctor availability before create or update
- a database-level partial unique index on `{ doctor, appointmentDate, startTime }` guarantees only one active booking can exist for the same doctor and slot

The `Appointment` model uses `isActiveBooking` so only `SCHEDULED` and `ARRIVED` appointments block a slot. `CANCELLED` and `COMPLETED` appointments remain in history without blocking future bookings.

### Important indexes

- `Appointment`
  - unique partial index on `{ doctor, appointmentDate, startTime }` for active bookings
  - compound indexes for doctor/day/status, patient history, department filtering, and status/date queries
- `Doctor`
  - indexes for `{ department, isActive }` and `{ specialization, isActive }`
- `DoctorSchedule`
  - indexes for active schedule lookup by doctor and effective dates
- `RefreshToken`
  - unique index on `tokenHash`
  - TTL index on `expiresAt`
  - compound index on `{ user, revokedAt }`

## API Documentation

Base URL:

```text
http://localhost:5000/api/v1
```

All routes except `/auth/login` and `/auth/refresh` require authentication unless stated otherwise.

### Auth

- `POST /auth/login`
  - authenticate a user and create a token session
- `POST /auth/refresh`
  - rotate refresh token and issue a new access token
- `POST /auth/logout`
  - revoke the current refresh token session
- `GET /auth/me`
  - return the current authenticated user

### Departments

- `GET /departments`
  - list departments with search and pagination
- `GET /departments/:id`
  - get department details
- `POST /departments`
  - create a department
  - allowed role: `SUPER_ADMIN`
- `PUT /departments/:id`
  - update a department
  - allowed role: `SUPER_ADMIN`

### Users / Receptionists

- `GET /users`
  - list users with filtering and pagination
  - allowed role: `SUPER_ADMIN`
- `POST /users/receptionists`
  - create receptionist account
  - allowed role: `SUPER_ADMIN`

### Doctors

- `GET /doctors`
  - list doctors with search and pagination
- `GET /doctors/:id`
  - get doctor details
- `POST /doctors`
  - create doctor account and profile
  - allowed role: `SUPER_ADMIN`
- `PUT /doctors/:id`
  - update doctor profile
  - allowed role: `SUPER_ADMIN`

### Schedules

- `GET /schedules/doctor/:doctorId`
  - list schedules for a doctor with pagination support
- `GET /schedules/:id`
  - get schedule details
- `POST /schedules`
  - create a doctor schedule
  - allowed role: `SUPER_ADMIN`
- `PUT /schedules/:id`
  - update a doctor schedule
  - allowed role: `SUPER_ADMIN`
- `DELETE /schedules/:id`
  - deactivate a doctor schedule
  - allowed role: `SUPER_ADMIN`

### Slots

- `GET /slots`
  - return generated doctor slots for a given doctor and date

### Patients

- `GET /patients`
  - list patients with search and pagination
  - allowed roles: `SUPER_ADMIN`, `RECEPTIONIST`
- `GET /patients/:id`
  - get patient details
  - allowed roles: `SUPER_ADMIN`, `RECEPTIONIST`
- `POST /patients`
  - create a patient
  - allowed roles: `SUPER_ADMIN`, `RECEPTIONIST`
- `PUT /patients/:id`
  - update a patient
  - allowed roles: `SUPER_ADMIN`, `RECEPTIONIST`

### Appointments

- `GET /appointments`
  - list appointments with filters and pagination
- `GET /appointments/:id`
  - get appointment details
- `POST /appointments`
  - create an appointment
  - allowed roles: `SUPER_ADMIN`, `RECEPTIONIST`
- `PUT /appointments/:id`
  - update an appointment
  - allowed roles: `SUPER_ADMIN`, `RECEPTIONIST`
- `DELETE /appointments/:id`
  - cancel an appointment
  - allowed roles: `SUPER_ADMIN`, `RECEPTIONIST`
- `POST /appointments/:id/arrive`
  - mark patient as arrived
  - allowed roles: `SUPER_ADMIN`, `RECEPTIONIST`
- `POST /appointments/:id/complete`
  - mark appointment as completed
  - allowed roles: `SUPER_ADMIN`, `RECEPTIONIST`

### Common query patterns

Many list endpoints support combinations of:

- `page`
- `limit`
- `search`
- role-specific filters such as `status`, `departmentId`, `doctorId`, or `date`

Most list responses include pagination metadata under `meta.pagination`.

## Environment Variables

### Root

The root project does not require its own `.env` file. Environment variables are used by the backend and optionally by the frontend.

### Backend: `server/.env`

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `PORT` | Yes | `5000` | Port used by the Express API server. |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/emr_appointments` | MongoDB connection string used by the backend. |
| `CLIENT_URL` | Yes | `http://localhost:5173` | Allowed frontend origin for CORS and cookie-based auth. |
| `JWT_ACCESS_SECRET` | Yes | `your_access_secret` | Secret used to sign access tokens. |
| `JWT_REFRESH_SECRET` | Yes | `your_refresh_secret` | Secret used to sign refresh tokens. |
| `SUPER_ADMIN_NAME` | Yes | `System Administrator` | Name used by the seed script for the initial super admin. |
| `SUPER_ADMIN_EMAIL` | Yes | `admin@test.com` | Email used by the seed script for the initial super admin. |
| `SUPER_ADMIN_PASSWORD` | Yes | `Password123` | Password used by the seed script for the initial super admin. |
| `NODE_ENV` | No | `development` | Controls development vs production behavior such as cookie security settings. |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token expiry duration. |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token expiry duration. |
| `JWT_ISSUER` | No | `emr-appointment-api` | JWT issuer value used during token generation and verification. |
| `JWT_AUDIENCE` | No | `emr-appointment-client` | JWT audience value used during token generation and verification. |
| `BCRYPT_SALT_ROUNDS` | No | `12` | Password hashing cost factor for seeded and created users. |

### Frontend: `client/.env`

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | No | `http://localhost:5000/api/v1` | Base URL used by the frontend Axios client for API requests. If omitted, the frontend defaults to `http://localhost:5000/api/v1`. |

### Notes

- Use example values only for local development or demo environments.
- Do not commit real secrets, production admin credentials, or private database connection strings.
- In production, set your own secure values in Render and Vercel environment settings.
## Installation Instructions

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB running locally or an accessible MongoDB connection string

### Install dependencies

From the project root:

```bash
npm install
npm install --prefix server
npm install --prefix client
```

## Running the Project

### 1. Configure environment variables

Create the required `.env` files in `server/` and optionally `client/` using the examples above.

### 2. Seed the super admin

Run the seed script after setting the super admin environment variables.

```bash
npm run seed:admin --prefix server
```

Example local seed credentials for development/demo only:

```text
Email: admin@test.com
Password: Password123
```

Use your own values in production. Do not rely on these example credentials outside local or demo environments.

### 3. Start backend and frontend together

From the root:

```bash
npm run dev
```

This starts:

- backend on `http://localhost:5000`
- frontend on `http://localhost:5173`

### 4. Start services separately if needed

Backend only:

```bash
npm run dev --prefix server
```

Frontend only:

```bash
npm run dev --prefix client
```

### 5. Production frontend build

```bash
npm run build --prefix client
```

## Deployment

### Frontend on Vercel

Recommended Vercel project settings for this repo:

- Root Directory: `client`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Required Vercel environment variable:

```env
VITE_API_BASE_URL=https://your-render-backend.onrender.com/api/v1
```

`client/vercel.json` is included to support React Router deep links by rewriting unknown routes to `index.html`.

### Backend on Render

Recommended Render Web Service settings for this repo:

- Root Directory: `server`
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

Required Render environment variables:

```env
NODE_ENV=production
CLIENT_URL=https://your-vercel-frontend.vercel.app
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
SUPER_ADMIN_NAME=System Administrator
SUPER_ADMIN_EMAIL=admin@test.com
SUPER_ADMIN_PASSWORD=Password123
```

Optional backend environment variables:

```env
PORT=5000
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=emr-appointment-api
JWT_AUDIENCE=emr-appointment-client
BCRYPT_SALT_ROUNDS=12
```

A `render.yaml` blueprint is included at the project root to make backend deployment easier.

### Cross-origin auth and realtime notes

This deployment split works with the current code because:

- backend CORS is controlled through `CLIENT_URL`
- refresh token cookies use `secure: true` and `sameSite: none` in production
- the frontend API client already sends credentials
- Socket.IO connects to the backend base domain derived from `VITE_API_BASE_URL`

Important:

- both frontend and backend must use HTTPS in production
- `CLIENT_URL` must exactly match the active Vercel frontend domain
- if you change the Vercel custom domain later, update `CLIENT_URL` on Render too

## Assumptions Made

- the primary operational users are `SUPER_ADMIN`, `RECEPTIONIST`, and `DOCTOR`
- patient self-service is not currently part of the implemented scope
- one doctor has one user account and one doctor profile
- appointments are booked against generated schedule slots rather than arbitrary manual times
- schedules can contain working sessions and break intervals, but the current admin UI supports one main session block per day with multiple breaks
- completed and cancelled appointments should remain in history but should not block future bookings
- frontend access restrictions improve user experience, but backend authorization is the real source of truth
- the project is intended for a single-region deployment in its current form

## Known Limitations

- there is no patient-facing dashboard or self-booking portal in the current implementation
- no payment, invoicing, prescription, EMR charting, or clinical note modules are included
- realtime updates are implemented for appointment-driven scheduler and dashboard flows, but not every entity in the system uses sockets
- the admin schedule form currently supports one primary working session per day in the UI, although the backend schema supports multiple sessions
- some scheduling workflows still assume moderate scale rather than extremely high booking contention
- advanced analytics, reporting, and notification pipelines are not included
- no automated end-to-end test suite is documented in the current repository
- optimistic updates and query caching are limited; most frontend screens rely on direct fetch and refetch patterns

## Future Improvements

- add a patient portal for self-service appointment booking and history
- add automated tests for services, routes, realtime flows, and booking concurrency scenarios
- add Redis-backed caching for slot lookup, sessions, and hot list queries
- expand realtime updates to other operational entities where valuable
- add reminder notifications through email, SMS, or WhatsApp
- improve observability with structured logs, metrics, tracing, and socket delivery monitoring
- support multi-tenant hospital or clinic groups if required
- introduce richer data-fetching abstractions on the frontend when complexity grows
- extend the schedule UI to support multiple sessions per day directly
- add file uploads and broader EMR modules such as prescriptions, visit notes, and billing

## Related Documents

- [`ENGINEERING_DECISIONS.md`](./ENGINEERING_DECISIONS.md) for the reasoning behind architecture, schema, security, indexing, performance, and scaling choices

