# BlackWolf Technologies SaaS Platform

A modern company website with a marketing homepage, secure admin login, product management, and customer lead tracking.

## Features

- Responsive BlackWolf Technologies marketing website
- Real SQLite database for products and lead management
- Admin authentication with session-based login
- Admin dashboard for product management and lead review
- Contact form that stores leads in the database
- Optional email sending via SMTP when configured
- Ready for SaaS-style growth and product expansion

## Default Admin Credentials

Email: admin@blackwolftechnologies.com
Password: Blackwolf123!

Important: change this in your environment or after first login.

## Environment Variables

You can optionally enable real email sending with SMTP:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@blackwolftechnologies.com
ADMIN_EMAIL=admin@blackwolftechnologies.com
ADMIN_PASSWORD=Blackwolf123!
SESSION_SECRET=your-strong-session-secret
```

## Run locally

1. Install dependencies:
```bash
npm install
```

2. Start the app:
```bash
npm start
```

3. Open the app:
```bash
http://localhost:3000
```

4. Open the admin dashboard:
```bash
http://localhost:3000/login
```

## API endpoints

- GET `/api/health`
- GET `/api/products`
- POST `/api/contact`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/me`
- GET `/api/admin/summary` (admin only)
- GET `/api/admin/products` (admin only)
- GET `/api/admin/contacts` (admin only)
- POST `/api/admin/products` (admin only)
- DELETE `/api/admin/products/:id` (admin only)

## Project structure

```text
.
├── public/
│   ├── index.html
│   ├── login.html
│   ├── admin.html
│   ├── styles.css
│   ├── script.js
│   └── admin.js
├── data/
│   └── blackwolf.db
├── server.js
├── package.json
├── .gitignore
└── README.md
```
