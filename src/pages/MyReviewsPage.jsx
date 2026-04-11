import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useStorefrontSettings } from "../context/StorefrontSettingsContext";
import { getApiErrorMessage } from "../services/apiClient";
import { getMyReviewItemsApi } from "../services/reviewService";

const ORDER_ITEM_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#f1f5f9"/><rect x="16" y="18" width="48" height="34" rx="4" fill="#cbd5e1"/><circle cx="30" cy="30" r="5" fill="#94a3b8"/><path d="M20 48l10-10 9 9 7-7 14 14H20z" fill="#e2e8f0"/><rect x="20" y="57" width="40" height="6" rx="3" fill="#cbd5e1"/></svg>'
  );

const resolveItemImage = (image) => {
  const value = String(image || "").trim();
  return value || ORDER_ITEM_PLACEHOLDER;
};

function MyReviewsPage() {
  const { formatMoney } = useStorefrontSettings();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const payload = await getMyReviewItemsApi();
        const nextItems = Array.isArray(payload?.items) ? payload.items : [];
        setItems(
          nextItems.filter(
            (item) => String(item.orderStatus || "").toLowerCase() === "delivered"
          )
        );
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const summary = useMemo(() => {
    const reviewed = items.filter((item) => item.reviewed).length;
    const pending = items.length - reviewed;
    return { reviewed, pending };
  }, [items]);

  if (loading) {
    return <section className="container-pad py-10 text-sm text-muted">Loading your review items...</section>;
  }

  return (
    <section className="container-pad py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">My Reviews</p>
          <h1 className="font-display text-3xl font-bold text-ink">Delivered Products For Review</h1>
          <p className="mt-1 text-sm text-muted">Review products from your delivered orders only.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/account" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-ink">Back to Account</Link>
          <Link to="/orders" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-ink">Back to My Orders</Link>
        </div>
      </div>

      {!items.length ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-ink">No delivered products available for review yet.</p>
          <p className="mt-1 text-sm text-muted">Once your orders are marked delivered, your review items will appear here.</p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm"><p className="text-muted">Delivered Items</p><p className="mt-1 text-xl font-bold text-ink">{items.length}</p></div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm"><p className="text-emerald-700">Reviewed</p><p className="mt-1 text-xl font-bold text-emerald-800">{summary.reviewed}</p></div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><p className="text-amber-700">Not Reviewed</p><p className="mt-1 text-xl font-bold text-amber-800">{summary.pending}</p></div>
          </div>

          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <article key={`${item.orderId}-${item.productId}`} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
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
                      <p className="text-xs text-muted">Order: #{String(item.orderId || "").slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-muted">Qty: {Number(item.quantity || 0)} | Price: {formatMoney(Number(item.price || 0))}</p>
                      <p className="text-xs text-muted">Subtotal: {formatMoney(Number(item.lineSubtotal || 0))}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Delivered</span>
                    {item.reviewed ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Reviewed</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Not Reviewed</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!item.reviewed ? (
                    <Link
                      to={`/review?orderId=${encodeURIComponent(item.orderId)}&productId=${encodeURIComponent(item.productId)}`}
                      className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white"
                    >
                      Write Review
                    </Link>
                  ) : (
                    <Link
                      to={`/review?orderId=${encodeURIComponent(item.orderId)}&productId=${encodeURIComponent(item.productId)}`}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-ink"
                    >
                      View Review
                    </Link>
                  )}
                  <Link
                    to={`/product/${encodeURIComponent(item.productId)}`}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-ink"
                  >
                    View Product
                  </Link>
                  <Link
                    to={`/order-confirmation/${encodeURIComponent(item.orderId)}`}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-ink"
                  >
                    View Order
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default MyReviewsPage;
