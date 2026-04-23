// src/Register.jsx
import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5001";

export default function Register({ onSwitchToLogin }) {
  const [form, setForm] = useState({
    name: "", email: "", password: "", address: "", pincode: "", phone: ""
  });
  const [errors, setErrors] = useState({});
  const [statusMsg, setStatusMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 2) e.name = "Enter your full name";
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password || form.password.length < 6) e.password = "Password must be at least 6 characters";
    if (!form.address || form.address.trim().length < 8) e.address = "Enter a detailed address";
    if (!form.pincode || !/^\d{5,7}$/.test(form.pincode)) e.pincode = "Pincode must be 5-7 digits";
    if (!form.phone || !/^\d{10}$/.test(form.phone)) e.phone = "Phone must be 10 digits";
    return e;
  };

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
    setStatusMsg(null);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setStatusMsg(null);
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/register`, form, { timeout: 10000 });
      setStatusMsg({ type: "success", text: res.data.message || "Registered successfully" });
      // switch to login after short delay
      setTimeout(() => {
        if (onSwitchToLogin) onSwitchToLogin();
      }, 900);
    } catch (err) {
      console.error("Register error:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setStatusMsg({ type: "error", text: err.response.data.message });
      } else if (err.request) {
        setStatusMsg({ type: "error", text: "No response from server — is backend running?" });
      } else {
        setStatusMsg({ type: "error", text: "Network error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-body">
      <div className="form-page-wrapper">
        <div className="card">
          <h1>Create your account</h1>
          <p className="lead">Register with the required details.</p>

          <form className="form" onSubmit={handleSubmit}>
            <div>
              <div className="label">Full name</div>
              <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="Your full name" />
              {errors.name && <div className="small" style={{ color: "#ffb6b6" }}>{errors.name}</div>}
            </div>

            <div>
              <div className="label">Email</div>
              <input name="email" value={form.email} onChange={handleChange} className="input" placeholder="you@example.com" />
              {errors.email && <div className="small" style={{ color: "#ffb6b6" }}>{errors.email}</div>}
            </div>

            <div>
              <div className="label">Password</div>
              <input name="password" type="password" value={form.password} onChange={handleChange} className="input" placeholder="At least 6 characters" />
              {errors.password && <div className="small" style={{ color: "#ffb6b6" }}>{errors.password}</div>}
            </div>

            <div>
              <div className="label">Address</div>
              <textarea name="address" value={form.address} onChange={handleChange} className="input" placeholder="Street, city, area" />
              {errors.address && <div className="small" style={{ color: "#ffb6b6" }}>{errors.address}</div>}
            </div>

            <div>
              <div className="label">Pincode</div>
              <input name="pincode" value={form.pincode} onChange={handleChange} className="input" placeholder="e.g. 534260" />
              {errors.pincode && <div className="small" style={{ color: "#ffb6b6" }}>{errors.pincode}</div>}
            </div>

            <div>
              <div className="label">Phone</div>
              <input name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="10 digit number" />
              {errors.phone && <div className="small" style={{ color: "#ffb6b6" }}>{errors.phone}</div>}
            </div>

            {statusMsg && <div className={`status ${statusMsg.type === "success" ? "ok" : "err"}`}>{statusMsg.text}</div>}

            <div className="actions">
              <button className="btn primary" type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create account"}
              </button>

              <div className="small">
                Already have an account?{" "}
                <button type="button" onClick={onSwitchToLogin} className="link-btn">Sign in</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}