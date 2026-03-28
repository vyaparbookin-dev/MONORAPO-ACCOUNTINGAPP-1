import React, { useState, useEffect } from "react";
import api from "../../services/api";

const Profile = () => {
  const [profile, setProfile] = useState({ name: "", email: "" });

  useEffect(() => {
    api.get("/api/user/profile").then((res) => setProfile(res.data || res));
  }, []);

  const handleChange = (e) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSave = async () => {
    await api.put("/api/user/profile", profile);
    alert("Profile updated successfully!");
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-3">Your Profile</h2>
      <input
        name="name"
        className="border p-2 w-full mb-2"
        placeholder="Full Name"
        value={profile.name}
        onChange={handleChange}
      />
      <input
        name="email"
        className="border p-2 w-full mb-2"
        placeholder="Email"
        value={profile.email}
        onChange={handleChange}
      />
      <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white">
        Save Changes
      </button>
    </div>
  );
};

export default Profile;