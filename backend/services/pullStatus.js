let pullStatus = {
  status: "idle",
  startedAt: null,
  completedAt: null,
  newTrades: 0,
  error: null,
};

const getPullStatus = () => {
  return pullStatus;
};

const setPullStatus = (updates) => {
  pullStatus = {
    ...pullStatus,
    ...updates,
  };
};

module.exports = {
  getPullStatus,
  setPullStatus,
};