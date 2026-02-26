import 'dotenv/config';
import request from 'supertest';
import { app } from './index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- Cleaning DB ---');
  await prisma.contact.deleteMany();

  console.log('--- Test 1: New Contact ---');
  let res = await request(app).post('/identify').send({ email: "lorraine@hillvalley.edu", phoneNumber: "123456" });
  console.log(JSON.stringify(res.body, null, 2));

  console.log('\n--- Test 2: Secondary Contact (Same Phone, New Email) ---');
  res = await request(app).post('/identify').send({ email: "mcfly@hillvalley.edu", phoneNumber: "123456" });
  console.log(JSON.stringify(res.body, null, 2));
  
  console.log('\n--- Test 3: Existing Primary (Same Email) ---');
  res = await request(app).post('/identify').send({ email: "lorraine@hillvalley.edu", phoneNumber: null });
  console.log(JSON.stringify(res.body, null, 2));

  console.log('\n--- Test 4: Creating two separate primaries ---');
  await request(app).post('/identify').send({ email: "george@hillvalley.edu", phoneNumber: "919191" });
  await request(app).post('/identify').send({ email: "biffsucks@hillvalley.edu", phoneNumber: "717171" });
  console.log('Created two new separate primary contacts.');

  console.log('\n--- Test 5: Merging the two primaries into one ---');
  res = await request(app).post('/identify').send({ email: "george@hillvalley.edu", phoneNumber: "717171" });
  console.log(JSON.stringify(res.body, null, 2));
  
  console.log('\n--- Done ---');
  process.exit(0);
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
