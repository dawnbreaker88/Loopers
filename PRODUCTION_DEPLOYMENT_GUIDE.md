# Loopers Production Deployment & Operations Guide

This guide provides a comprehensive production readiness checklist, environment variable documentation, database preparation guidelines, security and performance audits, and step-by-step instructions for deploying and maintaining the **Loopers Campus Hyperlocal Commerce Platform** in a production environment.

---

## 1. Project Overview & Architecture

Loopers is a hyperlocal quick commerce and document printing service built for campus environments. It uses a real-time event-driven architecture to coordinate customers, campus stores, and delivery agents.

### Hyperlocal Architecture Diagram

```mermaid
graph TD
    subgraph Client Layer (PWA & Desktop)
        C[Customer Storefront]
        A[Admin Dashboard]
    end

    subgraph Service Layer (API & Realtime Gateway)
        G[Express Server]
        S[Socket.io Gateway]
    end

    subgraph Infrastructure Layer
        DB[(MongoDB Database)]
        CLD[Cloudinary Media CDN]
        WP[VAPID Push Service]
    end

    C <-->|HTTP API & Websockets| G
    A <-->|HTTP API & Websockets| G
    G <-->|HTTP API & Websockets| S
    G <-->|Mongoose Queries| DB
    G <-->|Image/PDF Upload| CLD
    G <-->|Web Push| WP
```

- **Frontend**: Single Page Application built using React, Vite, Redux Toolkit, Tailwind CSS, and Lucide React. It operates as a Progressive Web Application (PWA) with push notification service workers.
- **Backend**: Express.js server hosted on Node.js. It manages real-time connections via Socket.io, processes PDF uploads, and coordinates push notifications.
- **Database**: MongoDB (Atlas) storing user profiles, active order carts, category hierarchies, dynamic sections, and order lifecycles.
- **External CDNs**: Cloudinary handles image uploads and transforms raw user uploads into optimized WebP formats.

---

## 2. Environment Variables Reference

Below is the complete configuration mapping required for both frontend and backend nodes.

### Backend Configurations (`.env`)

| Variable | Type | Required | Default Value | Production Recommendation | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `PORT` | Number | No | `5000` | `5000` (or system variable) | Port the Node.js server binds to. |
| `MONGO_URI` / `MONGODB_URI` | String | **Yes** | `mongodb://localhost:27017` | MDB Atlas connection string | Connection URI for the MongoDB server instance. |
| `JWT_SECRET` | String | **Yes** | `supersecretloopers2026` | Generate high-entropy 256-bit string | Signature key used to sign and verify authentication JWT payloads. |
| `NODE_ENV` | String | No | `development` | `production` | Set to `production` to suppress debug logs and stack trace leakages. |
| `CORS_ORIGIN` | String | **Yes** | `*` | Specific host origin (e.g. `https://loopers.campus`) | Host configurations. CSV lists are supported for multi-origin systems. |
| `AUTO_SEED_DATABASE` | Boolean | No | `true` | `false` | If set to `true`, seeds dynamic category collections and mock admins at startup. |
| `MAX_REQUEST_BODY_SIZE` | String | No | `10mb` | `5mb` | Maximum JSON request body parsing limit to avoid server crashes. |
| `AUTH_RATE_LIMIT_MAX` | Number | No | `100` | `30` | Number of allowable authentication requests per IP in a 15-minute window. |
| `API_RATE_LIMIT_MAX` | Number | No | `500` | `300` | Global API rate limits allowed per IP per 15-minute window. |
| `MAX_IMAGE_UPLOAD_SIZE_MB` | Number | No | `5` | `5` | Maximum allowed image file size for product listings. |
| `MAX_PDF_UPLOAD_SIZE_MB` | Number | No | `100` | `50` | Maximum allowed size of PDF print request files. |
| `MAX_BANNER_UPLOAD_SIZE_MB` | Number | No | `20` | `10` | Maximum allowed banner graphic creative size. |
| `CLOUDINARY_CLOUD_NAME` | String | **Yes** | - | Production cloud account namespace | Cloudinary environment parameter. |
| `CLOUDINARY_API_KEY` | String | **Yes** | - | Production cloud API Key | Cloudinary environment parameter. |
| `CLOUDINARY_API_SECRET` | String | **Yes** | - | Production cloud API Secret | Cloudinary environment parameter. |
| `VAPID_PUBLIC_KEY` | String | **Yes** | Ephemeral Key | Constant VAPID public key | Public key for browser push subscription handshakes. |
| `VAPID_PRIVATE_KEY` | String | **Yes** | Ephemeral Key | Constant VAPID private key | Private key for push dispatch verification. |

### Frontend Configurations (`.env`)

| Variable | Type | Required | Default Value | Production Recommendation | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `VITE_API_URL` | String | **Yes** | `http://localhost:5000` | Absolute URL (e.g. `https://api.loopers.campus`) | Target URL of the deployed Express gateway API server. |
| `VITE_UPI_ID` | String | **Yes** | - | Merchant UPI ID (e.g. `loopers@upi`) | Merchant UPI address used to compile dynamic QR codes and Pay Now intents. |

---

## 3. Production Security Audit & Verification

A production audit has been performed on the codebase. Below is the summary of security compliance:

- **HTTP Security Headers**: Powered by `helmet()`. Standardizes response headers to prevent clickjacking, MIME sniffing, and enforce strict HTTPS.
- **CORS Origins**: Strictly matches CORS requests against specific origins configuration via the `CORS_ORIGIN` variable rather than allowing open access (`*`).
- **API Rate Limiting**: Enabled for authentication routes and general API endpoints. Protects server infrastructure from brute-force attempts and denial-of-service vectors.
- **Validation (Zod)**: Applied to all public, profile, and order parameters. Sanitize all incoming strings to block MongoDB query injection attacks.
- **Production Error Masking**: Unhandled server errors (500) hide inner stack traces and technical exceptions in production mode, providing simple user-friendly messages instead.

---

## 4. Production Database Sanitization & Indexing

Before launching the platform to live users, the development database must be cleared and production indexes built.

### Development Clean Up Script

To purge development data while preserving essential administrative accounts, run the following MongoDB shell commands or configure them via database scripts:

```javascript
// 1. Connect to your database context
use hyperlocal-dispatcher;

// 2. Drop dynamic transactional collections (safe to drop completely)
db.orders.drop();
db.carts.drop();
db.usersubscriptions.drop();
db.adminsubscriptions.drop();

// 3. Purge standard customers but retain administrative credentials
db.users.deleteMany({ role: { $ne: "admin" } });

// 4. Verify administrative users remain
db.users.find({ role: "admin" }).forEach(printjson);
```

### Safely Seeding Admins

Ensure that `AUTO_SEED_DATABASE=true` is set for the initial deployment startup to automatically seed the primary administrative accounts if they are not already present:
- **System Admin**: `airaareddy@gmail.com` (password: `airaareddy123`)
- **Camper Admin**: `cp@gmail.com` (password: `camperprabs`)

Once verified, change `AUTO_SEED_DATABASE=false` in the production environment settings to prevent startup database seeding overhead.

### Rebuilding Performance Indexes

Confirm that the database indexing matches the production model setups:

```javascript
// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1, status: 1 });

// Product indexes
db.products.createIndex({ category: 1, price: 1 });
db.products.createIndex({ stock: 1 });
db.products.createIndex({ name: "text", description: "text", brand: "text" });

// Order indexes
db.orders.createIndex({ user: 1, createdAt: -1 });
db.orders.createIndex({ orderStatus: 1, createdAt: -1 });
db.orders.createIndex({ customId: 1 }, { unique: true, sparse: true });
```

---

## 5. Deployment Step-by-Step

### Backend API Server (Railway, Render, or Heroku)

1. **Deploy Repository**: Set up an app pointing to your backend subdirectory.
2. **Configure Environment**: Copy the variables list from section 2 into the deployment dashboard.
3. **Build Target**: Make sure the build configuration triggers:
   ```bash
   npm install && npm start
   ```
4. **Health Check Endpoint**: Set target check endpoint to `GET /` to verify operational checks:
   ```json
   { "message": "Loopers Quick Commerce Backend API is operational..." }
   ```

### Frontend Static Build Hosting (Vercel, Netlify, or AWS S3)

1. **Configure Environment**: Define `VITE_API_URL` pointing to the absolute URL of the deployed backend.
2. **Build Configurations**: Configure build commands in Vercel/Netlify dashboard:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Configure Rewrites for Single Page Application routing**:
   For Vercel deployments, write a `vercel.json` file in the root to handle client-side React routes:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

## 6. Real-time Service configurations (Cloudinary & VAPID Push Notification)

### Cloudinary Configuration
- Ensure your cloud storage credentials match exactly.
- Verify image formats support `jpeg`, `jpg`, `png`, and `webp` for product and banner uploads.

### Web Push VAPID Configurations
- Generate constant VAPID keys using `web-push` CLI helper:
  ```bash
  npx web-push generate-vapid-keys
  ```
- Copy the public and private keys into your server environment variables. This prevents service workers from losing synchronization with client devices on server restarts.

---

## 7. Progressive User Onboarding Flow

To ensure high conversion and a pleasant onboarding experience, user prompts have been refactored to appear progressively:

1. **PWA Installation Dialog**: Delayed until the user makes their first meaningful interaction (scroll, click, touch) on the page.
2. **GPS Geolocation Banner**: Deferred until the PWA prompt is resolved.
3. **Push Notifications Prompt**: Deferred until both PWA and location prompts are resolved, and presented 3 seconds after authentication to explain context clearly.

---

## 8. Backup, Monitoring, & Maintenance Plans

### Database Backup Plan
- **Backup Frequency**: Configure MongoDB Atlas automatic daily snapshots.
- **Manual Backups**: Run the following CLI backup instruction prior to major releases:
  ```bash
  mongodump --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/hyperlocal-dispatcher" --out=./backups/backup-$(date +%F)
  ```

### Health Monitoring & Troubleshooting
- Use tools like **UptimeRobot** or **AWS Route53 Health Checks** pointing to `GET /` to verify server state.
- In case of client redirection errors or WebSocket dropouts, ensure CORS configurations (`CORS_ORIGIN`) allow the absolute client domain, including appropriate subdomains.
