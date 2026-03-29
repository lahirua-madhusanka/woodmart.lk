import { Heart, Minus, Plus, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import ProductGrid from "../components/products/ProductGrid";
import { useStore } from "../context/StoreContext";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { addProductReviewApi } from "../services/productService";

function ProductDetailsPage() {
  const { id } = useParams();
  const { getProductId, loadingProducts, products } = useStore();
  const { isAuthenticated } = useAuth();
  const product = products.find((item) => getProductId(item) === String(id));
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const { addToCart, toggleWishlist, wishlist } = useStore();

  const gallery = product?.images || product?.gallery || [];
  const productId = product ? getProductId(product) : "";

  useEffect(() => {
    if (gallery.length) {
      setSelectedImage(gallery[0]);
    }
  }, [gallery, productId]);

  const related = useMemo(() => {
    if (!product) return [];
    return products
      .filter(
        (item) =>
          item.category === product.category && getProductId(item) !== getProductId(product)
      )
      .slice(0, 3);
  }, [getProductId, product, products]);

  if (loadingProducts) {
    return (
      <section className="container-pad py-16 text-muted">Loading product...</section>
    );
  }

  if (!product) {
    return (
      <section className="container-pad py-16">
        <h1 className="font-display text-3xl font-bold">Product not found</h1>
        <Link to="/shop" className="mt-5 inline-flex text-brand">
          Return to shop
        </Link>
      </section>
    );
  }

  const inWishlist = wishlist.includes(productId);
  const unitPrice = Number(product.discountPrice || product.price || 0);

  const onSubmitReview = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      toast.info("Please sign in to review this product");
      return;
    }
    try {
      await addProductReviewApi(productId, review);
      toast.success("Review submitted");
      setReview({ rating: 5, comment: "" });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <section className="container-pad py-10">
      <div className="mb-6 text-sm text-muted">
        <Link to="/" className="hover:text-brand">Home</Link> / <Link to="/shop" className="hover:text-brand">Shop</Link> / {product.name}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <img src={selectedImage} alt={product.name} className="h-[500px] w-full object-cover" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {gallery.map((image) => (
              <button
                key={image}
                onClick={() => setSelectedImage(image)}
                className={`overflow-hidden rounded-lg border ${
                  image === selectedImage ? "border-brand" : "border-slate-200"
                }`}
              >
                <img src={image} alt={product.name} className="h-24 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            {product.category}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-amber-500">
            <Star size={16} fill="currentColor" />
            <span className="font-semibold text-ink">{product.rating}</span>
            <span className="text-sm text-muted">(118 reviews)</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-3xl font-bold text-brand-dark">Rs. {unitPrice}</span>
            {product.discountPrice && (
              <span className="text-lg text-muted line-through">Rs. {product.price}</span>
            )}
            {!product.discountPrice && product.oldPrice && (
              <span className="text-lg text-muted line-through">Rs. {product.oldPrice}</span>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-muted">{product.description}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white">
              <button
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="p-3"
              >
                <Minus size={16} />
              </button>
              <span className="px-4 text-sm font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((value) => value + 1)}
                className="p-3"
              >
                <Plus size={16} />
              </button>
            </div>

            <button onClick={() => addToCart(productId, quantity)} className="btn-primary">
              Add to Cart
            </button>

            <button
              onClick={() => toggleWishlist(productId)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${
                inWishlist
                  ? "border-brand bg-brand text-white"
                  : "border-slate-300 text-slate-700 hover:border-brand hover:text-brand"
              }`}
            >
              <Heart size={16} /> Add to Wishlist
            </button>
          </div>

          <div className="mt-8 space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <p><span className="font-semibold">SKU:</span> {product.sku}</p>
            <p><span className="font-semibold">Category:</span> {product.category}</p>
            <p><span className="font-semibold">Tags:</span> {product.tags.join(", ")}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab("description")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              activeTab === "description"
                ? "bg-brand text-white"
                : "text-muted hover:bg-slate-100"
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              activeTab === "reviews"
                ? "bg-brand text-white"
                : "text-muted hover:bg-slate-100"
            }`}
          >
            Reviews
          </button>
        </div>
        {activeTab === "description" ? (
          <p className="text-sm leading-relaxed text-muted">
            {product.description} Designed with comfort, longevity, and easy styling
            in mind. Each item is finished and quality-checked by our partner studios.
          </p>
        ) : (
          <div className="space-y-4 text-sm text-muted">
            <form onSubmit={onSubmitReview} className="space-y-3 rounded-lg bg-slate-50 p-4">
              <h3 className="font-semibold text-ink">Write a review</h3>
              <select
                value={review.rating}
                onChange={(event) => setReview((prev) => ({ ...prev, rating: Number(event.target.value) }))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Very good</option>
                <option value={3}>3 - Good</option>
                <option value={2}>2 - Fair</option>
                <option value={1}>1 - Poor</option>
              </select>
              <textarea
                value={review.comment}
                onChange={(event) => setReview((prev) => ({ ...prev, comment: event.target.value }))}
                rows={3}
                placeholder="Share your experience"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none"
              />
              <button className="btn-primary">Submit Review</button>
            </form>

            {!!product.reviews?.length &&
              product.reviews.map((entry) => (
                <p key={entry._id} className="rounded-lg bg-slate-50 p-3">
                  "{entry.comment}" - {entry.name}
                </p>
              ))}
          </div>
        )}
      </div>

      {!!related.length && (
        <div className="mt-12">
          <h2 className="mb-5 font-display text-3xl font-bold">Related products</h2>
          <ProductGrid products={related} />
        </div>
      )}
    </section>
  );
}

export default ProductDetailsPage;