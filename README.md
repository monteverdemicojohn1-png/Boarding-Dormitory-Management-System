# Online Boarding Dormitory Management System

A web-based system for managing boarding houses and dormitories: tenant records, room
occupancy, and monthly rental payment tracking (including GCash payment recording) —
replacing handwritten logbooks and notebooks.

**Course:** Bachelor of Science in Information Technology  
**Adviser:** Sir John Fredrick Lim

## Group Members

- Tejano, Ma. Genelle A. (Group Representative)
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
online platform that runs in the browser.

### Main Features

- **Tenant Management** — add, edit, and view tenant information, guardians, and move-in/move-out dates.
- **Room Management** — track room status, capacity, monthly rent, and occupancy.
- **Payment Monitoring** — record Cash and GCash payments with GCash reference numbers.
- **Reports** — monthly collections, room occupancy, and outstanding balances.
- **Admin Login** — protected administrator access.

> This system records GCash payments for verification and tracking. It does not process live GCash API transactions.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Database | MySQL |

## Requirements

- Node.js 18 or newer
- npm
- MySQL 8 or MariaDB

## Setup

1. Create the database:

```sql
CREATE DATABASE IF NOT EXISTS boarding_dorm
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

2. Configure the server:

```bash
cd server
cp .env.example .env
```

On Windows:

```cmd
copy .env.example .env
```

Edit `server/.env` with the MySQL credentials and initial admin account.

3. Start the API:

```bash
cd server
npm install
npm run dev
```

The API runs at `http://localhost:5000`.

4. Start the frontend in another terminal:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173` and sign in using `server/.env` credentials.

5. Optional demo data:

```bash
cd server
npm run seed
```

## Project Structure

```text
client/
  src/
    pages/
    components/
    api.js
server/
  src/
    routes/
    index.js
    db.js
    helpers.js
    schema.sql
    seed.js
```

## API Overview

All endpoints except login require `Authorization: Bearer <token>`.

- `POST /api/admin/login`
- `GET /api/dashboard`
- `GET|POST /api/tenants`
- `PATCH|POST /api/tenants/:id`
- `GET|POST|PATCH|DELETE /api/rooms`
- `GET|POST /api/payments`
- `GET /api/payments/balances`
- `GET /api/reports/monthly?year=2026`

## Scope and Limitations

- GCash is recorded but not processed through a live payment API.
- No automatic billing or invoicing.
- No maintenance scheduling.
- Web-based only.
- Admin sessions are stored in memory and reset when the API restarts.
