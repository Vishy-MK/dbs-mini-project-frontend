import TopNav from "../../_components/TopNav";
import SellerDashboard from "../../_components/SellerDashboard";
import LogoutButton from "../../_components/LogoutButton";

export default function SellerWorkspacePage() {
  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-3" />
      <main className="shell">
        <header className="section-header">
          <div className="section-header__row">
            <div>
              <span className="tag">Your Workspace</span>
              <h1 className="section-title font-display">Operations Hub</h1>
              <p className="section-subtitle">
                Add listings, track inventory, and fulfill orders.
              </p>
            </div>
            <LogoutButton />
          </div>
        </header>
        <SellerDashboard />
      </main>
    </div>
  );
}
