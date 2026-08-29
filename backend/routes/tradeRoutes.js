const express = require("express");

const {
  getTrades,
  startTradePull,
  getTradePullStatus,
} = require("../controllers/tradeController");

const router = express.Router();


// GET /api/trades
router.get(
  "/",
  getTrades
);


// POST /api/trades/pull
router.post(
  "/pull",
  startTradePull
);


// GET /api/trades/status
router.get(
  "/status",
  getTradePullStatus
);


module.exports = router;