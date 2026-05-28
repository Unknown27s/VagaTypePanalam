# VangaTypePanalam API Documentation

This document outlines the available API routes for the VangaTypePanalam application.

## Base URL
The API is served from the `/api` prefix of the application root.

---

## 1. Authentication
Managed by **Auth.js** (NextAuth v5).

### `POST /api/auth/[...nextauth]`
Standard Auth.js handler for sign-in (GitHub OAuth, Credentials) and sign-out.

### `POST /api/register`
Registers a new user with email and password.
- **Payload**: `{ email, password, name }`
- **Response**: `201 Created` or `400 Bad Request`

---

## 2. Cloud Synchronization
Synchronizes local IndexedDB data with the remote PostgreSQL database.

### `POST /api/sync`
Pushes local data to the cloud.
- **Auth**: Required
- **Payload**:
  ```json
  {
    "stats": "Serialized key-stats JSON",
    "sessions": "Serialized sessions JSON",
    "profile": "Serialized user-profile JSON"
  }
  ```
- **Response**: `{ success: true, updatedAt: string }`

### `GET /api/sync`
Pulls the latest backup from the cloud.
- **Auth**: Required
- **Response**:
  ```json
  {
    "stats": "...",
    "sessions": "...",
    "profile": "...",
    "updatedAt": "..."
  }
  ```

---

## 3. Gamification Data
Fetches dynamic game configuration (Ranks, Badges, Events) from the database.

### `GET /api/gamification`
- **Auth**: Optional
- **Response**:
  ```json
  {
    "ranks": [...],
    "badges": [...],
    "events": [...]
  }
  ```

---

## 4. Admin Tools
Restricted routes for managing global application state.

### POST /api/admin/badges
Create or update a badge definition.
- **Auth**: Required (Admin role)
- **Payload**: `{ id, title, description, icon, rarity, category, quote }`

### POST /api/admin/inject-svg
Inject raw SVG code for a badge or rank icon.
- **Auth**: Required (Admin role)
- **Payload**: `{ targetId, svgContent }`

### GET /api/admin/users
Fetches a list of all typist accounts along with their synchronized cloud telemetry backups (profiles and active typing logs).
- **Auth**: Required (Admin role)
- **Response**: List of user objects with nested `cloudBackup` profiles and sessions.

### GET /api/admin/books
List all custom imported practice books.
- **Auth**: Required (Admin role)
- **Response**: Array of PracticeBook models.

### POST /api/admin/books
Upload and automatically tokenize (strip special characters, keep clean words) a new weekly book.
- **Auth**: Required (Admin role)
- **Payload**: `{ title, description, content, isActive, startDate, endDate }`
- **Response**: `200 OK` with imported book details and tokenized unique words count.

### PUT /api/admin/books
Update practice book configurations or manually activate a book.
- **Auth**: Required (Admin role)
- **Payload**: `{ id, isActive, title, description, content, startDate, endDate }`

### DELETE /api/admin/books
Permanently remove a practice book from the system.
- **Auth**: Required (Admin role)
- **Query Param**: `id`

---

## 5. Public Rotating Content

### GET /api/practice-book/active
Fetches the currently active rotating book of the week for user training (offline-first cached).
- **Auth**: Optional
- **Response**:
  ```json
  {
    "success": true,
    "book": {
      "id": "...",
      "title": "...",
      "description": "...",
      "words": ["word1", "word2", "word3"]
    }
  }
  ```

---

## 6. Proxy Utilities

### GET /api/proxy/image
Proxies external images to avoid CORS issues or for caching purposes.
