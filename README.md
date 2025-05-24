# MJD Automation Backend

This repository contains a sample backend and frontend for the estimating dashboard.

## Email Listener

Patch 1 introduces a simple email listener service. The listener connects to an IMAP mailbox defined by the environment variables below and forwards any unread messages to the inquiry service. Each email results in a project folder under `SHAREFILE_BASE`.

### Required environment variables

- `INBOX_USER` – mailbox username
- `INBOX_PASS` – mailbox password
- `INBOX_HOST` – IMAP server host
- `INBOX_PORT` – IMAP server port (defaults to 993)
- `SHAREFILE_BASE` – local path for storing project folders

Start the backend with these variables set and the server will automatically poll the inbox every minute.