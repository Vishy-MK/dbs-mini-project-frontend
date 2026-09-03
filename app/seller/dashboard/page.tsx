import TopNav from "../../_components/TopNav";
import SellerDashboardView from "../../_components/SellerDashboardView";
import LogoutButton from "../../_components/LogoutButton";

export default function SellerDashboardPage() {
  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-3" />
      <main className="shell">
        <header className="section-header">
          <div className="section-header__row">
            <div>
              <span className="tag">Your Dashboard</span>
              <h1 className="section-title font-display">Performance Overview</h1>
              <p className="section-subtitle">
                Review revenue, listing activity, and fulfillment status.
              </p>
            </div>
            <LogoutButton />
          </div>
        </header>
        <SellerDashboardView />
      </main>
    </div>
  );
}
