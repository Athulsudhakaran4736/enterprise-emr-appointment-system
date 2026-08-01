# Engineering Decisions

## 1. Why I chose this project architecture

I used a layered MERN architecture because the system has two clearly different concerns: a role-driven operational UI and backend business rules that must remain authoritative.

On the backend, the code is split into routes, controllers, services, validators, models, middlewares, and socket helpers. That separation keeps HTTP handling, input validation, business logic, persistence, and realtime delivery independent. It also made later changes easier to add, such as appointment completion, schedule pagination, refresh-token rotation, and Socket.IO-based appointment invalidation, without pushing core rules into controllers.

On the frontend, React is organized around protected role-based workspaces instead of a single large page. Shared pieces such as the auth context, axios client, realtime subscription service, protected routes, and the reusable console layout live in common modules, while super admin, doctor, and receptionist pages are isolated by role. Ant Design was used for complex UI primitives such as tables, forms, dropdowns, modals, drawers, and pagination, while Tailwind CSS was used for layout control, responsiveness, and styling consistency.

This architecture was a pragmatic choice for an assessment-style project because it is easy to reason about, easy to extend by role, and keeps sensitive scheduling and booking rules on the backend where they belong.

## 2. How I designed the MongoDB schema

The schema was designed around the core operational entities:

- `User` stores staff identity, credentials, role, active state, and login metadata.
- `Doctor` stores professional attributes that are separate from generic authentication data, while linking back to `User`.
- `Patient` stores patient-facing information needed for booking and record lookup.
- `Department` provides a stable organizational unit that doctors and appointments can reference.
- `DoctorSchedule` stores recurring availability, including working days, sessions, breaks, slot duration, timezone, and effective date range.
- `Appointment` stores the actual booked slot with patient, doctor, department, date, start time, end time, status, audit fields, and operational notes.
- `RefreshToken` stores hashed refresh tokens with expiry, revocation, rotation history, IP address, and user agent.
- `AuditLog` records critical actions for traceability.

A few schema decisions were intentional:

- I kept doctor profile data separate from the `User` collection because authentication data and medical profile data evolve for different reasons.
- I modeled schedules as recurring templates (`workingDays`, `sessions`, `breaks`) instead of pre-creating every future slot in the database. That keeps writes lower and allows slots to be generated dynamically from schedule rules.
- I stored appointment status transitions directly on the appointment (`arrivedAt`, `arrivedBy`, `completedAt`, `completedBy`, `cancelledAt`, `cancelledBy`) so the current operational state is easy to query without reconstructing it from event history.
- I introduced `isActiveBooking` on appointments because booking conflict logic is not the same as business status. `SCHEDULED` and `ARRIVED` should block the slot, while `CANCELLED` and `COMPLETED` should not.
- I used string dates in `YYYY-MM-DD` and string times in `HH:mm` for schedule and appointment matching because the domain is clinic slot management, not arbitrary cross-timezone timestamp arithmetic. The schedule still stores an explicit timezone to keep date validation and slot generation explicit.

## 3. How I prevented double booking

Double booking is prevented with both application-level validation and a database-level guarantee.

At the application layer, appointment creation and update validate the requested doctor, date, and start time against the doctor schedule and generated slot availability. This gives a meaningful user-facing error before attempting to persist the record.

At the database layer, the real protection is a partial unique index on the `Appointment` collection:

- `{ doctor, appointmentDate, startTime }`
- unique only when `isActiveBooking: true`

That means two active bookings cannot exist for the same doctor, date, and start time even if concurrent requests arrive together. The service layer also catches duplicate key errors from MongoDB and converts them into a proper API error.

The key detail is that completed or cancelled appointments clear `isActiveBooking`, so historical records remain in the database without permanently blocking the slot.

## 4. Which database indexes I created and why

The main indexes were created around booking integrity and the real list/query patterns used by the application.

### Appointment indexes

- Unique partial index on `{ doctor, appointmentDate, startTime }` with `isActiveBooking: true`
  - Prevents double booking for active appointments.
- Compound index on `{ doctor, appointmentDate, status, startTime }`
  - Speeds doctor/day/status views and scheduler queries.
- Compound index on `{ patient, appointmentDate: -1 }`
  - Speeds patient appointment history and recent visits.
- Compound index on `{ department, appointmentDate }`
  - Helps department-level operational lists.
- Compound index on `{ status, appointmentDate }`
  - Helps status-driven dashboards and queue-style filters.

### Doctor indexes

- Compound index on `{ department, isActive }`
  - Supports department filtering with active doctor lists.
- Compound index on `{ specialization, isActive }`
  - Supports specialization lookup for scheduling and search.
- Unique fields on `user` and `registrationNumber`
  - Enforce one doctor profile per user and one unique registration number per doctor.

### DoctorSchedule indexes

- Compound index on `{ doctor, isActive, effectiveFrom, effectiveTo }`
  - Supports finding the currently valid schedule for a doctor over a date range.
- Compound index on `{ doctor, createdAt: -1 }`
  - Helps recent schedule lookup and admin review.

### RefreshToken indexes

- Unique index on `tokenHash`
  - Prevents duplicated token records and makes rotation lookups precise.
- TTL index on `expiresAt`
  - Automatically removes expired refresh tokens without a manual cleanup job.
- Compound index on `{ user, revokedAt }`
  - Helps active-token lookups per user during session management.

Indexes were added for actual access paths used by authentication, scheduling, filtering, pagination, and history views rather than indexing every possible field.

## 5. What security measures I implemented

Security was handled in both backend and frontend layers.

### Backend security

- JWT-based access tokens are used for API authorization.
- Refresh tokens are stored in an `httpOnly` cookie so frontend JavaScript cannot read them directly.
- Refresh tokens are hashed before being stored in MongoDB, which reduces exposure if the token table is leaked.
- Refresh token rotation is implemented. On refresh, the old token is revoked and replaced with a new one.
- Role-based access control is enforced on protected routes so only allowed roles can create doctors, manage schedules, update appointment status, and access admin-only resources.
- Input validation is applied before business logic for auth, department, schedule, slot, patient, and appointment APIs.
- Passwords are stored as hashes, not plaintext.
- Audit logging records sensitive actions such as login success/failure, token refresh, appointment status changes, and administrative updates.
- User active-state checks prevent inactive accounts from logging in or continuing to act as valid users.
- Socket.IO connections are authenticated using the same access token model as the REST API.

### Frontend security

- Protected routes prevent unauthenticated access to role-specific workspaces.
- Unauthorized role access is redirected away from protected pages.
- The shared axios client attaches the access token automatically and retries once through `/auth/refresh` when the access token expires.
- If refresh fails, the frontend clears local session state and redirects to `/login`.
- Realtime updates do not expose raw cross-role data. The socket channel emits a lightweight appointment-change event, and each client refetches through the normal role-protected API.

One deliberate decision was to keep booking and authorization rules on the backend even though the frontend also hides disallowed actions. The frontend improves UX, but the backend remains the source of truth.

## 6. What performance optimizations I applied

The main optimizations were focused on keeping reads efficient, avoiding unnecessary writes, and limiting redundant network traffic.

- I used dynamic slot generation from doctor schedules instead of materializing all future appointment slots in the database.
- I added targeted compound indexes for the booking, filtering, and history queries used by the application.
- I implemented server-side pagination across the major list endpoints so the frontend does not fetch entire datasets for doctors, departments, schedules, patients, receptionists, and appointments.
- The frontend consumes backend pagination metadata and requests only the current page, with a consistent default page size.
- Refresh token handling in the frontend uses a shared `refreshPromise`, which deduplicates concurrent refresh attempts and avoids a storm of `/auth/refresh` requests when multiple API calls fail with `401` together.
- Realtime appointment updates use an invalidation-style event instead of broadcasting large payloads. That keeps socket messages small and lets the REST API remain the source of truth.
- Reusable layouts, shared formatting helpers, and role-based page composition reduced duplicate frontend logic and kept the UI cheaper to maintain.
- The backend keeps schedule rules normalized enough that updates are small and localized instead of rewriting large appointment calendars.

For the current scale, these optimizations are enough to keep the system simple while still being efficient.

## 7. What I would change to support millions of appointments

If the system had to support millions of appointments, I would move from a simple monolithic deployment toward a more explicitly scalable architecture.

### Data and storage

- Partition appointment data by time range and possibly by organization or department to keep hot queries small.
- Consider sharding the `Appointment` collection on a carefully selected key, likely involving organization and date locality rather than doctor alone.
- Move historical appointments and audit logs to archival storage or separate collections optimized for analytics.
- Add read replicas for reporting-heavy workloads.

### Scheduling and booking flow

- Introduce a dedicated availability service or booking service so slot computation and booking contention are isolated from general CRUD traffic.
- For extremely high booking contention, add short-lived distributed locks or a queue around slot reservation, while still preserving the database uniqueness constraint as the final safeguard.
- Precompute near-term availability caches for high-demand doctors instead of generating every slot on demand.

### Application architecture

- Split the backend into domain-oriented services such as auth, scheduling, appointments, notifications, and reporting when operational complexity justifies it.
- Introduce an event-driven flow for audit logging, notifications, analytics, and dashboard projections so the booking transaction path stays small.
- Add a background job system for reminders, cleanup, denormalized projections, and reporting pipelines.

### Performance and resilience

- Use Redis for short-lived caching of doctor availability, session lookups, and frequently accessed reference data.
- Add observability around booking latency, index usage, socket delivery failures, slow queries, and refresh-token failures.
- Put a CDN and API gateway in front of static assets and public traffic.
- Expand automated testing around concurrency, especially for appointment creation and update conflicts.

### Frontend scaling

- Keep role workspaces modular so each role area can evolve independently.
- Add a caching query layer only when the app complexity grows enough to justify it.
- Prefer incremental loading, optimistic updates where safe, and background revalidation for high-volume operational screens.
- Move dashboard counts to dedicated summary endpoints if list-based fetching becomes too expensive.

## 8. Summary of implemented frontend and backend direction

The overall engineering direction was to keep the system operationally safe before making it feature-heavy:

- backend-enforced booking integrity
- role-based access control
- rotating refresh-token sessions
- auditability of sensitive actions
- server-driven pagination for list views
- realtime appointment invalidation over Socket.IO
- modular role-based frontend workspaces for super admin, doctor, and receptionist
- schedule management that includes working sessions and breaks

That tradeoff kept the codebase understandable while still covering the important real-world concerns of scheduling systems: authorization, conflict prevention, traceability, maintainability, and live operational awareness.
