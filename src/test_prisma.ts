import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import config from '../prisma.config';

async function main() {
  try {
    const prisma = new PrismaClient(config as any);
    await prisma.contact.count();
    console.log("Success with config!");
  } catch(e) {
    console.error("Failed with config:", e);
  }
}

main();
