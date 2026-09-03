"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../_components/TopNav";
import LogoutButton from "../../_components/LogoutButton";
import { getUsers, updateUserRole } from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type UserRow = {
  id: string;
  email: string;
  role: "buyer" | "seller" | "admin";
  created_at: string;
};

type UsersResponse = {
  users?: UserRow[];
};

export default function AdminUsersPage() {
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const data = (await getUsers(token)) as UsersResponse;
      setUsers(data?.users || []);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !user || user.role !== "admin") {
      return;
    }
    loadUsers();
  }, [token, user]);

  const handleRoleChange = async (userId: string, role: UserRow["role"]) => {
    if (!token) {
      return;
    }
    setStatus("");
    try {
      const data = (await updateUserRole(userId, role, token)) as {
        user?: UserRow;
      };
      if (data?.user) {
        setUsers((prev) =>
          prev.map((row) => (row.id === userId ? data.user! : row))
        );
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Update failed");
    }
  };

  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <main className="shell">
        <header className="section-header">
          <div className="section-header__row">
            <div>
              <span className="tag">Users</span>
              <h1 className="section-title font-display">User Directory</h1>
              <p className="section-subtitle">
                Update roles and audit accounts.
              </p>
            </div>
            <LogoutButton />
          </div>
        </header>

        {!user || !token ? (
          <div className="card field-grid">
            <div className="panel-header">
              <h2 className="panel-title font-display">Admin command center</h2>
              <p className="panel-desc">
                Create an admin profile to oversee users, listings, and policies.
              </p>
            </div>
            <Link className="btn-primary" href="/login">
              Open admin console
            </Link>
          </div>
        ) : null}

        {user && user.role !== "admin" ? (
          <div className="card field-grid">
            <div className="panel-header">
              <h2 className="panel-title font-display">Switch to admin profile</h2>
              <p className="panel-desc">
                Use an admin profile to oversee users, listings, and policies.
              </p>
            </div>
            <Link className="btn-ghost" href="/login">
              Switch profile
            </Link>
          </div>
        ) : null}

        {user && user.role === "admin" ? (
          <div className="stack">
            <div className="toolbar">
              <button className="btn-ghost" type="button" onClick={loadUsers}>
                Refresh
              </button>
              {loading ? <span className="helper-text">Loading...</span> : null}
              {status ? <span className="helper-text">{status}</span> : null}
            </div>

            <div className="table-wrapper card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length ? (
                    users.map((row) => (
                      <tr key={row.id}>
                        <td>{row.email}</td>
                        <td>
                          <select
                            className="input"
                            value={row.role}
                            onChange={(event) =>
                              handleRoleChange(
                                row.id,
                                event.target.value as UserRow["role"]
                              )
                            }
                          >
                            <option value="buyer">buyer</option>
                            <option value="seller">seller</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td>{formatDate(row.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="helper-text">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
