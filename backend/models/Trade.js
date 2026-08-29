const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema(
  {
    tradeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    client: {
      type: String,
      required: true,
      index: true,
    },

    symbol: {
      type: String,
      required: true,
      index: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Trade = mongoose.model("Trade", tradeSchema);

module.exports = Trade;