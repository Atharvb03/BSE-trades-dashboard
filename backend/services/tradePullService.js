const Trade = require("../models/Trade");

const {
  Agent,
  fetch,
} = require("undici");

const {
  setPullStatus,
} = require("./pullStatus");

// ==========================================
// FIX FOR "fetch failed"
// ==========================================
// Node's built-in fetch runs on undici, which
// aborts any request that has not received
// response headers within 5 minutes
// (headersTimeout: 300000ms by default).
// The Mock BSE API intentionally delays its
// response by 15 minutes, so undici was killing
// the request long before the API responded,
// throwing the generic "TypeError: fetch failed"
// (real cause: HeadersTimeoutError, hidden in
// error.cause).
//
// This dedicated Agent disables undici's internal
// headers/body timeouts. The 20-minute
// AbortController below remains the only timeout.
// Using undici's fetch with its own Agent keeps both
// objects on the same undici version.
// ==========================================

const bseApiAgent = new Agent({
  headersTimeout: 0,
  bodyTimeout: 0,
});

const pullTradesFromBSE = async (io) => {
  try {
    console.log("Starting trade pull from Mock BSE API...");

    // Update pull status
    setPullStatus({
      status: "processing",
      startedAt: new Date(),
      completedAt: null,
      newTrades: 0,
      error: null,
    });

    // Notify connected dashboards
    io.emit("pullStatus", {
      status: "processing",
      message: "Trade pull is in progress",
    });

    // ==============================
    // FETCH FROM MOCK BSE API
    // ==============================

    const controller = new AbortController();

    // Allow backend to wait up to 20 minutes
    const timeout = setTimeout(() => {
      controller.abort();
    }, 20 * 60 * 1000);

    let response;

    try {
      response = await fetch(
        process.env.MOCK_BSE_API_URL,
        {
          signal: controller.signal,
          dispatcher: bseApiAgent,
        }
      );
    } finally {
      // Always clear timeout
      clearTimeout(timeout);
    }

    // Check API response
    if (!response.ok) {
      throw new Error(
        `Mock BSE API returned status: ${response.status}`
      );
    }

    const result = await response.json();

    const trades = result.data;

    console.log(
      `Received ${trades.length} trades from Mock BSE API`
    );

    // ==============================
    // PREPARE BULK OPERATIONS
    // ==============================

    const operations = trades.map((trade) => ({
      updateOne: {
        filter: {
          tradeId: trade.tradeId,
        },

        update: {
          $setOnInsert: trade,
        },

        upsert: true,
      },
    }));

    // ==============================
    // INSERT ONLY NEW TRADES
    // ==============================

    const bulkResult = await Trade.bulkWrite(
      operations,
      {
        ordered: false,
      }
    );

    const insertedCount =
      bulkResult.upsertedCount || 0;

    console.log(
      `New trades inserted: ${insertedCount}`
    );

    // ==============================
    // GET NEWLY INSERTED TRADES
    // ==============================

    const insertedTradeIds =
      Object.values(
        bulkResult.upsertedIds || {}
      );

    let newTrades = [];

    if (insertedTradeIds.length > 0) {
      newTrades = await Trade.find({
        _id: {
          $in: insertedTradeIds,
        },
      }).lean();
    }

    // ==============================
    // UPDATE PULL STATUS
    // ==============================

    setPullStatus({
      status: "completed",
      completedAt: new Date(),
      newTrades: insertedCount,
      error: null,
    });

    // ==============================
    // NOTIFY DASHBOARD
    // ==============================

    io.emit("tradesUpdated", {
      trades: newTrades,
      count: insertedCount,
    });

    io.emit("pullStatus", {
      status: "completed",
      message: "Trade pull completed successfully",
      newTrades: insertedCount,
    });

    return {
      success: true,
      count: insertedCount,
    };

  } catch (error) {
    console.error(
      "Trade pull failed:",
      error.message,
      // "fetch failed" hides the real reason in error.cause - log it too
      error.cause ? `\nRoot cause: ${error.cause}` : ""
    );

    setPullStatus({
      status: "failed",
      completedAt: new Date(),
      newTrades: 0,
      error: error.message,
    });

    io.emit("pullStatus", {
      status: "failed",
      message: "Trade pull failed",
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  pullTradesFromBSE,
};