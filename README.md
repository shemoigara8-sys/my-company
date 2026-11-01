# BlackWolf Technologies

A modern company website with a frontend landing page and an Express backend API.

## Features

- Responsive landing page for BlackWolf Technologies
- Product and service sections
- Contact form connected to a backend API
- Health check endpoint and service data API
- Ready to run locally with Node.js and Express

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm start
   ```
3. Open the website in a browser:
   ```bash
   http://localhost:3000
   ```

## API endpoints

- GET `/api/health`
- GET `/api/services`
- POST `/api/contact`

## Project structure

```text
.
├── public/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── server.js
├── package.json
├── .gitignore
└── README.md
```
