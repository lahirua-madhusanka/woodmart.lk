import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../services/apiClient";
import {
  createAdminProductApi,
  getAdminCategoriesApi,
  updateAdminProductApi,
} from "../../services/adminApi/productsService";
import { getProductByIdApi } from "../../services/productService";

const ProductForm = lazy(() => import("../../components/admin/ProductForm"));

function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  const isEdit = useMemo(() => Boolean(id), [id]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const categoriesData = await getAdminCategoriesApi();
        setCategories(categoriesData || []);

        if (id) {
          const productData = await getProductByIdApi(id);
          setProduct(productData);
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (isEdit) {
        await updateAdminProductApi(id, payload);
        toast.success("Product updated");
      } else {
        await createAdminProductApi(payload);
        toast.success("Product created");
      }
      navigate("/admin/products");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-xl bg-white p-10 text-center text-muted">Loading product...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-ink">{isEdit ? "Edit Product" : "Add Product"}</h2>
        <p className="text-sm text-muted">Create and maintain your store catalog.</p>
      </div>

      <Suspense fallback={<div className="rounded-xl bg-white p-10 text-center text-muted">Loading form...</div>}>
        <ProductForm
          initialValues={product}
          categories={categories}
          onSubmit={handleSubmit}
          submitLabel={isEdit ? "Update Product" : "Create Product"}
          saving={saving}
        />
      </Suspense>
    </div>
  );
}

export default AdminProductFormPage;
