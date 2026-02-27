import { Request, Response } from "express";
import prisma from "../prisma";

export const getAllContacts = async (req: Request, res: Response) => {
   try {
      const contacts = await prisma.contact.findMany({
         orderBy: { createdAt: "desc" },
      });
      res.json(contacts);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
   }
};

export const identifyContact = async (req: Request, res: Response) => {
   const { email, phoneNumber } = req.body;

   if (!email && !phoneNumber) {
      return res
         .status(400)
         .json({ error: "Email and phoneNumber is required" });
   }

   const emailInput = email ? String(email) : null;
   const phoneInput = phoneNumber ? String(phoneNumber) : null;

   try {
      const orConditions = [];
      if (emailInput) orConditions.push({ email: emailInput });
      if (phoneInput) orConditions.push({ phoneNumber: phoneInput });

      const matchedContacts = await prisma.contact.findMany({
         where: {
            OR: orConditions,
            deletedAt: null,
         },
      });

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

      const primaryIds = new Set<number>();
      for (const contact of matchedContacts) {
         if (contact.linkPrecedence === "secondary" && contact.linkedId) {
            primaryIds.add(contact.linkedId);
         } else {
            primaryIds.add(contact.id);
         }
      }

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

      const primaryContact = cluster[0];

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

      const emailSet = new Set(cluster.map((c) => c.email).filter(Boolean));
      const phoneSet = new Set(
         cluster.map((c) => c.phoneNumber).filter(Boolean),
      );

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
};
