import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { UserPlus, Trash2, Shield, Calendar, Clock, FileText, CheckCircle, XCircle, Edit, Save, Lock, Plus } from "lucide-react";

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState("staff");
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Staff Form
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "cashier" });

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceData, setAttendanceData] = useState({}); // { staffId: 'present' | 'absent' | 'half-day' }

  // Leave State
  const [leaves, setLeaves] = useState([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ staffId: "", startDate: "", endDate: "", reason: "" });
  const [editingLeaveId, setEditingLeaveId] = useState(null);

  // Role State
  const [roles, setRoles] = useState([
    { _id: 'admin', name: 'Admin', permissions: ['all'], isSystem: true },
    { _id: 'manager', name: 'Manager', permissions: ['dashboard', 'billing', 'inventory', 'expenses', 'reports', 'staff'], isSystem: true },
    { _id: 'cashier', name: 'Cashier', permissions: ['dashboard', 'billing'], isSystem: true }
  ]);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: "", permissions: [] });

  const AVAILABLE_PERMISSIONS = [
    { id: 'dashboard', label: 'Dashboard Access' },
    { id: 'billing', label: 'Billing & Invoicing' },
    { id: 'inventory', label: 'Inventory Management' },
    { id: 'expenses', label: 'Expense Tracking' },
    { id: 'reports', label: 'View Reports' },
    { id: 'settings', label: 'System Settings' },
    { id: 'staff', label: 'Staff Management' },
  ];

  useEffect(() => {
    loadStaff();
    loadLeaves(); // Load leaves initially for the indicator in attendance tab
    loadRoles();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance' && staff.length > 0) {
      loadAttendance();
    }
    if (activeTab === 'leaves') {
        loadLeaves(); // Reload leaves when tab is clicked
    }
  }, [activeTab, attendanceDate, staff]);

  const loadRoles = async () => {
    try {
      // Mock API call - In real app, fetch from backend
      // const res = await api.get("/api/roles");
      // if (res.data) setRoles(res.data);
    } catch (err) {
      console.error("Failed to load roles", err);
    }
  };

  const loadStaff = async () => {
    setLoading(true);
    try {
      // Using the correct backend role/user API
      const res = await api.get("/api/user"); 
      setStaff(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load staff:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      // Using register endpoint to create new user with role
      await api.post("/api/auth/register", form);
      alert(`Staff member ${form.name} added as ${form.role}!`);
      setForm({ name: "", email: "", password: "", role: "cashier" });
      loadStaff(); // Refresh the list
    } catch (err) {
      console.error(err);
      alert("Failed to add staff member.");
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        await api.delete(`/api/user/${staffId}`);
        alert("Staff member deleted.");
        loadStaff(); // Refresh the list
      } catch (err) {
        console.error("Failed to delete staff:", err);
        alert("Failed to delete staff member.");
      }
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;
    setLoading(true);
    try {
      await api.put(`/api/user/${userId}/role`, { role: newRole });
      alert("Role updated successfully!");
      loadStaff();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  // --- Attendance Functions ---
  const loadAttendance = async () => {
    setLoading(true);
    try {
      // Fetch attendance for selected date
      // Note: Backend endpoint assumed. If not exists, it will return empty or error which we catch.
      const res = await api.get(`/api/attendance?date=${attendanceDate}`).catch(() => ({ data: {} }));
      const fetchedData = res.data || {};

      // Default to 'present' for any staff member without a record
      const defaults = {};
      staff.forEach(s => {
        if (!fetchedData[s._id]) {
          defaults[s._id] = 'present';
        }
      });

      setAttendanceData({ ...defaults, ...fetchedData });
    } catch (err) {
      console.error("Error loading attendance", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (staffId, status) => {
    setAttendanceData(prev => ({ ...prev, [staffId]: status }));
  };

  const saveAttendance = async () => {
    try {
      await api.post("/api/attendance", { date: attendanceDate, records: attendanceData });
      alert("Attendance saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save attendance");
    }
  };

  const markAllPresent = () => {
    const newData = {};
    staff.forEach(s => {
      newData[s._id] = 'present';
    });
    setAttendanceData(newData);
  };

  // --- Leave Functions ---
  const loadLeaves = async () => {
    try {
      const res = await api.get("/api/leaves").catch(() => ({ data: [] }));
      setLeaves(res.data || []);
    } catch(err) { console.error(err); }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLeaveId) {
        await api.put(`/api/leaves/${editingLeaveId}`, leaveForm);
        alert("Leave updated successfully!");
      } else {
        await api.post("/api/leaves", leaveForm);
        alert("Leave applied successfully!");
      }
      setShowLeaveForm(false);
      setEditingLeaveId(null);
      setLeaveForm({ staffId: "", startDate: "", endDate: "", reason: "" });
      loadLeaves();
    } catch(err) {
      console.error(err);
      alert("Error saving leave record");
    }
  };

  const handleEditLeave = (leave) => {
    setLeaveForm({
      staffId: leave.staffId,
      startDate: leave.startDate.split('T')[0],
      endDate: leave.endDate.split('T')[0],
      reason: leave.reason
    });
    setEditingLeaveId(leave._id);
    setShowLeaveForm(true);
  };

  const handleDeleteLeave = async (id) => {
    if(window.confirm("Cancel this leave?")) {
      try {
        await api.delete(`/api/leaves/${id}`);
        loadLeaves();
      } catch(err) { alert("Failed to delete leave"); }
    }
  };

  // --- Role Functions ---
  const handleAddRole = async (e) => {
    e.preventDefault();
    try {
      // Mock saving role locally for now
      const newRole = { ...roleForm, _id: Date.now().toString(), isSystem: false };
      setRoles([...roles, newRole]);
      setRoleForm({ name: "", permissions: [] });
      setShowRoleForm(false);
      alert("Role added successfully!");
      // await api.post("/api/roles", roleForm);
    } catch (err) {
      console.error(err);
      alert("Failed to add role");
    }
  };

  const togglePermission = (permId) => {
    setRoleForm(prev => {
      const hasPerm = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: hasPerm ? prev.permissions.filter(p => p !== permId) : [...prev.permissions, permId]
      };
    });
  };

  const handleDeleteRole = (id) => {
    if (window.confirm("Delete this role?")) {
      setRoles(roles.filter(r => r._id !== id));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="text-blue-600" /> Staff Management
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button onClick={() => setActiveTab('staff')} className={`px-4 py-2 border-b-2 font-medium ${activeTab === 'staff' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}>Staff List</button>
        <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 border-b-2 font-medium ${activeTab === 'attendance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}>Attendance</button>
        <button onClick={() => setActiveTab('leaves')} className={`px-4 py-2 border-b-2 font-medium ${activeTab === 'leaves' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}>Leave Management</button>
        <button onClick={() => setActiveTab('roles')} className={`px-4 py-2 border-b-2 font-medium ${activeTab === 'roles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}>Roles & Permissions</button>
      </div>

      {/* STAFF TAB */}
      {activeTab === 'staff' && (
      <>
      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Add New Staff Member</h2>
        <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Full Name"
            className="border p-2 rounded"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            className="border p-2 rounded"
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border p-2 rounded"
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            required
          />
          <select
            className="border p-2 rounded"
            value={form.role}
            onChange={e => setForm({...form, role: e.target.value})}
          >
            {roles.map(role => (
              <option key={role._id} value={role.name.toLowerCase()}>{role.name}</option>
            ))}
          </select>
          <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex justify-center items-center gap-2">
            <UserPlus size={18} /> Create Account
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4">Staff List</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Email</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="p-4 text-center">Loading...</td></tr>
              ) : staff.length > 0 ? (
                staff.map(member => (
                  <tr key={member._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{member.name}</td>
                    <td className="p-3">{member.email}</td>
                    <td className="p-3">
                      <select 
                        className="border border-gray-300 p-1 rounded bg-white text-sm outline-none focus:border-blue-500"
                        value={member.role || 'user'}
                        onChange={(e) => handleRoleChange(member._id, e.target.value)}
                        disabled={loading}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="cashier">Cashier</option>
                        <option value="user">User</option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleDeleteStaff(member._id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="p-4 text-center text-gray-500">No staff members found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Daily Attendance</h2>
              <input 
                type="date" 
                value={attendanceDate} 
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="border p-2 rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={markAllPresent} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium" title="Reset all to Present">
                Mark All Present
              </button>
              <button onClick={saveAttendance} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                <Save size={18} /> Save
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 font-semibold">Staff Name</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(member => {
                  // Check if member is on leave for selected date
                  const onLeave = leaves.find(l => {
                    const start = new Date(l.startDate);
                    const end = new Date(l.endDate);
                    const current = new Date(attendanceDate);
                    return current >= start && current <= end;
                  });

                  return (
                    <tr key={member._id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{member.name}</td>
                      <td className="p-3 text-sm text-gray-600 capitalize">{member.role}</td>
                      <td className="p-3">
                        {onLeave ? (
                          <div className="text-center text-orange-600 font-medium bg-orange-50 py-1 rounded">
                            On Leave ({onLeave.reason})
                          </div>
                        ) : (
                          <div className="flex justify-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name={`att-${member._id}`} 
                                checked={attendanceData[member._id] === 'present'} 
                                onChange={() => handleAttendanceChange(member._id, 'present')}
                                className="w-4 h-4 text-green-600"
                              />
                              <span className="text-sm">Present</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name={`att-${member._id}`} 
                                checked={attendanceData[member._id] === 'half-day'} 
                                onChange={() => handleAttendanceChange(member._id, 'half-day')}
                                className="w-4 h-4 text-yellow-600"
                              />
                              <span className="text-sm">Half Day</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name={`att-${member._id}`} 
                                checked={attendanceData[member._id] === 'absent'} 
                                onChange={() => handleAttendanceChange(member._id, 'absent')}
                                className="w-4 h-4 text-red-600"
                              />
                              <span className="text-sm">Absent</span>
                            </label>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAVES TAB */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Leave Records</h2>
            <button onClick={() => { setShowLeaveForm(true); setEditingLeaveId(null); setLeaveForm({ staffId: "", startDate: "", endDate: "", reason: "" }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus size={18} /> Apply Leave
            </button>
          </div>

          {showLeaveForm && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100">
              <h3 className="font-semibold mb-4">{editingLeaveId ? "Edit Leave" : "Apply New Leave"}</h3>
              <form onSubmit={handleLeaveSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select className="border p-2 rounded" value={leaveForm.staffId} onChange={e => setLeaveForm({...leaveForm, staffId: e.target.value})} required disabled={!!editingLeaveId}>
                  <option value="">Select Staff</option>
                  {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <input type="text" placeholder="Reason" className="border p-2 rounded" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} required />
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500">From</label>
                  <input type="date" className="border p-2 rounded" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} required />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500">To</label>
                  <input type="date" className="border p-2 rounded" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} required />
                </div>
                <div className="md:col-span-2 flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowLeaveForm(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Leave</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 font-semibold">Staff</th>
                  <th className="p-3 font-semibold">From</th>
                  <th className="p-3 font-semibold">To</th>
                  <th className="p-3 font-semibold">Reason</th>
                  <th className="p-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(leave => {
                  const staffMember = staff.find(s => s._id === leave.staffId);
                  return (
                    <tr key={leave._id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{staffMember?.name || "Unknown"}</td>
                      <td className="p-3">{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td className="p-3">{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td className="p-3 text-gray-600">{leave.reason}</td>
                      <td className="p-3 text-center flex justify-center gap-2">
                        <button onClick={() => handleEditLeave(leave)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteLeave(leave._id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  );
                })}
                {leaves.length === 0 && <tr><td colSpan="5" className="p-4 text-center text-gray-500">No leave records found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROLES TAB */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Roles & Permissions</h2>
            <button onClick={() => { setShowRoleForm(true); setRoleForm({ name: "", permissions: [] }); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus size={18} /> Create New Role
            </button>
          </div>

          {showRoleForm && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100">
              <h3 className="font-semibold mb-4">Create New Role</h3>
              <form onSubmit={handleAddRole} className="space-y-4">
                <input
                  type="text"
                  placeholder="Role Name (e.g., Helper, Accountant)"
                  className="w-full border p-2 rounded"
                  value={roleForm.name}
                  onChange={e => setRoleForm({...roleForm, name: e.target.value})}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AVAILABLE_PERMISSIONS.map(perm => (
                      <label key={perm.id} className="flex items-center gap-2 cursor-pointer border p-2 rounded hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowRoleForm(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Role</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 font-semibold">Role Name</th>
                  <th className="p-3 font-semibold">Permissions</th>
                  <th className="p-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role._id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{role.name}</td>
                    <td className="p-3 text-sm text-gray-600">
                      {role.permissions.includes('all') ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Full Access</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map(p => (
                            <span key={p} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs capitalize">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {!role.isSystem && (
                        <button onClick={() => handleDeleteRole(role._id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={18} /></button>
                      )}
                      {role.isSystem && <span className="text-xs text-gray-400 italic">System Default</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
