# AI Photo Enhancer & Thumbnail Generator

## Features

- **Photo Enhancer:**
  - Upload a photo to enhance its visual quality using AI (color, sharpness, etc.).
  - Supports multiple image formats (JPG, PNG, etc.).
  - User can view and delete their enhanced photos (deletion is soft, admin keeps record).

- **Thumbnail Generator:**
  - Upload a rough sketch (photo/scan of a drawing).
  - Provide a context/description for the thumbnail.
  - AI generates a thumbnail based on the sketch and context.

- **User Authentication:**
  - Email/password registration and login.
  - Username auto-generated from email.
  - No email verification for MVP.

- **User Dashboard:**
  - View history of enhanced photos and generated thumbnails.
  - Delete images from user view (admin keeps record).

- **Admin Panel:**
  - View all users and all images (including deleted by users).

## Tech Stack
- Node.js + Express (backend)
- HTML/CSS/JavaScript (frontend)
- PostgreSQL (database)
- Local storage for images (MVP), can switch to cloud later
- AI API integration (to be added)

---

## Setup
1. Install dependencies
2. Configure Postgres
3. Run backend and frontend

---

## To Do
- [ ] Scaffold backend (Express, routes, models)
- [ ] Scaffold frontend (HTML/CSS/JS)
- [ ] User authentication
- [ ] Photo enhancer UI & API
- [ ] Thumbnail generator UI & API
- [ ] Admin panel 