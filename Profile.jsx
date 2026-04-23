// src/Profile.jsx
import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5001";

export default function Profile({ user }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMsg(null);
  };

  const changePassword = async (e) => {
    e.preventDefault();

    if (!form.currentPassword || !form.newPassword) {
      setMsg("Fill all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/change-password`, {
        email: user.email,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setMsg(res.data.message || "Password updated");
      setForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-body login-center">
      <div className="card" style={{ maxWidth: 500 }}>
        <h2>👤 Profile</h2>

        <div className="form">
          <div>
            <div className="label">Name</div>
            <input className="form-input" value={user.name} readOnly />
          </div>

          <div>
            <div className="label">Email</div>
            <input className="form-input" value={user.email} readOnly />
          </div>
        </div>

        <hr style={{ margin: "24px 0" }} />

        <h3>🔐 Change Password</h3>

        <form onSubmit={changePassword} className="form">
          <input
            type="password"
            name="currentPassword"
            placeholder="Current password"
            className="form-input"
            value={form.currentPassword}
            onChange={handleChange}
          />

          <input
            type="password"
            name="newPassword"
            placeholder="New password"
            className="form-input"
            value={form.newPassword}
            onChange={handleChange}
          />

          {msg && <div className="status">{msg}</div>}

          <button className="btn primary" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}