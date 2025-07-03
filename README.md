# DocSign Backend

This is the backend (Node.js + Express + MongoDB) for the DocSign document signing app.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create an `.env` or `env` file with your MongoDB URI and JWT secret:
   ```env
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   PORT=8000
   ```
3. Start the server:
   ```bash
   npm run dev
   ```

## Features
- User authentication (register/login)
- Upload, sign, and download PDF documents
- Stores files in `/uploads` and metadata in MongoDB

## Folder Structure
- `src/` - Source code
- `uploads/` - Uploaded and signed PDFs (ignored by git)

---
For the frontend, see the `client/` directory. 