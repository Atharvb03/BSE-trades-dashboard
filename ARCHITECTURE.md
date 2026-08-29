# Architecture Note

## System Architecture

```text
┌─────────────────────┐
│   React Dashboard   │
│                     │
│ Shows existing      │
│ trades immediately  │
└──────────┬──────────┘
           │
           │ REST API + Socket.IO
           ▼
┌─────────────────────────────┐
│       Express Backend       │
│                             │
│  POST /api/trades/pull      │
│  starts the long-running    │
│  trade pull in background   │
└──────────┬──────────┬───────┘
           │          │
           │          │ Socket.IO Events
           │          └──────────────────┐
           │                             │
           ▼                             ▼
┌─────────────────────┐        ┌─────────────────────┐
│    Mock BSE API     │        │   React Dashboard   │
│                     │        │                     │
│   GET /getTrades    │        │ Updates automatically│
│                     │        └─────────────────────┘
│ Simulates 15-minute │
│ delayed API response│
└──────────┬──────────┘
           │
           │ Returns thousands of trades
           ▼
┌─────────────────────┐
│       MongoDB       │
│                     │
│ Stores trade data   │
│ Persistently        │
└─────────────────────┘
```

## Data Flow

1. When the dashboard opens, it calls `GET /api/trades` and immediately displays trades already stored in MongoDB.

2. When the user clicks **Pull Latest Trades**, the frontend sends:

```text
POST /api/trades/pull
```

3. The Express backend immediately returns a response confirming that the trade pull has started. It does not keep the user's HTTP request open.

4. The backend continues the long-running request to the Mock BSE API in the background.

5. The Mock BSE API simulates a 15-minute delay and then returns thousands of trade records.

6. The backend stores the records in MongoDB using `bulkWrite()` and `upsert`, which efficiently processes multiple records and prevents duplicate trades based on `tradeId`.

7. After the pull is completed, the backend emits Socket.IO events.

8. The React dashboard receives the event and automatically refreshes the displayed trade data without a page refresh or polling loop.

## Why This Design?

The main challenge is that the external trade API can take up to 15 minutes to return data, while an HTTP connection cannot remain open for more than 30 seconds.

To solve this problem, the application separates the short user request from the long-running trade pull.

```text
User clicks Pull
       │
       ▼
POST /api/trades/pull
       │
       ▼
Backend immediately responds
       │
       └── Background trade pull continues
                    │
                    ▼
              Mock BSE API
                    │
                    │ 15-minute delay
                    ▼
                 MongoDB
                    │
                    ▼
              Socket.IO Event
                    │
                    ▼
            Dashboard updates
```

This design ensures that:

* The dashboard opens instantly with previously stored trades.
* The user does not need to wait 15 minutes for the API request.
* The dashboard remains usable while a pull is in progress.
* Thousands of trades can be stored efficiently using `bulkWrite()`.
* `upsert` helps prevent duplicate trade records.
* New data appears automatically using Socket.IO.
* No page refresh is required.
* No polling loop is used.
* No cron job or scheduler is required.

## Technology Used

| Technology        | Purpose                             |
| ----------------- | ----------------------------------- |
| React + Vite      | Frontend dashboard                  |
| Node.js + Express | Backend API and trade pull handling |
| MongoDB Atlas     | Persistent trade storage            |
| Mongoose          | MongoDB object modeling             |
| Socket.IO         | Real-time dashboard updates         |
| Mock BSE API      | Simulates the delayed external API  |

## Summary

The architecture separates the user's short-lived HTTP request from the long-running trade data pull. Existing data is stored in MongoDB so the dashboard can load instantly, while Socket.IO provides an event-driven way to notify connected dashboards when new trade data becomes available.
