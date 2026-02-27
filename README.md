# Bitespeed Identity Reconciliation Service

A web service that identifies and keeps track of a customer's identity across multiple purchases, linking different contact information (email/phone) to a single "primary" contact.

## 🚀 Live Demo

**Frontend Dashboard:**  
[https://bitespeed-identity-reconciliation-service.onrender.com](https://bitespeed-identity-reconciliation-service.onrender.com)

**Backend API (Render - HTTPS):**  
`https://bitespeed-identity-reconciliation-x9ea.onrender.com`

<!-- **Backend API (AWS - HTTP):**
`http://3.235.68.201:3000` -->

**Endpoint:**  
`POST /identify`

### Test with Curl

```bash
curl -X POST https://bitespeed-identity-reconciliation-x9ea.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "vishal@gmail.com", "phoneNumber": "1234567890"}'
```

---

## 🛠️ Tech Stack

- **Node.js** with **TypeScript**
- **Express.js**
- **PostgreSQL** (Hosted on AWS EC2)
- **Prisma ORM**

---

## ⚙️ Installation & Setup (Local)

### 1. Prerequisites

- Node.js (v18+)
- PostgreSQL (Local or Cloud)

### 2. Clone the Repository

```bash
git clone https://github.com/<your-username>/bitespeed-identity-reconciliation.git
cd bitespeed-identity-reconciliation
cd server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
DATABASE_URL="postgresql://user:your_password@localhost:5432/bitespeed_db"
PORT=3000
```

### 5. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run Migrations
npx prisma migrate dev --name init
```

### 6. Run the Server

```bash
# Development Mode
npm run dev

# Production Build
npm run build
npm start
```

The server will start on `http://localhost:3000`.

---

## 🧪 API Usage

**Endpoint**: `/identify`  
**Method**: `POST`

**Request Body:**

```json
{
   "email": "mcfly@hillvalley.edu",
   "phoneNumber": "123456"
}
```

**Response:**

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

---

## 📂 Project Structure

```
server/
├── prisma/             # Database schema & migrations
├── src/
│   └── app.ts          # Main application logic
├── package.json
└── tsconfig.json
```
