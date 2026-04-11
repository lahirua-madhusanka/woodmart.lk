import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import StarRating from "../components/common/StarRating";
import { useStorefrontSettings } from "../context/StorefrontSettingsContext";
import { getApiErrorMessage } from "../services/apiClient";
import {
  getOrderReviewItemsApi,
  submitOrderProductReviewApi,
} from "../services/reviewService";

const ORDER_ITEM_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#f1f5f9"/><rect x="16" y="18" width="48" height="34" rx="4" fill="#cbd5e1"/><circle cx="30" cy="30" r="5" fill="#94a3b8"/><path d="M20 48l10-10 9 9 7-7 14 14H20z" fill="#e2e8f0"/><rect x="20" y="57" width="40" height="6" rx="3" fill="#cbd5e1"/></svg>'
  );

const resolveItemImage = (image) => {
  const value = String(image || "").trim();
  return value || ORDER_ITEM_PLACEHOLDER;
};

function ReviewPage() {
  const [searchParams] = useSearchParams();
  const orderId = String(searchParams.get("orderId") || "").trim();
  const selectedProductId = String(searchParams.get("productId") || "").trim();
  const { formatMoney } = useStorefrontSettings();

  const [loading, setLoading] = useState(true);
  const [submittingProductId, setSubmittingProductId] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [items, setItems] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});

  useEffect(() => {
    const loadReviewItems = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const payload = await getOrderReviewItemsApi(orderId);
        const nextItems = Array.isArray(payload?.items) ? payload.items : [];
        setOrderStatus(payload?.orderStatus || "");
        setItems(nextItems);

        const nextDrafts = {};
        for (const item of nextItems) {
          if (item.reviewed) {
            continue;
          }
          nextDrafts[item.productId] = {
            rating: 0,
            comment: "",
          };
        }
        setReviewDrafts(nextDrafts);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    loadReviewItems();
  }, [orderId]);

  const pendingCount = useMemo(
    () => items.filter((item) => !item.reviewed).length,
    [items]
  );

  const visibleItems = useMemo(() => {
    if (!selectedProductId) {
      return items;
    }
    return items.filter((item) => String(item.productId) === selectedProductId);
  }, [items, selectedProductId]);

  const onChangeRating = (productId, rating) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [productId]: {
        rating,
        comment: prev[productId]?.comment || "",
      },
    }));
  };

  const onChangeComment = (productId, comment) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [productId]: {
        rating: Number(prev[productId]?.rating || 0),
        comment,
      },
    }));
  };

  const submitReview = async (item) => {
    const draft = reviewDrafts[item.productId] || { rating: 0, comment: "" };

    if (Number(draft.rating || 0) < 1 || Number(draft.rating || 0) > 5) {
      toast.error("Please select a rating");
      return;
    }

    if (!String(draft.comment || "").trim()) {
      toast.error("Please write a review comment");
      return;
    }

    setSubmittingProductId(item.productId);

    try {
      await submitOrderProductReviewApi({
        orderId,
        productId: item.productId,
        rating: Number(draft.rating),
        comment: String(draft.comment).trim(),
      });

      setItems((prev) =>
        prev.map((entry) =>
          entry.productId === item.productId
            ? {
                ...entry,
                reviewed: true,
                review: {
                  rating: Number(draft.rating),
                  comment: String(draft.comment).trim(),
                },
              }
            : entry
        )
      );

      setReviewDrafts((prev) => {
        const next = { ...prev };
        delete next[item.productId];
        return next;
      });

      toast.success("Review submitted successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmittingProductId("");
    }
  };

  if (loading) {
    return <section className="container-pad py-10 text-sm text-muted">Loading review items...</section>;
  }

  if (!orderId) {
    return (
      <section className="container-pad py-10">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted">
          Missing order id. Open this page from your delivered order.
        </div>
      </section>
    );
  }

  if (!items.length || !visibleItems.length) {
    return (
      <section className="container-pad py-10">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted">
          No reviewable products found for this order.
        </div>
      </section>
    );
  }

  const delivered = String(orderStatus || "").toLowerCase() === "delivered";

  return (
    <section className="container-pad py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">Product Reviews</p>
          <h1 className="font-display text-3xl font-bold text-ink">Review Your Delivered Items</h1>
          <p className="mt-1 text-sm text-muted">Order: #{orderId.slice(-8).toUpperCase()}</p>
        </div>
        <Link to="/orders" className="text-sm font-semibold text-brand">Back to Orders</Link>
      </div>

      {!delivered ? (
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Reviews are available only after delivery.
        </div>
      ) : null}

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-muted">
        {pendingCount > 0
          ? `${pendingCount} product${pendingCount > 1 ? "s" : ""} pending review`
          : "All products in this order are reviewed"}
      </div>

      <div className="mt-6 space-y-4">
        {visibleItems.map((item) => {
          const draft = reviewDrafts[item.productId] || { rating: 0, comment: "" };
          const disabled = !delivered || item.reviewed;

          return (
            <article key={item.productId} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <img
                    src={resolveItemImage(item.image)}
                    alt={item.name || "Product"}
                    className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover"
                    onError={(event) => {
                      event.currentTarget.src = ORDER_ITEM_PLACEHOLDER;
                    }}
                  />
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-ink">{item.name}</h2>
                    <p className="text-xs text-muted">Qty: {item.quantity}</p>
                    <p className="text-xs text-muted">Price: {formatMoney(item.price)}</p>
                    <p className="text-xs text-muted">Subtotal: {formatMoney(item.lineSubtotal)}</p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-ink">{formatMoney(item.lineTotal)}</div>
              </div>

              {item.reviewed ? (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-sm font-semibold text-emerald-700">Reviewed</p>
                  <div className="mt-1">
                    <StarRating
                      value={Number(item.review?.rating || 0)}
                      readOnly
                      size={18}
                      className="text-emerald-800"
                    />
                  </div>
                  <p className="mt-1 text-xs text-emerald-900">{item.review?.comment || "Your review was submitted."}</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <StarRating
                    value={draft.rating}
                    onChange={(nextRating) => onChangeRating(item.productId, nextRating)}
                    disabled={disabled || submittingProductId === item.productId}
                    size={24}
                  />
                  <textarea
                    value={draft.comment}
                    onChange={(event) => onChangeComment(item.productId, event.target.value)}
                    disabled={disabled}
                    placeholder="Share your experience with this product"
                    className="min-h-[96px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand/30 focus:ring"
                  />
                  <button
                    type="button"
                    disabled={disabled || submittingProductId === item.productId}
                    onClick={() => submitReview(item)}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingProductId === item.productId ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ReviewPage;
