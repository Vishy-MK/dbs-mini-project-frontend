"use client";

import { useState, type FormEvent } from "react";
import type { ChartOptions } from "chart.js";
import { useRouter } from "next/navigation";
import Panel from "./Panel";
import { deleteProduct, getProducts, getUsers } from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";
import { Bar, Doughnut } from "./Charts";

const FALLBACK_USERS: Array<{
  id: string;
  email: string;
  role: string;
  created_at: string;
}> = [
  {
    id: "u-1001",
    email: "buyer1@demo.local",
    role: "buyer",
    created_at: "2026-03-01T09:15:00.000Z",
  },
  {
    id: "u-1002",
    email: "buyer2@demo.local",
    role: "buyer",
    created_at: "2026-03-02T10:05:00.000Z",
  },
  {
    id: "u-1003",
    email: "buyer3@demo.local",
    role: "buyer",
    created_at: "2026-03-04T14:20:00.000Z",
  },
  {
    id: "u-2001",
    email: "seller1@demo.local",
    role: "seller",
    created_at: "2026-02-26T08:40:00.000Z",
  },
  {
    id: "u-2002",
    email: "seller2@demo.local",
    role: "seller",
    created_at: "2026-02-28T11:30:00.000Z",
  },
  {
    id: "u-2003",
    email: "seller3@demo.local",
    role: "seller",
    created_at: "2026-03-03T16:10:00.000Z",
  },
  {
    id: "u-3001",
    email: "admin@demo.local",
    role: "admin",
    created_at: "2026-02-20T07:55:00.000Z",
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [usersResults, setUsersResults] = useState(""); 
  const [productsResults, setProductsResults] = useState(""); 
  const [removeProductId, setRemoveProductId] = useState("");
  const [removeResults, setRemoveResults] = useState(""); 
  const [usersData, setUsersData] = useState<Array<{ role?: string }>>(
    FALLBACK_USERS
  );
  const [productsData, setProductsData] = useState<
    Array<{ category_id?: string | null }>
  >([]);
  const [usersList, setUsersList] = useState<
    Array<{ id: string; email: string; role: string; created_at: string }>
  >(FALLBACK_USERS);
  const [productsList, setProductsList] = useState<
    Array<{
      product_id: string;
      name: string;
      category_name?: string | null;
      seller_email?: string | null;
      base_price?: number | string;
      created_at?: string;
    }>
  >([]);

  const handleLoadUsers = async () => {
    if (!token) {
      setUsersResults("Missing token");
      return;
    }
    try {
      const data = await getUsers(token);
      const normalizedUsers = normalizeArray(data, ["users", "data"]);
      if (normalizedUsers.length) {
        setUsersData(normalizedUsers as Array<{ role?: string }>);
        setUsersList(
          normalizedUsers as Array<{
            id: string;
            email: string;
            role: string;
            created_at: string;
          }>
        );
        setUsersResults(`Loaded ${normalizedUsers.length} users.`);
        return;
      }
      setUsersResults("");
      setUsersData(FALLBACK_USERS);
      setUsersList(FALLBACK_USERS);
    } catch (error) {
      setUsersResults(formatError(error));
    }
  };

  const handleLoadProducts = async () => {
    try {
      const data = await getProducts({});
      const normalizedProducts = normalizeArray(data, ["products", "data"]);
      setProductsData(
        normalizedProducts as Array<{ category_id?: string | null }>
      );
      setProductsList(
        normalizedProducts as Array<{
          product_id: string;
          name: string;
          category_name?: string | null;
          seller_email?: string | null;
          base_price?: number | string;
          created_at?: string;
        }>
      );
      setProductsResults(
        normalizedProducts.length
          ? `Loaded ${normalizedProducts.length} products.`
          : "No products found."
      );
    } catch (error) {
      setProductsResults(formatError(error));
    }
  };

  const handleRemoveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setRemoveResults("Missing token");
      return;
    }
    const productId = parseUuid(removeProductId, "Product ID", setRemoveResults);
    if (!productId) {
      return;
    }
    try {
      await deleteProduct(productId, token);
      setRemoveResults("Product removed.");
      setProductsList((prev) => prev.filter((item) => item.product_id !== productId));
    } catch (error) {
      setRemoveResults(formatError(error));
    }
  };

  const roleCounts = buildRoleCounts(usersData);
  const userRoleData = {
    labels: ["Buyers", "Sellers", "Admins"],
    datasets: [
      {
        label: "Users",
        data: roleCounts,
        backgroundColor: ["#2e7bd4", "#0f6b6b", "#ff6a3d"],
        borderRadius: 10,
      },
    ],
  };

  const categorizedCount = productsData.filter((product) => product?.category_id)
    .length;
  const uncategorizedCount = Math.max(productsData.length - categorizedCount, 0);
  const listingMixData = {
    labels: ["Categorized", "Uncategorized"],
    datasets: [
      {
        data: [categorizedCount, uncategorizedCount],
        backgroundColor: ["#2e7bd4", "#f0b24d"],
        borderColor: "rgba(255, 255, 255, 0.6)",
        borderWidth: 1,
      },
    ],
  };

  if (!token || !user) {
    return (
      <div className="card field-grid">
        <div className="panel-header">
          <h2 className="panel-title font-display">Admin command center</h2>
          <p className="panel-desc">
            Create an admin profile to oversee users, listings, and policies.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={() => router.push("/login")}>
          Open admin console
        </button>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="card field-grid">
        <div className="panel-header">
          <h2 className="panel-title font-display">Switch to admin profile</h2>
          <p className="panel-desc">
            Use an admin profile to oversee users, listings, and policies.
          </p>
        </div>
        <button className="btn-ghost" type="button" onClick={() => router.push("/login")}>
          Switch profile
        </button>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="chart-grid">
        <section className="panel chart-panel">
          <div className="panel-header">
            <h3 className="panel-title font-display">User Roles</h3>
            <p className="panel-desc">Distribution of active accounts by role.</p>
          </div>
          <div className="chart-canvas">
            <Bar data={userRoleData} options={barOptions} />
          </div>
        </section>
        <section className="panel chart-panel">
          <div className="panel-header">
            <h3 className="panel-title font-display">Listing Mix</h3>
            <p className="panel-desc">Category coverage across listings.</p>
          </div>
          <div className="chart-canvas">
            <Doughnut data={listingMixData} options={doughnutOptions} />
          </div>
        </section>
      </div>
      <div className="panel-grid">
        <Panel
          title="User directory"
          description="Review all users and their roles."
          delay="0.1s"
        >
          <button className="btn-ghost" type="button" onClick={handleLoadUsers}>
            Load users
          </button>
          {usersResults ? <p className="helper-text">{usersResults}</p> : null}
          {usersList.length ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.slice(0, 10).map((row) => (
                    <tr key={row.id}>
                      <td>{row.email}</td>
                      <td>{row.role}</td>
                      <td>{formatDate(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {usersList.length > 10 ? (
            <p className="helper-text">
              Showing first 10 of {usersList.length} users.
            </p>
          ) : null}
        </Panel>

        <Panel
          title="Product monitor"
          description="Audit active listings and metadata."
          delay="0.2s"
        >
          <button className="btn-ghost" type="button" onClick={handleLoadProducts}>
            Load products
          </button>
          {productsResults ? <p className="helper-text">{productsResults}</p> : null}
          {productsList.length ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Seller</th>
                    <th>Category</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {productsList.slice(0, 10).map((product) => (
                    <tr key={product.product_id}>
                      <td>{product.name}</td>
                      <td>{product.seller_email || "-"}</td>
                      <td>{product.category_name || "-"}</td>
                      <td>{formatCurrency(product.base_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {productsList.length > 10 ? (
            <p className="helper-text">
              Showing first 10 of {productsList.length} products.
            </p>
          ) : null}
        </Panel>

        <Panel
          title="Remove listing"
          description="Permanently delete a listing."
          delay="0.3s"
        >
          <form className="field-grid" onSubmit={handleRemoveProduct}>
            <input
              className="input"
              value={removeProductId}
              onChange={(event) => setRemoveProductId(event.target.value)}
              placeholder="Product ID"
            />
            <button className="btn-ghost" type="submit">
              Remove product
            </button>
          </form>
          {removeResults ? <p className="helper-text">{removeResults}</p> : null}
        </Panel>
      </div>
    </div>
  );
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Request failed";
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

function formatCurrency(value?: number | string) {
  if (value === undefined || value === null) {
    return "-";
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return String(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numeric);
}

function parseUuid(
  value: string,
  label: string,
  setError: (message: string) => void
) {
  const trimmed = value.trim();
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmed)) {
    setError(`${label} must be a valid UUID`);
    return null;
  }
  return trimmed;
}

function normalizeArray(payload: unknown, keys: string[]) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of keys) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value;
      }
    }
  }
  return [];
}

function buildRoleCounts(users: Array<{ role?: string }>) {
  const counts = [0, 0, 0];
  users.forEach((user) => {
    if (user.role === "buyer") {
      counts[0] += 1;
    } else if (user.role === "seller") {
      counts[1] += 1;
    } else if (user.role === "admin") {
      counts[2] += 1;
    }
  });
  return counts;
}

const barOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#4f4a45",
        font: {
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: "rgba(20, 17, 15, 0.08)",
      },
      ticks: {
        color: "#4f4a45",
      },
    },
  },
};

const doughnutOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "58%",
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        color: "#4f4a45",
        padding: 12,
      },
    },
  },
};
