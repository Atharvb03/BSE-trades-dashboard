const Trade = require("../models/Trade");

const {
  pullTradesFromBSE,
} = require("../services/tradePullService");

const {
  getPullStatus,
} = require("../services/pullStatus");


// ==========================================
// GET /api/trades
// ==========================================

const getTrades = async (req, res) => {
  try {
    const page = Math.max(
      parseInt(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit) || 20,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    const search =
      req.query.search?.trim();

    const symbol =
      req.query.symbol?.trim();

    const sortBy =
      req.query.sortBy || "timestamp";

    const order =
      req.query.order === "asc"
        ? 1
        : -1;

    const allowedSortFields = [
      "timestamp",
      "price",
      "quantity",
      "client",
      "symbol",
    ];

    const finalSortBy =
      allowedSortFields.includes(sortBy)
        ? sortBy
        : "timestamp";

    const query = {};

    // Search
    if (search) {
      query.$or = [
        {
          client: {
            $regex: search,
            $options: "i",
          },
        },
        {
          symbol: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Symbol filter
    if (symbol) {
      query.symbol =
        symbol.toUpperCase();
    }

    // Count trades
    const totalTrades =
      await Trade.countDocuments(query);

    // Get trades
    const trades =
      await Trade.find(query)
        .sort({
          [finalSortBy]: order,
        })
        .skip(skip)
        .limit(limit)
        .lean();

    const totalPages =
      Math.ceil(
        totalTrades / limit
      );

    res.status(200).json({
      success: true,

      data: trades,

      pagination: {
        currentPage: page,
        totalPages,
        totalTrades,
        limit,
        hasNextPage:
          page < totalPages,
        hasPreviousPage:
          page > 1,
      },

      filters: {
        search: search || null,
        symbol: symbol || null,
        sortBy: finalSortBy,
        order:
          order === 1
            ? "asc"
            : "desc",
      },
    });
  } catch (error) {
    console.error(
      "Error fetching trades:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch trades",
    });
  }
};


// ==========================================
// POST /api/trades/pull
// ==========================================

const startTradePull = async (
  req,
  res
) => {
  try {
    const currentStatus =
      getPullStatus();

    // Prevent duplicate pull
    if (
      currentStatus.status ===
      "processing"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A trade pull is already in progress",
        status: "processing",
      });
    }

    // Get Socket.IO instance
    const io =
      req.app.get("io");

    // Start background process
    // DO NOT await this
    pullTradesFromBSE(io);

    // Respond immediately
    res.status(202).json({
      success: true,
      message:
        "Trade pull started successfully",
      status: "processing",
    });
  } catch (error) {
    console.error(
      "Error starting trade pull:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to start trade pull",
    });
  }
};


// ==========================================
// GET /api/trades/status
// ==========================================

const getTradePullStatus = (
  req,
  res
) => {
  res.status(200).json({
    success: true,
    data: getPullStatus(),
  });
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  getTrades,
  startTradePull,
  getTradePullStatus,
};