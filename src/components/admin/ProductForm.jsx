import { useEffect, useMemo, useState } from "react";

const baseForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  discountPrice: "",
  stock: "",
  rating: "",
  imagesRaw: "",
  tagsRaw: "",
};

function ProductForm({
  initialValues,
  categories = [],
  onSubmit,
  submitLabel = "Save Product",
  saving = false,
}) {
  const [form, setForm] = useState(baseForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!initialValues) {
      setForm(baseForm);
      return;
    }

    setForm({
      name: initialValues.name || "",
      description: initialValues.description || "",
      category: initialValues.category || "",
      price: String(initialValues.price ?? ""),
      discountPrice: String(initialValues.discountPrice ?? ""),
      stock: String(initialValues.stock ?? ""),
      rating: String(initialValues.rating ?? ""),
      imagesRaw: (initialValues.images || []).join("\n"),
      tagsRaw: (initialValues.tags || []).join(", "),
    });
  }, [initialValues]);

  const imagePreview = useMemo(
    () => form.imagesRaw.split("\n").map((line) => line.trim()).filter(Boolean),
    [form.imagesRaw]
  );

  const setField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.description.trim()) next.description = "Description is required";
    if (!form.category.trim()) next.category = "Category is required";
    if (!form.price || Number(form.price) < 0) next.price = "Price must be a positive number";
    if (!form.stock || Number(form.stock) < 0) next.stock = "Stock must be a non-negative number";
    if (!imagePreview.length) next.imagesRaw = "At least one image URL is required";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      stock: Number(form.stock),
      rating: form.rating ? Number(form.rating) : undefined,
      images: imagePreview,
      tags: form.tagsRaw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Product Name</span>
          <input value={form.name} onChange={setField("name")} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          {errors.name ? <span className="mt-1 block text-xs text-red-600">{errors.name}</span> : null}
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-semibold">Category</span>
          <input list="category-options" value={form.category} onChange={setField("category")} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <datalist id="category-options">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          {errors.category ? <span className="mt-1 block text-xs text-red-600">{errors.category}</span> : null}
        </label>
      </div>

      <label className="text-sm">
        <span className="mb-1 block font-semibold">Description</span>
        <textarea value={form.description} onChange={setField("description")} rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        {errors.description ? <span className="mt-1 block text-xs text-red-600">{errors.description}</span> : null}
      </label>

      <div className="grid gap-4 md:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Price</span>
          <input type="number" value={form.price} onChange={setField("price")} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          {errors.price ? <span className="mt-1 block text-xs text-red-600">{errors.price}</span> : null}
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Discount Price</span>
          <input type="number" value={form.discountPrice} onChange={setField("discountPrice")} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Stock</span>
          <input type="number" value={form.stock} onChange={setField("stock")} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          {errors.stock ? <span className="mt-1 block text-xs text-red-600">{errors.stock}</span> : null}
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Rating</span>
          <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={setField("rating")} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
      </div>

      <label className="text-sm">
        <span className="mb-1 block font-semibold">Images (one URL per line)</span>
        <textarea value={form.imagesRaw} onChange={setField("imagesRaw")} rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        {errors.imagesRaw ? <span className="mt-1 block text-xs text-red-600">{errors.imagesRaw}</span> : null}
      </label>

      {!!imagePreview.length && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {imagePreview.slice(0, 4).map((image) => (
            <img key={image} src={image} alt="preview" className="h-24 w-full rounded-lg border border-slate-200 object-cover" />
          ))}
        </div>
      )}

      <label className="text-sm">
        <span className="mb-1 block font-semibold">Tags (comma separated)</span>
        <input value={form.tagsRaw} onChange={setField("tagsRaw")} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>

      <div>
        <button disabled={saving} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70">
          {saving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
