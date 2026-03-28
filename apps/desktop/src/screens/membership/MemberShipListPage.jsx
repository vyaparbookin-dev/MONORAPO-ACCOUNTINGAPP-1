import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";
import { Plus, Users } from "lucide-react";

const MembershipListPage = () => {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    // Fetch members from API
    const fetchMembers = async () => {
      try {
        const res = await api.get("/api/membership");
        setMembers(res.data || []);
      } catch (err) {
        console.error("Failed to load members", err);
      }
    };
    fetchMembers();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Membership List</h2>
        <Link to="/membership/add" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Add Member
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Name</th>
              <th className="p-4 font-semibold text-gray-600">Phone</th>
              <th className="p-4 font-semibold text-gray-600">Points</th>
              <th className="p-4 font-semibold text-gray-600">Tier</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-gray-500">No members found</td></tr>}
            {members.map((m) => (
              <tr key={m._id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium flex items-center gap-2"><Users size={16} className="text-blue-500"/> {m.name}</td>
                <td className="p-4">{m.phone}</td>
                <td className="p-4">{m.points}</td>
                <td className="p-4"><span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">{m.tier || 'Silver'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MembershipListPage;