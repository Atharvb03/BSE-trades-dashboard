const Header = () => {
  return (
    <header className="dashboard-header">
      <div className="header-content">

        <div className="brand">
          <div className="brand-icon">
            B
          </div>

          <div>
            <h1>
              BSE Trades Dashboard
            </h1>

            <p>
              Real-time trade monitoring system
            </p>
          </div>
        </div>

        <div className="header-live">
          <span className="live-dot" />

          <span>
            Live
          </span>
        </div>

      </div>
    </header>
  );
};

export default Header;