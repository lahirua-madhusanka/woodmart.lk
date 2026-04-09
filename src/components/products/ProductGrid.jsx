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
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id || product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductGrid;