# Online Boarding Dormitory Management System

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

### Scope

The Online Boarding Dormitory Management System is a browser-based application for an administrator to manage the day-to-day records of a single boarding house or dormitory. Its implemented functions include:

- Maintaining room records, including room number, capacity, monthly rent, and vacant, occupied, or maintenance status; viewing room occupancy; and preventing assignments beyond room capacity.
- Maintaining tenant records, including contact and guardian details, assigned room, move-in date, and active or moved-out status; searching tenant records; updating details; and recording a tenant's move-out.
- Recording rent payments for active tenants by cash or GCash, including the billing month, amount, payment date, notes, and GCash reference number when applicable.
- Calculating tenant balances from the recorded rent and payments, and displaying dashboard information such as room and tenant counts, collections, recent payments, and outstanding balances.
- Viewing monthly payment totals and payment counts through the reports function.
- Restricting management pages and API operations to an authenticated administrator.

### Limitations

- The system records GCash payment details only. It does not connect to GCash or verify, transfer, or process payments automatically.
- Rent billing and payment entry are manual. The system calculates balances from stored records but does not automatically issue invoices, send payment reminders, or collect rent.
- The application provides one administrator login and does not include tenant accounts, multiple user roles, or fine-grained permissions.
- Administrator sessions are held in server memory and are cleared when the API server restarts, so users must sign in again.
- The system does not include visitor-log management, maintenance scheduling or work-order tracking, expense tracking, or communication/notification features.
- The system is designed for browser access and does not provide a dedicated mobile application.
- Reports are limited to the information currently implemented, such as monthly recorded collections and calculated tenant balances; they do not represent audited financial statements.
- Records and calculations depend on accurate data entry and the availability of the configured MySQL database and server. The system does not provide a separate backup or recovery feature.
