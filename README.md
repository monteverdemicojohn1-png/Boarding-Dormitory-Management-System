# Boarding-Dormitory-Management-System

A web-based system for managing boarding houses and dormitories: tenant records, room
occupancy, and monthly rental payment tracking (including GCash payment recording) —
replacing handwritten logbooks and notebooks.

**Course:** Bachelor of Science in Information Technology
**Adviser:** Sir John Fredrick Lim

## Group Members

- Tejano, Ma. Genelle A. 
- Torejas, Dclyn C.
- Cacayan, Andrew S.
- Tanggap, Jhon Lester R.
- Monteverde, Mico John L.
- Pajelmariano, Mary Rose S.

## About the Project

Many boarding houses and dormitories in our community still keep records in logbooks —
room availability, payments, tenant information, and visitor logs are all handwritten.
Checking who has paid rent or which rooms are vacant takes time and is prone to errors.

This system automates record-keeping, room monitoring, and payment tracking in one
online platform that runs in the browser, so dorm owners/managers and boarders do not
need to install anything.

### Main Features

- **Tenant Management** — add, edit, and view tenant information, guardians, and
  move-in / move-out dates. Moving a tenant out automatically frees their room.
- **Room Management** — track room status (vacant, occupied, under maintenance),
  capacity, and monthly rent. Occupied status is set automatically when tenants are
  assigned; vacant rooms are visible instantly.
- **Payment Monitoring** — record monthly rental payments, view running balances per
  tenant, and see full payment history. Payments can be recorded as **Cash** or
  **GCash** (the GCash reference number is required and stored with the record, so the
  manager can verify the transfer).
- **Reports** — simple summaries of monthly collections, room occupancy, and
  outstanding balances.
- **Admin Login** — a single administrator account protects the records.

> Note on GCash: this system *records* GCash payments together with their reference
> numbers for verification and tracking. It does not process live online payments
> through the GCash API (see Scope and Limitations).

## Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | React (Vite)            |
| Backend  | Node.js + Express       |
| Database | MySQL                   |

## Requirements

- Node.js 18 or newer, with npm
- MySQL 8 or MariaDB

## Setup

1. **Create the database** (once). Replace `boarding_dorm` if you use another name:

   ```
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS boarding_dorm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

2. **Configure the server**:

   ```
   cd server
   copy .env.example .env      (Windows)
   cp .env.example .env        (Mac/Linux)
   ```

   Then edit `server/.env` — set your MySQL password and the initial admin account
   (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).

3. **Start the API** (it creates the tables automatically on first run):

   ```
   cd server
   npm install
   npm run dev
   ```

   The API runs at `http://localhost:5000`.

4. **Start the frontend** (in a second terminal):

   ```
   cd client
   npm install
   npm run dev
   ```

   Open the address Vite prints, usually `http://localhost:5173`, and log in with the
   admin account from `server/.env`.

5. **(Optional) Demo data** — with the API running and the rooms table empty:

   ```
   cd server
   npm run seed
   ```

   This inserts 6 sample rooms, 4 tenants, and some sample payments.

## Project Structure

```
├── client/                 React frontend (Vite)
│   └── src/
│       ├── pages/          Dashboard, Tenants, Rooms, Payments, Reports, Login
│       ├── components/     Layout (sidebar) and Modal
│       └── api.js          Fetch helper (token + base URL)
└── server/                 Express backend
    └── src/
        ├── index.js        App entry, auth, dashboard endpoint
        ├── db.js           MySQL pool + schema loader
        ├── schema.sql      Tables (auto-created on start)
        ├── helpers.js      Balance computation, room status sync
        ├── seed.js         Optional demo data
        └── routes/         tenants, rooms, payments, reports
```

## API Overview

All endpoints except login require `Authorization: Bearer <token>`.

- `POST /api/admin/login` — log in; returns a session token (expires after 8 hours)
- `POST /api/admin/logout`
- `GET /api/dashboard` — room counts, active tenants, collections, outstanding balances, recent payments
- `GET /api/tenants?status=active|all&q=` — list tenants (active tenants include their balance)
- `POST /api/tenants` — add a tenant (name, contacts, guardian, room, move-in date)
- `GET /api/tenants/:id` — tenant detail with balance and payment history
- `PATCH /api/tenants/:id` — edit tenant / reassign room
- `POST /api/tenants/:id/move-out` — mark tenant moved out, free the room
- `GET /api/rooms` — rooms with occupant counts and tenant names
- `POST /api/rooms` / `PATCH /api/rooms/:id` / `DELETE /api/rooms/:id`
- `GET /api/payments?tenant_id=&method=&month=` — payment history
- `POST /api/payments` — record a payment (`method: cash|gcash`, GCash requires `gcash_reference`)
- `GET /api/payments/balances` — due / paid / balance for every active tenant
- `GET /api/reports/monthly?year=2026` — collections grouped by billing period

A tenant's balance is computed as:

> monthly rent × number of months since move-in (up to move-out month) − total payments

## Scope and Limitations

- Records GCash payments with reference numbers; does **not** process live online
  payment transactions through the GCash API.
- No automatic billing or invoicing — payments are recorded by the manager.
- Does not include facility maintenance scheduling.
- Web-based only; not a mobile app.
- Admin sessions are stored in memory and are cleared when the API restarts.

## Verify

```
cd server
npm install
npm start
cd ..\client
npm install
npm run build
```
