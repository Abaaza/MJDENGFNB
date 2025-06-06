# MJD Automation Backend

This repository contains a sample backend and frontend for the estimating dashboard.

## Node version

The project now targets **Node.js 22**. Ensure you have Node 22 installed locally when running the backend or the scripts. The deployment configuration uses the same runtime.

## Batch Pricing

The script `backend/scripts/batchPrice.js` processes one or more BoQ spreadsheets and writes priced Excel files alongside the originals. It relies on the `RATE_FILE` environment variable which should point to the master price list.

Run it with:

```bash
node backend/scripts/batchPrice.js ./path/to/boq1.xlsx ./path/to/boq2.xlsx
```

Each output file is named `priced_<original>.xlsx` in the same folder.

## Importing Lookalike Price Sheet

The script `backend/scripts/importPriceList.js` reads the **Lookalike sheet.xlsx**
file and stores the price items in MongoDB. Ensure `CONNECTION_STRING` is set in
`backend/.env` then run:

```bash
npm run import-prices --prefix backend
```

## Project API

The `/api/projects` endpoints provide basic CRUD operations. When the `CONNECTION_STRING` environment variable is set, projects are stored in MongoDB. Without it, an in-memory sample list is used.

- `GET /api/projects` – list all projects
- `POST /api/projects` – create a new project
- `GET /api/projects/:id` – fetch one project
- `PATCH /api/projects/:id` – update status or other fields
- `POST /api/projects/:id/boq` – upload a BoQ spreadsheet for a project
- `GET /api/projects/:id/boq` – fetch and price the latest BoQ
- `POST /api/projects/:id/price` – apply rates to the latest BoQ and store the result
- `POST /api/projects/:id/bluebeam` – upload a BlueBeam CSV or XML file and merge measurements into the project BoQ
- `POST /api/boq/price` – price an array of BoQ items using the master rate file

The BlueBeam import converts CSV or XML exports into BoQ line items and flags duplicates. The pricing endpoint reads the rate sheet defined by `RATE_FILE` and returns totals (and profit/margin when cost data is available).

### Frontend

The frontend expects `VITE_API_URL` to point at the running backend. A sample `.env` file in `frontend/` sets this to `http://localhost:4000` for local development.

### Sample data

The master price list used by the pricing engine is provided in `backend/MJD-PRICELIST.xlsx`.
The file `backend/src/sampleUsers.js` provides a few demo login accounts when no database is configured. Their passwords are `password123`, `secret456` and `admin`.

Set `RATE_FILE` to the path of `backend/MJD-PRICELIST.xlsx` to price uploaded BoQs.

## Price Matching

The `matchExcel.js` script compares an input spreadsheet against a price list.
Only price list rows that contain a unit rate are considered, ensuring the
matches always include pricing information. The output lists the best matches for
each item together with a confidence score and the matched unit rate.

Run it with:

```bash
node backend/scripts/matchExcel.js backend/MJD-PRICELIST.xlsx frontend/Input.xlsx
```

### Web Interface

Run the frontend with Vite and open `/price-match` to upload an Excel file for
matching. Each row shows the best matched item from the price list along with
its calculated unit rate and a confidence score. Price list entries without a
rate are ignored during matching.

### Running tests

Execute the backend unit tests with:

```bash
npm test --prefix backend
```
