import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient, Contact } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.post('/identify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      res.status(400).json({ error: 'Email or phoneNumber is required' });
      return;
    }

    // 1. Find all immediate matching contacts
    const matchingContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { email: email ? String(email) : undefined },
          { phoneNumber: phoneNumber ? String(phoneNumber) : undefined }
        ]
      }
    });

    // 2. If no matches, create brand new primary contact
    if (matchingContacts.length === 0) {
      const newContact = await prisma.contact.create({
        data: {
          email: email ? String(email) : null,
          phoneNumber: phoneNumber ? String(phoneNumber) : null,
          linkPrecedence: 'primary'
        }
      });
      res.status(200).json({
        contact: {
          primaryContatctId: newContact.id,
          emails: newContact.email ? [newContact.email] : [],
          phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
          secondaryContactIds: []
        }
      });
      return;
    }

    // 3. Find the primary contacts for all matches
    // Since we keep the tree flat (depth=1), a contact's primary ID is either its own ID (if primary) or its linkedId (if secondary)
    const primaryContactIds = Array.from(new Set(matchingContacts.map((c: any) => c.linkedId || c.id)));
    
    // Fetch these primary contacts to find the oldest one
    const primaryContacts = await prisma.contact.findMany({
      where: { id: { in: primaryContactIds } },
      orderBy: { createdAt: 'asc' }
    });

    // The oldest primary contact will be the absolute definitive primary
    const oldestPrimary = primaryContacts[0];
    
    // 4. Merge other primary contacts (if any) to the oldest one
    const otherPrimaries = primaryContacts.slice(1);
    const otherPrimaryIds = otherPrimaries.map((c: any) => c.id);

    if (otherPrimaryIds.length > 0) {
      // Convert older primaries to secondaries pointing to the oldest primary
      await prisma.contact.updateMany({
        where: { id: { in: otherPrimaryIds } },
        data: {
          linkedId: oldestPrimary.id,
          linkPrecedence: 'secondary',
          updatedAt: new Date()
        }
      });

      // Update any existing secondaries of the older primaries to point directly to the new oldest primary
      await prisma.contact.updateMany({
        where: { linkedId: { in: otherPrimaryIds } },
        data: { linkedId: oldestPrimary.id, updatedAt: new Date() }
      });
    }

    // 5. Check if the incoming request introduces new contact info
    // First, get ALL contacts now related to the oldest primary (which forms the entire updated tree)
    const allRelatedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: oldestPrimary.id },
          { linkedId: oldestPrimary.id }
        ]
      }
    });

    const incomingEmail = email ? String(email) : null;
    const incomingPhone = phoneNumber ? String(phoneNumber) : null;

    const emailIsNew = incomingEmail && !allRelatedContacts.some((c: any) => c.email === incomingEmail);
    const phoneIsNew = incomingPhone && !allRelatedContacts.some((c: any) => c.phoneNumber === incomingPhone);

    // Only create a new secondary if there is NEW information that wasn't previously in the tree
    if (emailIsNew || phoneIsNew) {
      const newSecondary = await prisma.contact.create({
        data: {
          email: incomingEmail,
          phoneNumber: incomingPhone,
          linkedId: oldestPrimary.id,
          linkPrecedence: 'secondary'
        }
      });
      allRelatedContacts.push(newSecondary);
    }

    // 6. Format Response
    const emailsSet = new Set<string>();
    const phonesSet = new Set<string>();
    const secondaryContactIds: number[] = [];

    // Add primary's email and phone first to ensure they are at the first index
    if (oldestPrimary.email) emailsSet.add(oldestPrimary.email);
    if (oldestPrimary.phoneNumber) phonesSet.add(oldestPrimary.phoneNumber);

    for (const c of allRelatedContacts) {
      if (c.id !== oldestPrimary.id) {
        secondaryContactIds.push(c.id);
        if (c.email) emailsSet.add(c.email);
        if (c.phoneNumber) phonesSet.add(c.phoneNumber);
      }
    }

    res.status(200).json({
      contact: {
        primaryContatctId: oldestPrimary.id,
        emails: Array.from(emailsSet),
        phoneNumbers: Array.from(phonesSet),
        secondaryContactIds
      }
    });
  } catch (error) {
    console.error("Error in /identify: ", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export { app };
