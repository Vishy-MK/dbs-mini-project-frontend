"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopNav from "../../../_components/TopNav";
import LogoutButton from "../../../_components/LogoutButton";
import { createProduct, getCategories } from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type Category = {
  category_id: string;
  name: string;
};

type CategoriesResponse = {
  categories?: Category[];
};

type ProductResponse = {
  product: {
    product_id: string;
  };
};

export default function SellerNewProductPage() {
  const router = useRouter();
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = (await getCategories()) as CategoriesResponse;
        setCategories(data?.categories || []);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Load failed");
      }
    };

    loadCategories();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    setStatus("");
    try {
      const data = (await createProduct(
        {
          name,
          description: description || undefined,
          base_price: Number(basePrice),
          category_id: categoryId || undefined,
        },
        token
      )) as ProductResponse;
      const createdId = data?.product?.product_id;
      if (createdId) {
        router.push(`/seller/products/${createdId}/edit`);
      } else {
        setStatus("Product created.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <main className="shell">
        <header className="section-header">
          <div className="section-header__row">
            <div>
              <span className="tag">New Product</span>
              <h1 className="section-title font-display">Create Listing</h1>
              <p className="section-subtitle">Add a new item to your catalog.</p>
            </div>
            <LogoutButton />
          </div>
        </header>

        {!user || !token ? (
          <div className="card field-grid">
            <div className="panel-header">
              <h2 className="panel-title font-display">Seller workspace</h2>
              <p className="panel-desc">
                Create a seller profile to publish listings, manage inventory, and
                fulfill orders.
              </p>
            </div>
            <Link className="btn-primary" href="/login">
              Start selling
            </Link>
          </div>
        ) : null}

        {user && user.role !== "seller" ? (
          <div className="card field-grid">
            <div className="panel-header">
              <h2 className="panel-title font-display">Switch to seller profile</h2>
              <p className="panel-desc">
                Use a seller profile to manage listings, inventory, and orders.
              </p>
            </div>
            <Link className="btn-ghost" href="/login">
              Switch profile
            </Link>
          </div>
        ) : null}

        {user && user.role === "seller" ? (
          <section className="panel">
            <div className="panel-header">
              <h3 className="panel-title font-display">Product basics</h3>
              <p className="panel-desc">Define the core listing details.</p>
            </div>
            <form className="field-grid" onSubmit={handleSubmit}>
              <input
                className="input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Product name"
                required
              />
              <textarea
                className="input textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Description"
                rows={4}
              />
              <input
                className="input"
                type="number"
                value={basePrice}
                onChange={(event) => setBasePrice(event.target.value)}
                placeholder="Base price"
                min="0"
                step="0.01"
                required
              />
              <select
                className="input"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">Select category (optional)</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="toolbar">
                <button className="btn-primary" type="submit">
                  Create product
                </button>
                <Link className="btn-ghost" href="/seller/products">
                  Back to products
                </Link>
              </div>
              {status ? <p className="helper-text">{status}</p> : null}
            </form>
          </section>
        ) : null}
      </main>
    </div>
  );
}
