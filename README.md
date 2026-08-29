# BSE Trades Dashboard

A full-stack real-time trade monitoring application built as a Software Engineer technical assessment.

The application simulates pulling thousands of trade records from a BSE Exchange API where the data pull can take up to 15 minutes, while HTTP connections cannot remain open for longer than 30 seconds.

The solution allows the dashboard to remain available during the long-running pull and automatically updates connected users when new trade data becomes available.

## Problem Statement

The external BSE API can take up to 15 minutes to return trade data.

However, the network closes HTTP connections that remain open for longer than 30 seconds.

The application solves this by separating the short-lived request that starts the trade pull from the long-running background operation.

The dashboard:

* Loads previously stored trades immediately
* Allows a new trade pull to start without waiting for completion
* Continues showing existing trade data while the pull is running
* Automatically updates when new trades are available
* Does not require a page refresh
* Does not use a polling loop
* Does not use a cron job or scheduler

## Architecture

```text
                         ┌─────────────────────┐
                         │   React Dashboard   │
                         │                     │
                         │ Shows stored trades │
                         └──────────┬──────────┘
                                    │
                         HTTP + Socket.IO
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Express Backend   │
                         │                     │
                         │ Starts long-running │
                         │ trade pull process  │
                         └───────┬───────┬─────┘
                                 │       │
                    HTTP Request │       │ Socket.IO Events
                                 │       │
                                 ▼       ▼
                    ┌────────────────┐  React Dashboard
                    │  Mock BSE API  │
                    │                │
                    │ GET /getTrades │
                    │                │
                    │ Up to 15 min   │
                    └───────┬────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │    MongoDB     │
                    │                │
                    │ Persistent     │
                    │ Trade Storage  │
                    └────────────────┘
```

A detailed architecture explanation is available in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Tech Stack

### Frontend

* React
* Vite
* Axios
* Socket.IO Client
* CSS

### Backend

* Node.js
* Express.js
* Socket.IO
* MongoDB
* Mongoose

### Mock External API

* Node.js
* Express.js

### Database

* MongoDB Atlas

## Project Structure

```text
bse-trades-assignment/
│
├── frontend/
│   └── React + Vite dashboard
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── config/
│
├── mock-bse-api/
│   └── Simulated BSE Exchange API
│
├── ARCHITECTURE.md
└── README.md
```

## Features

### Trade Dashboard

* Displays previously stored trades immediately
* Pagination
* Search functionality
* Symbol filtering
* Trade sorting
* Total trade count
* Loading states
* Error handling
* Responsive UI

### Long-Running Trade Pull

The trade pull is started through:

```text
POST /api/trades/pull
```

The backend immediately responds that the pull has started instead of waiting for the external API.

The backend then continues fetching trade data from the Mock BSE API in the background.

This prevents the user's HTTP request from remaining open for the entire 15-minute operation.

### Real-Time Updates

Socket.IO is used to notify connected dashboards about:

```text
pullStatus
```

and:

```text
tradesUpdated
```

When the trade pull completes and new trades are stored in MongoDB, the backend emits an event.

The React dashboard receives the event and fetches the latest paginated trade data automatically.

No polling loop or page refresh is required.

### Duplicate Prevention

Trade records use `tradeId` as a unique identifier.

MongoDB `bulkWrite` with `upsert` is used when saving pulled trades.

This ensures that:

* Existing trades are not duplicated
* New trades are inserted efficiently
* Thousands of records can be processed in bulk

## API Endpoints

### Get Trades

```text
GET /api/trades
```

Supports:

* Pagination
* Search
* Symbol filtering
* Sorting

Example:

```text
GET /api/trades?page=1&limit=20&search=TCS&symbol=TCS&sortBy=timestamp&order=desc
```

### Start Trade Pull

```text
POST /api/trades/pull
```

Example response:

```json
{
  "success": true,
  "message": "Trade pull started successfully",
  "status": "processing"
}
```

### Get Pull Status

```text
GET /api/trades/status
```

### Mock BSE API

```text
GET /getTrades
```

Returns seeded trade records after a configurable delay.

## Local Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd bse-trades-assignment
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
MOCK_BSE_API_URL=http://localhost:5001/getTrades
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

### 3. Install Mock BSE API Dependencies

Open another terminal:

```bash
cd mock-bse-api
npm install
```

Create a `.env` file:

```env
PORT=5001
DELAY_MS=900000
```

Start the Mock BSE API:

```bash
node server.js
```

For faster local testing, the delay can temporarily be changed to:

```env
DELAY_MS=15000
```

### 4. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

Create:

```text
frontend/.env
```

Add:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Environment Variables

### Backend

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
MOCK_BSE_API_URL=your_mock_bse_api_url
CLIENT_URL=your_frontend_url
```

### Mock BSE API

```env
PORT=5001
DELAY_MS=900000
```

### Frontend

```env
VITE_API_URL=your_backend_url
```

## Deployment

The application can be deployed as three services:

```text
React Frontend
       │
       ▼
     Vercel
       │
       │ HTTP + Socket.IO
       ▼
Express Backend
       │
       ▼
     Render
       │
       ├───────────────► MongoDB Atlas
       │
       └───────────────► Mock BSE API on Render
```

### Deployment Order

1. Deploy Mock BSE API to Render
2. Deploy Express Backend to Render
3. Configure MongoDB Atlas
4. Deploy React frontend to Vercel
5. Update environment variables with the deployed URLs
6. Test the complete real-time flow

## Why This Design?

The key architectural decision is separating the user's short HTTP request from the long-running API pull.

Instead of:

```text
User
  │
  │ Wait 15 minutes
  ▼
Backend
  │
  ▼
BSE API
```

which would cause the HTTP connection to timeout, the application uses:

```text
User
  │
  │ POST /pull
  ▼
Backend
  │
  ├── Immediately responds
  │
  └── Continues long-running pull
            │
            ▼
       Mock BSE API
            │
            ▼
         MongoDB
            │
            ▼
       Socket.IO Event
            │
            ▼
         Dashboard
```

This keeps the dashboard responsive while the long-running operation continues.

## Testing

The following scenarios were tested:

* Dashboard loads existing trades
* Trade pagination works
* Search works
* Symbol filtering works
* Sorting works
* Trade pull starts successfully
* Dashboard remains usable during a pull
* Duplicate trades are prevented
* New trades are stored in MongoDB
* Dashboard updates automatically using Socket.IO
* No page refresh is required
* No polling loop is used

## Author

Atharv Bendkhale
