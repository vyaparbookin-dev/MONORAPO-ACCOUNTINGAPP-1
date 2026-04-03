import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { dbService } from "../../services/dbService";
import api from "../../services/api";

export default function UnitSettingsPage() {
  // Default ko empty array [] assign karna zaroori hai taaki .map() crash na kare
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newUnit, setNewUnit] = useState("");

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      let localUnits = await dbService.getUnits?.();
      // Safeguard check
      if (!localUnits || !Array.isArray(localUnits) || localUnits.length === 0) {
        const res = await api.get('/api/unit').catch(() => null);
        localUnits = res?.data?.units || res?.data || [];
      }
      
      // Hamesha Array.isArray check karein set karne se pehle
      setUnits(Array.isArray(localUnits) ? localUnits : []);
    } catch (err) {
      console.error("Failed to load units", err);
      setUnits([]); // Error hone par empty array set karein
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    if (!newUnit.trim()) return;
    
    try {
      const payload = { name: newUnit.trim(), _id: crypto.randomUUID() };
      if(dbService.saveUnit) await dbService.saveUnit(payload);
      setUnits([...units, payload]);
      setNewUnit("");
      alert("Unit Added Successfully!");
    } catch (error) {
      alert("Error adding unit");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Unit Management</h2>
      
      <form onSubmit={handleAddUnit} className="flex gap-4 mb-6 border-b pb-6">
        <input 
          type="text" 
          placeholder="Add New Unit (e.g. PCS, KG, LTR)" 
          className="flex-1 border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          value={newUnit}
          onChange={(e) => setNewUnit(e.target.value)}
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus size={20} /> Add Unit
        </button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          <p className="text-gray-500">Loading units...</p>
        ) : units.length > 0 ? (
          units.map((unit, index) => (
            <div key={unit._id || index} className="flex justify-between items-center bg-gray-50 border p-3 rounded-lg">
              <span className="font-semibold text-gray-700 uppercase">{unit.name}</span>
              <button className="text-red-500 hover:text-red-700" title="Delete Unit">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-4">No units found. Please add a unit.</p>
        )}
      </div>
    </div>
  );
}