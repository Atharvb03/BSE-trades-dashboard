const TradeTable = ({ trades }) => {
  if (!trades.length) {
    return (
      <div className="empty-state">
        No trades found.
      </div>
    );
  }

  return (
    <div className="table-container">

      <table>

        <thead>
          <tr>
            <th>Trade ID</th>
            <th>Client</th>
            <th>Symbol</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Timestamp</th>
          </tr>
        </thead>

        <tbody>

          {trades.map((trade) => (
            <tr key={trade._id}>

              <td>
                {trade.tradeId}
              </td>

              <td>
                {trade.client}
              </td>

              <td>
                <span className="symbol-badge">
                  {trade.symbol}
                </span>
              </td>

              <td>
                {trade.quantity.toLocaleString()}
              </td>

              <td>
                ₹{Number(
                  trade.price
                ).toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </td>

              <td>
                {new Date(
                  trade.timestamp
                ).toLocaleString()}
              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
};

export default TradeTable;