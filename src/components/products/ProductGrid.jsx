import ProductCard from "./ProductCard";

function ProductGrid({ products }) {
  if (!products.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-muted">
        No products found with the current filters.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product._id || product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductGrid;