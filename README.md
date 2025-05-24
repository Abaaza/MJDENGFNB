# Tender Dashboard

This project tracks tender inquiries and pricing. It consists of a Node.js backend and a React frontend.

## Features

The long term goal of the application is to automate the tender estimation workflow. The August timeline includes:

- **Inquiry & Document Automation** – listen for inquiry emails, create project folders in Sharefile and store attachments with versioning.
- **Measurement & BoQ Handling** – import quantities from BlueBeam exports and client provided BoQ spreadsheets, then merge them into a unified BoQ.
- **Pricing Engine Integration** – populate unit rates from the master price sheet and calculate job totals. Custom overrides are preserved.
- **Project CRM Dashboard** – display project status and notify the estimating team when follow up is required.

The backend now contains service stubs implementing these responsibilities:

- `src/services/inquiryService.js` – creates project folders and handles addenda.
- `src/services/bluebeamParser.js` – parses BlueBeam CSV or XML measurement exports.
- `src/services/boqService.js` – merges client BoQ data with system calculated items.
- `src/services/pricing_engine.py` – Python helper to apply rates from the master price sheet.

These modules are placeholders and can be integrated with real mailboxes and Sharefile once credentials are available.
