require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const tradeRoutes = require("./routes/tradeRoutes");


const app = express();


// ==========================================
// CREATE HTTP SERVER
// ==========================================

const server =
  http.createServer(app);


// ==========================================
// SOCKET.IO
// ==========================================

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});


// Make Socket.IO available
// to controllers
app.set("io", io);


// ==========================================
// CONNECT DATABASE
// ==========================================

connectDB();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(
  express.json()
);


// ==========================================
// ROUTES
// ==========================================

app.use(
  "/api/trades",
  tradeRoutes
);


// ==========================================
// TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message:
      "BSE Trades Backend is running",
  });
});


// ==========================================
// SOCKET CONNECTION
// ==========================================

io.on(
  "connection",
  (socket) => {
    console.log(
      "Client connected:",
      socket.id
    );

    socket.on(
      "disconnect",
      () => {
        console.log(
          "Client disconnected:",
          socket.id
        );
      }
    );
  }
);


// ==========================================
// START SERVER
// ==========================================

const PORT =
  process.env.PORT || 5000;

server.listen(
  PORT,
  () => {
    console.log(
      `Backend running on http://localhost:${PORT}`
    );
  }
);