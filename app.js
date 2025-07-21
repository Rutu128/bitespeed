import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import moment from "moment-timezone";
import { PrismaClient } from "./generated/prisma/index.js";

dotenv.config();

const app = express();

const prisma = new PrismaClient();

app.use(express.json({ limit: "1mb" }));
morgan.token("date", () => {
  return moment().tz("Asia/Kolkata").format("DD-MM-YYYY hh:mm:ss A");
});

app.use(
  morgan(
    "[:date] :method :url :status :res[content-length] - :response-time ms"
  )
);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the Bitespeed API",
    status: "success",
  });
});

app.post("/addContact", async (req, res) => {
  const { phone, email } = req.body;

  try {
    let linkPrecedence = "PRIMARY";
    if (!phone || !email) {
      return res.status(400).json({
        message: "Phone number and email are required",
        status: "error",
      });
    }
    // Check if the contact already exists
    const existing = await prisma.contact.findFirst({
      where: {
        phoneNumber: phone,
        email: email,
      },
    });
    if (existing) {
      return res.status(400).json({
        message: "Contact already exists",
        status: "error",
      });
    }
    const existingContact = await prisma.contact.findFirst({
      where: {
        OR: [{ phoneNumber: phone }, { email: email }],
        linkPrecedence: "PRIMARY",
      },
    });
    if (existingContact) {
      const contact = await prisma.contact.create({
        data: {
          phoneNumber: phone,
          email,
          linkPrecedence: "SECONDARY",
          linkedId: parseInt(existingContact.id),
        },
      });
      res.status(201).json({
        message: "Contact added successfully as secondary",
        contact,
        status: "success",
      });
    } else {
      const contact = await prisma.contact.create({
        data: {
          phoneNumber: phone,
          email,
          linkPrecedence: linkPrecedence,
        },
      });
      res.status(201).json({
        message: "Contact added successfully as primary",
        contact,
        status: "success",
      });
    }
  } catch (error) {
    console.error("Error adding contact:", error);
    res.status(500).json({
      message: "Internal server error",
      status: "error",
    });
  }
});

app.post("/identify", async (req, res) => {
  const { phone, email } = req.body;
  
  try {
    if (!phone && !email) {
      return res.status(400).json({
        message: "Phone number or email is required",
        status: "error",
      });
    }

    const whereConditions = [];
    if (phone) whereConditions.push({ phoneNumber: phone });
    if (email) whereConditions.push({ email: email });

    const contacts = await prisma.contact.findMany({
      where: { OR: whereConditions },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        linkPrecedence: true,
      },
    });

    if (contacts.length === 0) {
      return res.status(404).json({
        message: "No contacts found",
        status: "error",
      });
    }

    // Using Sets for automatic deduplication
    const emailSet = new Set();
    const phoneSet = new Set();
    let primaryContactId = null;
    const secondaryContactIds = [];

    contacts.forEach(contact => {
      if (contact.linkPrecedence === "PRIMARY") {
        primaryContactId = contact.id;
      } else {
        secondaryContactIds.push(contact.id);
      }
      
      if (contact.email) emailSet.add(contact.email);
      if (contact.phoneNumber) phoneSet.add(contact.phoneNumber);
    });

    const contactDetails = {
      primaryContactId,
      emails: Array.from(emailSet),
      phoneNumbers: Array.from(phoneSet),
      secondaryContactIds,
    };

    return res.status(200).json({
      message: "Contact identified successfully",
      contactDetails,
      status: "success",
    });
    
  } catch (error) {
    console.error("Error identifying contact:", error);
    return res.status(500).json({
      message: "Internal server error",
      status: "error",
    });
  }
});
export default app;
