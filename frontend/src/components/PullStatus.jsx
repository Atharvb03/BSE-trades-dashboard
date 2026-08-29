const PullStatus = ({
  status,
  newTrades,
}) => {
  const statusConfig = {
    idle: {
      label: "Ready",
      className: "status-idle",
      description: "Ready to pull latest trades",
    },

    processing: {
      label: "Pull in Progress",
      className: "status-processing",
      description: "Fetching trade data from BSE",
    },

    completed: {
      label: "Completed",
      className: "status-completed",
      description: "Latest trade pull completed successfully",
    },

    failed: {
      label: "Failed",
      className: "status-failed",
      description: "Trade pull could not be completed",
    },
  };

  const currentStatus =
    statusConfig[status] ||
    statusConfig.idle;

  return (
    <div className="status-card">
      <div className="status-content">
        <span className="status-label">
          Pull Status
        </span>

        <div className="status-row">
          <span
            className={`status-dot ${currentStatus.className}`}
          />

          <h3>
            {currentStatus.label}
          </h3>
        </div>

        <p>
          {currentStatus.description}
        </p>
      </div>

      {status === "processing" && (
        <div className="spinner" />
      )}

      {status === "completed" &&
        newTrades > 0 && (
          <div className="new-trades-badge">
            +{newTrades.toLocaleString()}
          </div>
        )}
    </div>
  );
};

export default PullStatus;