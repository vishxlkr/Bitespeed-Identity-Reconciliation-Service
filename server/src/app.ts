import "dotenv/config";
import express from "express";
import prisma from "./prisma";
import contactRoutes from "./routes/contactRoutes";

// Test DB Connection
prisma
   .$connect()
   .then(() => console.log("Connected to PostgreSQL Database"))
   .catch((err) => console.error("Database connection failed:", err));

const app = express();

app.use(express.json());

// Enable CORS manually
app.use((req, res, next) => {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Methods", "*");
   res.header("Access-Control-Allow-Headers", "*");
   if (req.method === "OPTIONS") {
      res.sendStatus(200);
   } else {
      next();
   }
});

app.use("/", contactRoutes);

app.get("/", (req, res) => {
   res.send("Bitespeed Identity Reconciliation Service");
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production") {
   app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
   });
}

export default app;
