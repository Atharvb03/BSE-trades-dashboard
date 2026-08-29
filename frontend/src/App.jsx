import {
  useEffect,
  useState,
  useCallback,
} from "react";

import Header from "./components/Header";
import PullStatus from "./components/PullStatus";
import TradeFilters from "./components/TradeFilters";
import TradeTable from "./components/TradeTable";
import Pagination from "./components/Pagination";

import {
  getTrades,
  startTradePull,
  getPullStatus,
} from "./services/tradeApi";

import socket from "./services/socket";

import "./App.css";


function App() {
  // ==========================================
  // STATE
  // ==========================================

  const [trades, setTrades] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [pullStatus, setPullStatus] =
    useState("idle");

  const [newTrades, setNewTrades] =
    useState(0);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  // Pagination

  const [currentPage, setCurrentPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [totalTrades, setTotalTrades] =
    useState(0);

  // Filters

  const [search, setSearch] =
    useState("");

  const [symbol, setSymbol] =
    useState("");


  // ==========================================
  // FETCH TRADES
  // ==========================================

  const fetchTrades = useCallback(
    async (
      page = 1,
      searchValue = search,
      symbolValue = symbol
    ) => {
      try {
        setLoading(true);

        setError("");

        const result =
          await getTrades({
            page,
            limit: 20,
            search: searchValue,
            symbol: symbolValue,
            sortBy: "timestamp",
            order: "desc",
          });

        setTrades(
          result.data || []
        );

        setCurrentPage(
          result.pagination.currentPage
        );

        setTotalPages(
          result.pagination.totalPages
        );

        setTotalTrades(
          result.pagination.totalTrades
        );

        setLastUpdated(
          new Date()
        );

      } catch (error) {
        console.error(
          "Failed to fetch trades:",
          error
        );

        setError(
          "Unable to load trades. Please try again."
        );

      } finally {
        setLoading(false);
      }
    },
    [search, symbol]
  );


  // ==========================================
  // LOAD PULL STATUS
  // ==========================================

  const loadPullStatus =
    async () => {
      try {
        const result =
          await getPullStatus();

        setPullStatus(
          result.data.status
        );

        setNewTrades(
          result.data.newTrades || 0
        );

      } catch (error) {
        console.error(
          "Failed to load pull status:",
          error
        );
      }
    };


  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchTrades(1);

    loadPullStatus();
  }, []);


  // ==========================================
  // SOCKET.IO
  // ==========================================

  useEffect(() => {
    socket.connect();

    socket.on(
      "connect",
      () => {
        console.log(
          "Socket connected:",
          socket.id
        );
      }
    );

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket error:",
          error.message
        );
      }
    );


    // Pull status event

    socket.on(
      "pullStatus",
      (data) => {
        console.log(
          "Pull status:",
          data
        );

        setPullStatus(
          data.status
        );

        if (
          data.newTrades !== undefined
        ) {
          setNewTrades(
            data.newTrades
          );
        }

        if (
          data.status === "failed"
        ) {
          setError(
            data.error ||
            "Trade pull failed."
          );
        }
      }
    );


    // New trades event

    socket.on(
      "tradesUpdated",
      (data) => {
        console.log(
          "Trades updated:",
          data.count
        );

        setNewTrades(
          data.count
        );

        // Refresh dashboard only when
        // backend tells us new data is ready
        fetchTrades(
          currentPage
        );
      }
    );


    return () => {
      socket.off("connect");

      socket.off("connect_error");

      socket.off("pullStatus");

      socket.off("tradesUpdated");

      socket.disconnect();
    };
  }, []);


  // ==========================================
  // START TRADE PULL
  // ==========================================

  const handlePull =
    async () => {
      try {
        setError("");

        const result =
          await startTradePull();

        console.log(
          "Pull started:",
          result
        );

        setPullStatus(
          "processing"
        );

        setNewTrades(0);

      } catch (error) {
        console.error(
          "Failed to start pull:",
          error
        );

        if (
          error.response?.status ===
          409
        ) {
          setError(
            "A trade pull is already in progress."
          );
        } else {
          setError(
            "Unable to start trade pull."
          );
        }

        setPullStatus(
          "failed"
        );
      }
    };


  // ==========================================
  // SEARCH
  // ==========================================

  const handleSearch = () => {
    fetchTrades(
      1,
      search,
      symbol
    );
  };


  // ==========================================
  // PAGE CHANGE
  // ==========================================

  const handlePageChange = (
    page
  ) => {
    fetchTrades(page);
  };


  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="app">

      <Header />

      <main className="dashboard-container">

        {/* DASHBOARD SUMMARY */}

        <section className="dashboard-top">

          <div className="total-card">
            <span>
              Total Trades
            </span>

            <strong>
              {totalTrades.toLocaleString()}
            </strong>

            <small>
              Stored in database
            </small>
          </div>


          <PullStatus
            status={pullStatus}
            newTrades={newTrades}
          />


          <button
            className="pull-button"
            onClick={handlePull}
            disabled={
              pullStatus === "processing"
            }
          >
            {pullStatus === "processing"
              ? (
                <>
                  <span className="button-spinner" />
                  Pulling Trades...
                </>
              )
              : (
                <>
                  ↻ Pull Latest Trades
                </>
              )}
          </button>

        </section>


        {/* ERROR */}

        {error && (
          <div className="error-message">
            <span>
              ⚠
            </span>

            <div>
              {error}
            </div>

            <button
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>
          </div>
        )}


        {/* FILTERS */}

        <section className="filter-section">

          <TradeFilters
            search={search}
            setSearch={setSearch}
            symbol={symbol}
            setSymbol={setSymbol}
            onSearch={handleSearch}
          />

        </section>


        {/* TRADES */}

        <section className="trades-section">

          <div className="section-header">

            <div>
              <h2>
                Trade Records
              </h2>

              {lastUpdated && (
                <p className="last-updated">
                  Last updated{" "}
                  {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>

            <span className="record-count">
              {totalTrades.toLocaleString()} records
            </span>

          </div>


          {loading ? (

            <div className="loading">

              <div className="spinner large-spinner" />

              <p>
                Loading trades...
              </p>

            </div>

          ) : (

            <TradeTable
              trades={trades}
            />

          )}

        </section>


        {/* PAGINATION */}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={
            handlePageChange
          }
        />

      </main>

    </div>
  );
}

export default App;