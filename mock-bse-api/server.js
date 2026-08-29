const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

// Use Render's PORT in deployment, otherwise use 5001 locally
const PORT = process.env.PORT || 5001;

// Generate seeded trade data
const clients = [
  "ABC Capital",
  "XYZ Investments",
  "Reliance Securities",
  "Tata Capital",
  "HDFC Securities",
];

const symbols = [
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "ICICIBANK",
];

function generateTrades(count = 3000) {
  const trades = [];

  for (let i = 1; i <= count; i++) {
    trades.push({
      tradeId: `TRD-${Date.now()}-${i}`,
      client: clients[Math.floor(Math.random() * clients.length)],
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      quantity: Math.floor(Math.random() * 1000) + 1,
      price: Number((Math.random() * 3000 + 100).toFixed(2)),
      timestamp: new Date().toISOString(),
    });
  }

  return trades;
}

// Mock BSE API
app.get("/getTrades", async (req, res) => {
  // Fixed 15-minute delay
  const delay = 900000;

  console.log(
    `Trade request received. Waiting ${delay / 60000} minutes...`
  );

  // Simulate slow external BSE API
  await new Promise((resolve) =>
    setTimeout(resolve, delay)
  );

  const trades = generateTrades(3000);

  console.log(`Returning ${trades.length} trades`);

  res.json({
    success: true,
    count: trades.length,
    data: trades,
  });
});

app.listen(PORT, () => {
  console.log(
    `Mock BSE API running on port ${PORT}`
  );
});