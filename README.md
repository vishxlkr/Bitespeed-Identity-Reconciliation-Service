# Bitespeed Identity Reconciliation Service

This is a Node.js web service written in TypeScript using Express and Prisma. It exposes a single endpoint `/identify` that allows Bitespeed to reconcile and consolidate physical customer identities across differently placed orders on FluxKart.

## Stack
- Node.js & Express
- TypeScript
- Prisma ORM
- SQLite (for ease of portability/testing, easily swappable for PostgreSQL as per requirements)

## How to Run Locally

### Prerequisites
- Node.js (v18+)
- npm

### Setup
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Generate the Prisma database and schema:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. Start the server (runs on `http://localhost:3000`):
   ```bash
   npm run dev
   ```
 *(You can configure `npm run dev` in package.json to run `ts-node-dev src/index.ts`)*

## API Documentation

### POST `/identify`
Accepts a JSON payload to reconcile customer identities.

**Example Request:**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Example Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [23]
  }
}
```

## Running Tests
Run the integration test suite (which validates against the core edge cases mentioned in the problem statement) with:
```bash
npx ts-node src/test.ts
```

## Online Hosting
*Deploy on Render.com or any other hosting provider by uploading this repo, and setting the start command to `ts-node src/index.ts`.*
