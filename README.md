# MJD Automation Backend

This repository contains a sample backend and frontend for the estimating dashboard.

## Email Listener

Patch 1 introduces a simple email listener service. The listener connects to an IMAP mailbox defined by the environment variables below and forwards any unread messages to the inquiry service. Each email results in a project folder under `SHAREFILE_BASE`.

Patch 2 adds a status watcher that emails the estimating team if a project stays
in the same status for more than 48 hours. The watcher runs hourly and uses
Nodemailer. Configure `EMAIL_USER` and `EMAIL_PASS` (and optionally `SMTP_HOST`
and `SMTP_PORT`) to enable reminders.


### Required environment variables

- `INBOX_USER` – mailbox username
- `INBOX_PASS` – mailbox password
- `INBOX_HOST` – IMAP server host
- `INBOX_PORT` – IMAP server port (defaults to 993)
- `SHAREFILE_BASE` – local path for storing project folders
- `RATE_FILE` – path to the master rate Excel sheet



Start the backend with these variables set and the server will automatically poll the inbox every minute.

Incoming emails create a folder named `Tender_[ProjectCode]_[Date]` under `SHAREFILE_BASE` with a `metadata.json` file.
The listener extracts the project code from the email subject (e.g. `TD-001`) and
reuses the same folder when follow‑up emails arrive. Attachments are saved as
addenda with timestamps and the most recent file is tracked in `current.txt`.

The pricing endpoint relies on Python 3 with the `openpyxl` package installed. Set the `RATE_FILE` environment variable to the location of your master price sheet.
## Project API

The `/api/projects` endpoints now provide basic CRUD operations. When the
`CONNECTION_STRING` environment variable is set, projects are persisted to
MongoDB. Without it, an in-memory sample list is used.

- `GET /api/projects` – list all projects
- `POST /api/projects` – create a new project
- `GET /api/projects/:id` – fetch one project
- `PATCH /api/projects/:id` – update status or other fields

POST /api/boq/bluebeam/boq converts a BlueBeam CSV or XML export into BoQ line items using scale and measurement info.
If the rate file is a CSV it should contain `code`, `rate` and optional `cost` columns. When a `cost` value is present the `/api/boq/price` endpoint will also return `profit` and `margin` fields for each item.

### Frontend

The frontend expects `VITE_API_URL` to point at the running backend. A sample `.env` file in `frontend/` sets this to `http://localhost:4000` for local development.