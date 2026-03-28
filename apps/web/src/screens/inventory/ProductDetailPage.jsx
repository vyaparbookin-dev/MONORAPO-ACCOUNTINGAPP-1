import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Loader from "../../components/Loader";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/inventory/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => alert("Failed to load product"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!product) return <div className="p-6">Product not found</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow max-w-2xl mx-auto mt-6">
      <button onClick={() => navigate(-1)} className="text-blue-600 mb-4 hover:underline">← Back</button>
      <h2 className="text-3xl font-bold mb-4">{product.name}</h2>
      <div className="space-y-2 text-gray-700">
        <p><span className="font-semibold">SKU:</span> {product.sku}</p>
        <p><span className="font-semibold">Price:</span> ₹{product.price}</p>
        <p><span className="font-semibold">Current Stock:</span> {product.stock}</p>
        <p><span className="font-semibold">Category:</span> {product.category || "N/A"}</p>
      </div>
    </div>
  );
};

export default ProductDetailPage;