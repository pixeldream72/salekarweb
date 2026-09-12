function MainLayout({ title, navItems, children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label="SaleKar brand">
          <span className="brand-mark">S</span>
          <span>{title}</span>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="header-action" href="#login">
          Login
        </a>
      </header>

      <main className="page-shell">{children}</main>

      <footer className="footer">
        <div className="footer-inner">
          <span>© 2026 {title}</span>
          <span>Multi-tenant commerce starter</span>
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;
