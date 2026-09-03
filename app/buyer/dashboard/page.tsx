import TopNav from "../../_components/TopNav";
import BuyerDashboardView from "../../_components/BuyerDashboardView";
import LogoutButton from "../../_components/LogoutButton";

export default function BuyerDashboardPage() {
  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <main className="shell">
        <header className="section-header">
          <div className="section-header__row">
            <div>
              <span className="tag">Your Dashboard</span>
              <h1 className="section-title font-display">Overview</h1>
              <p className="section-subtitle">
                Track orders, wishlist activity, and pending reviews.
              </p>
            </div>
            <LogoutButton />
          </div>
        </header>
        <BuyerDashboardView />
      </main>
    </div>
  );
}
