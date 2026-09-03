"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import TopNav from "../../_components/TopNav";
import LogoutButton from "../../_components/LogoutButton";
import { createReview, getMyReviews, getPendingReviews } from "@/lib/api";
import { useStoredToken } from "@/lib/useStoredToken";
import { useStoredUser } from "@/lib/useStoredUser";

type Review = {
  review_id: string;
  product_id: string;
  rating: number | string;
  comment: string | null;
  created_at: string;
  product_name: string;
};

type PendingReview = {
  product_id: string;
  product_name: string;
  last_ordered_at: string;
};

type ReviewsResponse = {
  reviews?: Review[];
};

type PendingResponse = {
  pending?: PendingReview[];
};

export default function BuyerReviewsPage() {
  const { token } = useStoredToken();
  const { user } = useStoredUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pending, setPending] = useState<PendingReview[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");

  const loadReviews = async () => {
    if (!token) {
      return;
    }
    setStatus("");
    try {
      const [pendingData, reviewsData] = await Promise.all([
        getPendingReviews(token) as Promise<PendingResponse>,
        getMyReviews(token) as Promise<ReviewsResponse>,
      ]);
      setPending(pendingData?.pending || []);
      setReviews(reviewsData?.reviews || []);
      if (!selectedProductId && pendingData?.pending?.length) {
        setSelectedProductId(pendingData.pending[0].product_id);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed");
    }
  };

  useEffect(() => {
    if (!token || !user || user.role !== "buyer") {
      return;
    }
    loadReviews();
  }, [token, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !selectedProductId) {
      return;
    }
    setStatus("");
    try {
      await createReview(selectedProductId, Number(rating), comment, token);
      setComment("");
      await loadReviews();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    }
  };

  const selectedProduct = pending.find(
    (item) => item.product_id === selectedProductId
  );

  return (
    <div className="relative">
      <TopNav />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <main className="shell">
        <header className="section-header">
          <div className="section-header__row">
            <div>
              <span className="tag">Reviews</span>
              <h1 className="section-title font-display">Your Feedback</h1>
              <p className="section-subtitle">
                Share thoughts on products you have ordered.
              </p>
            </div>
            <LogoutButton />
          </div>
        </header>

        {!user || !token ? (
          <div className="card field-grid">
            <div className="panel-header">
              <h2 className="panel-title font-display">Buyer workspace</h2>
              <p className="panel-desc">
                Build a buyer profile to save favorites, track orders, and set alerts.
              </p>
            </div>
            <Link className="btn-primary" href="/login">
              Become a buyer
            </Link>
          </div>
        ) : null}

        {user && user.role !== "buyer" ? (
          <div className="card field-grid">
            <div className="panel-header">
              <h2 className="panel-title font-display">Switch to buyer profile</h2>
              <p className="panel-desc">
                Use a buyer profile to manage orders, alerts, and reviews.
              </p>
            </div>
            <Link className="btn-ghost" href="/login">
              Switch profile
            </Link>
          </div>
        ) : null}

        {user && user.role === "buyer" ? (
          <div className="stack">
            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Write a review</h3>
                <p className="panel-desc">
                  Pick a recent purchase and rate it.
                </p>
              </div>
              {pending.length ? (
                <form className="field-grid" onSubmit={handleSubmit}>
                  <label className="field">
                    <span className="field-label">Product</span>
                    <select
                      className="input"
                      value={selectedProductId}
                      onChange={(event) => setSelectedProductId(event.target.value)}
                    >
                      {pending.map((item) => (
                        <option key={item.product_id} value={item.product_id}>
                          {item.product_name}
                        </option>
                      ))}
                    </select>
                    {selectedProduct ? (
                      <span className="helper-text">
                        Last ordered {formatDate(selectedProduct.last_ordered_at)}
                      </span>
                    ) : null}
                  </label>
                  <label className="field">
                    <span className="field-label">Rating</span>
                    <select
                      className="input"
                      value={rating}
                      onChange={(event) => setRating(event.target.value)}
                    >
                      {Array.from({ length: 5 }, (_, index) => 5 - index).map(
                        (value) => (
                          <option key={value} value={value}>
                            {value} stars
                          </option>
                        )
                      )}
                    </select>
                  </label>
                  <label className="field">
                    <span className="field-label">Comments</span>
                    <textarea
                      className="input textarea"
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Share what you loved."
                      rows={4}
                    />
                  </label>
                  <div className="toolbar">
                    <button className="btn-primary" type="submit">
                      Submit review
                    </button>
                    {status ? <span className="helper-text">{status}</span> : null}
                  </div>
                </form>
              ) : (
                <p className="helper-text">
                  You are all caught up. New purchases will appear here.
                </p>
              )}
            </section>

            <section className="panel">
              <div className="panel-header">
                <h3 className="panel-title font-display">Past reviews</h3>
                <p className="panel-desc">Your submitted feedback.</p>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.length ? (
                      reviews.map((review) => (
                        <tr key={review.review_id}>
                          <td>
                            <Link href={`/products/${review.product_id}`}>
                              {review.product_name}
                            </Link>
                          </td>
                          <td>{review.rating}</td>
                          <td>{review.comment || "-"}</td>
                          <td>{formatDate(review.created_at)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="helper-text">
                          No reviews yet.
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
