import React from "react";
import { useNavigate } from "react-router-dom";
import { Building, Plus, ArrowRight, Trash2 } from "lucide-react";
import { useCompany } from "../../contexts/CompanyContext";

const CompanyListPage = () => {
  const navigate = useNavigate();
  const { companies, loading, deleteCompany } = useCompany();

  const handleSelectCompany = (company) => {
    localStorage.setItem("companyId", company._id);
    localStorage.setItem("companyName", company.name);
    // Redirect to dashboard and reload to refresh context
    window.location.href = "/dashboard";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Companies</h1>
          <p className="text-gray-600 mt-1">Select a company to manage or create a new one</p>
        </div>
        <button
          onClick={() => navigate("/company/add")}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md font-medium"
        >
          <Plus size={20} />
          Add New Company
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.length > 0 ? (
            companies.map((company) => (
              <div
                key={company._id}
                onClick={() => handleSelectCompany(company)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition group relative overflow-hidden"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete "${company.name}"?`)) {
                      deleteCompany(company._id);
                    }
                  }}
                  className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full z-10"
                  title={`Delete ${company.name}`}
                >
                  <Trash2 size={18} />
                </button>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition">
                    <Building className="text-blue-600" size={24} />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{company.name}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {company.address || "No address provided"}
                </p>
                
                <div className="flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                  Select Company <ArrowRight size={16} className="ml-1" />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <Building className="mx-auto text-gray-400 mb-3" size={48} />
              <h3 className="text-lg font-medium text-gray-900">No Companies Found</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first company</p>
              <button
                onClick={() => navigate("/company/add")}
                className="text-blue-600 font-medium hover:underline"
              >
                Create a Company
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyListPage;