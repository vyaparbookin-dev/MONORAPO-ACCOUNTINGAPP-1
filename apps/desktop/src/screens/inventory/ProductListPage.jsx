import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { dbService } from "../../services/dbService";

const ProductListPage = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      let productList = [];

      // 1. Offline First: Local Desktop DB se products lo
      productList = await dbService.getInventory();

      // 2. Sync-Down: Agar DB khali hai, toh cloud se laao
      if (!productList || productList.length === 0) {
        const res = await api.get("/api/inventory");
        const cloudProducts = res.data?.products || res.data || [];
        const safeProducts = Array.isArray(cloudProducts) ? cloudProducts : [];

        if (safeProducts.length > 0) {
          for (const prod of safeProducts) {
            await dbService.saveProduct({
              ...prod,
              uuid: prod._id,
              name: prod.name,
              sku: prod.sku || `SKU-${Date.now()}`,
              price: prod.sellingPrice || prod.price || 0,
              quantity: prod.currentStock || prod.stock || 0,
              category: prod.category || 'General',
              subCategory: prod.subCategory || '',
              costPrice: prod.costPrice || 0
            });
          }
          productList = await dbService.getInventory();
        } else {
          productList = safeProducts;
        }
      }
      setProducts(productList);
    } catch (err) {
      console.error("Error loading products:", err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Product List</h2>
        <Link to="/inventory/add" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Add Product
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Name</th>
              <th className="p-4 font-semibold text-gray-600">SKU</th>
              <th className="p-4 font-semibold text-gray-600">Price</th>
              <th className="p-4 font-semibold text-gray-600">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-500">No products found.</td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p._id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4 text-gray-600">{p.sku || "-"}</td>
                <td className="p-4">₹{p.price}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${p.stock > 10 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {p.stock}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductListPage;