import TopNav from "../../_components/TopNav";
import AdminDashboard from "../../_components/AdminDashboard";
import LogoutButton from "../../_components/LogoutButton";

export default function AdminDashboardPage() {
  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <main className="shell">
        <header className="section-header">
          <div className="section-header__row">
            <div>
              <span className="tag">Your Dashboard</span>
              <h1 className="section-title font-display">Operations Overview</h1>
              <p className="section-subtitle">
                Audit users, monitor listings, and enforce policies.
              </p>
            </div>
            <LogoutButton />
          </div>
        </header>
        <AdminDashboard />
      </main>
    </div>
  );
}
