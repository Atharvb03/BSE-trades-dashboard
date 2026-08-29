const TradeFilters = ({
  search,
  setSearch,
  symbol,
  setSymbol,
  onSearch,
}) => {
  return (
    <div className="filters">

      <div className="filter-group">

        <label>
          Search
        </label>

        <input
          type="text"
          placeholder="Search client or symbol..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch();
            }
          }}
        />

      </div>


      <div className="filter-group">

        <label>
          Symbol
        </label>

        <select
          value={symbol}
          onChange={(e) => {
            setSymbol(e.target.value);
          }}
        >
          <option value="">
            All Symbols
          </option>

          <option value="RELIANCE">
            RELIANCE
          </option>

          <option value="TCS">
            TCS
          </option>

          <option value="INFY">
            INFY
          </option>

          <option value="HDFC">
            HDFC
          </option>

          <option value="ICICI">
            ICICI
          </option>

        </select>

      </div>


      <button
        className="search-button"
        onClick={onSearch}
      >
        Search
      </button>

    </div>
  );
};

export default TradeFilters;