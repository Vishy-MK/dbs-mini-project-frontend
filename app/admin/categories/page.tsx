"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import TopNav from "../../_components/TopNav";
import LogoutButton from "../../_components/LogoutButton";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type Category = {
  category_id: string;
  name: string;
  parent_id: string | null;
};

type CategoriesResponse = {
  categories?: Category[];
};

export default function AdminCategoriesPage() {
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState("");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [status, setStatus] = useState("");

  const loadCategories = async () => {
    setStatus("");
    try {
      const data = (await getCategories()) as CategoriesResponse;
      setCategories(data?.categories || []);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed");
    }
  };

  useEffect(() => {
    if (!token || !user || user.role !== "admin") {
      return;
    }
    loadCategories();
  }, [token, user]);

  const resetForm = () => {
    setEditingId("");
    setName("");
    setParentId("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    setStatus("");
    try {
      if (editingId) {
        await updateCategory(
          editingId,
          { name, parent_id: parentId || null },
          token
        );
      } else {
        await createCategory({ name, parent_id: parentId || null }, token);
      }
      resetForm();
      await loadCategories();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.category_id);
    setName(category.name || "");
    setParentId(category.parent_id || "");
    setStatus("Editing category. Submit to save changes.");
  };

  const handleDelete = async (categoryId: string) => {
    if (!token) {
      return;
    }
    const confirmed = window.confirm("Delete this category?");
    if (!confirmed) {
      return;
    }
    setStatus("");
    try {
      await deleteCategory(categoryId, token);
      setCategories((prev) => prev.filter((item) => item.category_id !== categoryId));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const parentLookup = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      map.set(category.category_id, category.name);
    });
    return map;
  }, [categories]);

  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <main className="shell">
        <header className="section-header">
          <div className="section-header__row">
            <div>
              <span className="tag">Categories</span>
              <h1 className="section-title font-display">Taxonomy Manager</h1>
              <p className="section-subtitle">
                Organize listings with clear categories.
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
            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">
                  {editingId ? "Edit category" : "Create category"}
                </h3>
                <p className="panel-desc">Add or update a category.</p>
              </div>
              <form className="field-grid" onSubmit={handleSubmit}>
                <input
                  className="input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Category name"
                  required
                />
                <select
                  className="input"
                  value={parentId}
                  onChange={(event) => setParentId(event.target.value)}
                >
                  <option value="">No parent</option>
                  {categories
                    .filter((category) => category.category_id !== editingId)
                    .map((category) => (
                      <option key={category.category_id} value={category.category_id}>
                        {category.name}
                      </option>
                    ))}
                </select>
                <div className="toolbar">
                  <button className="btn-primary" type="submit">
                    {editingId ? "Save category" : "Create category"}
                  </button>
                  {editingId ? (
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => {
                        resetForm();
                        setStatus("");
                      }}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
                {status ? <p className="helper-text">{status}</p> : null}
              </form>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">All categories</h3>
                <p className="panel-desc">Review the current taxonomy.</p>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Parent</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length ? (
                      categories.map((category) => (
                        <tr key={category.category_id}>
                          <td>{category.name}</td>
                          <td>
                            {category.parent_id
                              ? parentLookup.get(category.parent_id) || category.parent_id
                              : "-"}
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-ghost"
                                type="button"
                                onClick={() => handleEdit(category)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn-ghost"
                                type="button"
                                onClick={() => handleDelete(category.category_id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="helper-text">
                          No categories found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
