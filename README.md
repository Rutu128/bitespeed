# Bitespeed Contact Management API

A Node.js Express API for managing contact information with advanced linking and identification capabilities. This system allows for primary and secondary contact relationships, enabling efficient contact consolidation and retrieval.

## Features

- **Contact Management**: Add and identify contacts with phone numbers and emails
- **Smart Contact Linking**: Automatically links related contacts as primary/secondary relationships
- **Contact Identification**: Retrieve consolidated contact information across linked records
- **Data Deduplication**: Automatic removal of duplicate emails and phone numbers
- **Request Logging**: Detailed request logging with Indian Standard Time timestamps
- **Error Handling**: Comprehensive error handling with meaningful status messages

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database ORM**: Prisma
- **Logging**: Morgan
- **Date/Time**: Moment.js with timezone support
- **Environment Management**: Dotenv

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Database (configured with Prisma)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bitespeed
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Configure your database connection and other environment variables in `.env`

4. Set up Prisma:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm start
```

The server will start on the configured port with nodemon for automatic reloading.

## API Endpoints

### 1. Health Check
**GET** `/`

Returns API status and welcome message.

**Response:**
```json
{
  "message": "Welcome to the Bitespeed API",
  "status": "success"
}
```

### 2. Add Contact
**POST** `/addContact`

Adds a new contact to the system with intelligent linking.

**Request Body:**
```json
{
  "phone": "1234567890",
  "email": "user@example.com"
}
```

**Behavior:**
- If both phone and email are new → Creates PRIMARY contact
- If phone OR email exists → Creates SECONDARY contact linked to existing PRIMARY
- Prevents duplicate contacts with same phone AND email

**Response (Primary Contact):**
```json
{
  "message": "Contact added successfully as primary",
  "contact": {
    "id": 1,
    "phoneNumber": "1234567890",
    "email": "user@example.com",
    "linkPrecedence": "PRIMARY",
    "linkedId": null
  },
  "status": "success"
}
```

**Response (Secondary Contact):**
```json
{
  "message": "Contact added successfully as secondary",
  "contact": {
    "id": 2,
    "phoneNumber": "9876543210",
    "email": "user@example.com",
    "linkPrecedence": "SECONDARY",
    "linkedId": 1
  },
  "status": "success"
}
```

### 3. Identify Contact
**POST** `/identify`

Retrieves consolidated contact information for a given phone number or email.

**Request Body:**
```json
{
  "phone": "1234567890",
  "email": "user@example.com"
}
```

**Note:** At least one of `phone` or `email` is required.

**Response:**
```json
{
  "message": "Contact identified successfully",
  "contactDetails": {
    "primaryContactId": 1,
    "emails": ["user@example.com", "user2@example.com"],
    "phoneNumbers": ["1234567890", "9876543210"],
    "secondaryContactIds": [2, 3]
  },
  "status": "success"
}
```

## Error Responses

The API returns consistent error responses:

```json
{
  "message": "Error description",
  "status": "error"
}
```

**Common Error Codes:**
- `400`: Bad Request (missing required fields, duplicate contact)
- `404`: Not Found (no contacts found for identification)
- `500`: Internal Server Error

## Database Schema

The API expects a `Contact` model with the following structure:

```prisma
model Contact {
  id             Int      @id @default(autoincrement())
  phoneNumber    String?
  email          String?
  linkPrecedence String   // "PRIMARY" or "SECONDARY"
  linkedId       Int?     // References primary contact ID
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

## Contact Linking Logic

1. **New Contact**: If no existing contact matches phone or email → PRIMARY contact
2. **Partial Match**: If phone OR email matches existing PRIMARY → New SECONDARY linked to PRIMARY
3. **Duplicate Prevention**: Exact phone + email combination rejected if already exists
4. **Identification**: Finds all contacts matching phone/email and consolidates data

## Logging

All requests are logged with:
- Timestamp (Asia/Kolkata timezone)
- HTTP method and URL
- Response status and size
- Response time

Format: `[DD-MM-YYYY hh:mm:ss A] METHOD URL STATUS SIZE - TIME ms`

## Development

**Start development server:**
```bash
npm start
```

**Key Development Features:**
- Auto-reload with nodemon
- Comprehensive error logging
- JSON request parsing (1MB limit)
- CORS support available (cors package installed)

## Project Structure

```
bitespeed/
├── generated/
│   └── prisma/          # Generated Prisma client
├── index.js             # Main application file
├── package.json         # Dependencies and scripts
├── .env                 # Environment variables
└── README.md           # This file
```

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL="your-database-connection-string"
PORT=3000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License

## Support

For questions or issues, please create an issue in the repository or contact the development team.
