"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "../../_components/TopNav";
import LogoutButton from "../../_components/LogoutButton";
import { deleteProduct, getProducts } from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type ProductRow = {
  product_id: string;
  name: string;
  base_price: number | string;
  category_name?: string | null;
  seller_email?: string | null;
  created_at: string;
};

type ProductsResponse = {
  products?: ProductRow[];
};

export default function AdminProductsPage() {
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    setStatus("");
    try {
      const data = (await getProducts({}, token || undefined)) as ProductsResponse;
      setProducts(data?.products || []);
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
    loadProducts();
  }, [token, user]);

  const handleDelete = async (productId: string) => {
    if (!token) {
      return;
    }
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) {
      return;
    }
    setStatus("");
    try {
      await deleteProduct(productId, token);
      setProducts((prev) => prev.filter((item) => item.product_id !== productId));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Delete failed");
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
              <span className="tag">Products</span>
              <h1 className="section-title font-display">Catalog Oversight</h1>
              <p className="section-subtitle">
                Review listings across all sellers.
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
              <button className="btn-ghost" type="button" onClick={loadProducts}>
                Refresh
              </button>
              {loading ? <span className="helper-text">Loading...</span> : null}
              {status ? <span className="helper-text">{status}</span> : null}
            </div>

            <div className="table-wrapper card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Seller</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length ? (
                    products.map((product) => (
                      <tr key={product.product_id}>
                        <td>{product.name}</td>
                        <td>{product.seller_email || "-"}</td>
                        <td>{product.category_name || "-"}</td>
                        <td>{formatCurrency(product.base_price)}</td>
                        <td>{formatDate(product.created_at)}</td>
                        <td>
                          <div className="table-actions">
                            <Link
                              className="btn-ghost"
                              href={`/products/${product.product_id}`}
                            >
                              View
                            </Link>
                            <button
                              className="btn-ghost"
                              type="button"
                              onClick={() => handleDelete(product.product_id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="helper-text">
                        No products found.
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

function formatCurrency(value?: number | string) {
  if (value === undefined || value === null) {
    return "-";
  }
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    return String(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numberValue);
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
