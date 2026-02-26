import "dotenv/config";
import express, { Request, Response } from "express";
import { PrismaClient, Contact } from "@prisma/client";

const prisma = new PrismaClient();

// Test DB Connection
prisma.$connect()
  .then(() => console.log('Connected to PostgreSQL Database'))
  .catch((err) => console.error('Database connection failed:', err));

const app = express();

app.use(express.json());

interface IdentifyRequest {
   email?: string | null;
   phoneNumber?: string | number | null;
}

app.post("/identify", async (req: Request, res: Response) => {
   const { email, phoneNumber } = req.body;

   if (!email && !phoneNumber) {
      return res
         .status(400)
         .json({ error: "Email and phoneNumber is required" });
   }

   const emailInput = email ? String(email) : null;
   const phoneInput = phoneNumber ? String(phoneNumber) : null;

   try {
      //  Build OR conditions cleanly
      const orConditions = [];
      if (emailInput) orConditions.push({ email: emailInput });
      if (phoneInput) orConditions.push({ phoneNumber: phoneInput });

      // 2️ Find matching contacts
      const matchedContacts = await prisma.contact.findMany({
         where: {
            OR: orConditions,
            deletedAt: null,
         },
      });

      //  If no match → create primary
      if (matchedContacts.length === 0) {
         const newPrimary = await prisma.contact.create({
            data: {
               email: emailInput,
               phoneNumber: phoneInput,
               linkPrecedence: "primary",
            },
         });

         return res.status(200).json({
            contact: {
               primaryContactId: newPrimary.id,
               emails: [newPrimary.email].filter(Boolean),
               phoneNumbers: [newPrimary.phoneNumber].filter(Boolean),
               secondaryContactIds: [],
            },
         });
      }

      //  Collect all primary IDs involved
      const primaryIds = new Set<number>();
      for (const contact of matchedContacts) {
         if (contact.linkPrecedence === "secondary" && contact.linkedId) {
            primaryIds.add(contact.linkedId);
         } else {
            primaryIds.add(contact.id);
         }
      }

      //  Fetch full cluster
      const cluster = await prisma.contact.findMany({
         where: {
            OR: [
               { id: { in: Array.from(primaryIds) } },
               { linkedId: { in: Array.from(primaryIds) } },
            ],
            deletedAt: null,
         },
         orderBy: { createdAt: "asc" },
      });

      //  Oldest contact becomes final primary
      const primaryContact = cluster[0];

      //  Demote others if needed
      const idsToUpdate: number[] = [];

      for (const contact of cluster) {
         if (contact.id === primaryContact.id) continue;

         if (
            contact.linkPrecedence === "primary" ||
            contact.linkedId !== primaryContact.id
         ) {
            idsToUpdate.push(contact.id);
         }
      }

      if (idsToUpdate.length > 0) {
         await prisma.contact.updateMany({
            where: { id: { in: idsToUpdate } },
            data: {
               linkPrecedence: "secondary",
               linkedId: primaryContact.id,
            },
         });
      }

      //  Collect existing emails & phones
      const emailSet = new Set(cluster.map((c) => c.email).filter(Boolean));
      const phoneSet = new Set(
         cluster.map((c) => c.phoneNumber).filter(Boolean),
      );

      //  Create new secondary if new info provided
      if (
         (emailInput && !emailSet.has(emailInput)) ||
         (phoneInput && !phoneSet.has(phoneInput))
      ) {
         const newSecondary = await prisma.contact.create({
            data: {
               email: emailInput,
               phoneNumber: phoneInput,
               linkPrecedence: "secondary",
               linkedId: primaryContact.id,
            },
         });

         if (newSecondary.email) emailSet.add(newSecondary.email);
         if (newSecondary.phoneNumber) phoneSet.add(newSecondary.phoneNumber);
      }

      // Build response
      return res.status(200).json({
         contact: {
            primaryContactId: primaryContact.id,
            emails: Array.from(emailSet),
            phoneNumbers: Array.from(phoneSet),
            secondaryContactIds: cluster
               .filter((c) => c.id !== primaryContact.id)
               .map((c) => c.id),
         },
      });
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
   }
});

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
