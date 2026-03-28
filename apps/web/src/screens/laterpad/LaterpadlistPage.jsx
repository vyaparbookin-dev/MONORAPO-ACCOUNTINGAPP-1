import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Button from "../../components/Button"; // Assuming you have a Button component

const LaterpadListPage = () => {
  const [notes, setNotes] = useState([]);
  const navigate = useNavigate();

  const fetchNotes = async () => {
    try {
      const res = await api.get("/laterpad");
      setNotes(res.data || []);
    } catch (err) {
      console.error("Failed to load notes:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    await api.delete(`/laterpad/${id}`);
    fetchNotes();
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Saved Notes</h2>
        <Button onClick={() => navigate("/laterpad")}>
          + Create New Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <p className="text-gray-600">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li
              key={n._id}
              className="border rounded-lg p-3 flex justify-between items-center"
            >
              <div>
                <p className="font-bold">{n.title || "Untitled"}</p>
                <p className="text-sm text-gray-600 truncate w-64">{n.content}</p>
              </div>
              <button
                onClick={() => handleDelete(n._id)}
                className="text-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LaterpadListPage;