import { Router } from "express";
import {
   getAllContacts,
   identifyContact,
} from "../controllers/contactController";

const router = Router();

router.get("/contacts", getAllContacts);
router.post("/identify", identifyContact);

export default router;
