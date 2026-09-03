import TopNav from "../../_components/TopNav";
import BuyerDashboard from "../../_components/BuyerDashboard";
import LogoutButton from "../../_components/LogoutButton";

export default function BuyerWorkspacePage() {
  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <main className="shell">
        <header className="section-header">
          <div className="section-header__row">
            <div>
              <span className="tag">Your Workspace</span>
              <h1 className="section-title font-display">Command Center</h1>
              <p className="section-subtitle">
                Browse listings, manage wishlists, and place orders.
              </p>
            </div>
            <LogoutButton />
          </div>
        </header>
        <BuyerDashboard />
      </main>
    </div>
  );
}
