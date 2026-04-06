import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building, Plus, ArrowRight, MapPin, Phone, Mail, Globe, QrCode } from "lucide-react";
import api from "../../services/api";
import { dbService } from "../../services/dbService";

const CompanyListPage = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.company.list();
        // Handle different response structures safely
        const data = response.companies || response.data || response;
        setCompanies(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleSelectCompany = (company) => {
    dbService.setCompanyId(company._id || company.uuid);
    // Desktop crash fix: React Router ka 'navigate' use karein
    navigate("/dashboard");
    window.location.reload(); // Context refresh karne ke liye safe reload
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
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition group relative"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition">
                    <Building className="text-blue-600" size={24} />
                  </div>
              <div className="flex flex-col items-end gap-1 mt-1">
                {company.businessType && (
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wide">
                    {Array.isArray(company.businessType) ? company.businessType.join(', ') : company.businessType}
                  </span>
                )}
                {company.gstType && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${
                    company.gstType === 'composition' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                    company.gstType === 'unregistered' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                    'bg-green-100 text-green-800 border-green-200'
                  }`}>
                    {company.gstType === 'composition' ? 'COMPOSITION' : company.gstType === 'unregistered' ? 'UNREGISTERED' : 'REGULAR GST'}
                  </span>
                )}
              </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-1">{company.name}</h3>
                {company.businessDescription && (
                  <p className="text-blue-600 text-xs font-bold tracking-wider mb-3 uppercase">
                    {company.businessDescription}
                  </p>
                )}
                
                <div className="space-y-2 mb-4 mt-2">
                  {company.phone && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <Phone size={14} className="mr-2 text-gray-400" /> {company.phone}
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <Mail size={14} className="mr-2 text-gray-400" /> {company.email}
                    </div>
                  )}
                  <div className="flex items-start text-gray-600 text-sm">
                    <MapPin size={14} className="mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                    <span className="line-clamp-1">{company.address || "No address provided"}</span>
                  </div>
                  {company.website && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <Globe size={14} className="mr-2 text-gray-400" /> {company.website}
                    </div>
                  )}
                  {company.upiId && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <QrCode size={14} className="mr-2 text-gray-400" /> UPI: {company.upiId}
                    </div>
                  )}
                </div>
                
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