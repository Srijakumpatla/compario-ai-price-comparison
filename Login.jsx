// src/Login.jsx
import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5001";

export default function Login({ onSwitchToRegister, onLoginSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [statusMsg, setStatusMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password || form.password.length < 6) e.password = "Password must be at least 6 characters";
    return e;
  };

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
    setStatusMsg(null);
  };

  const handleSubmit = async (ev) => {
    // works with both button click and form submit
    ev.preventDefault();
    setStatusMsg(null);
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/login`, form, { timeout: 10000 });
      setStatusMsg({ type: "success", text: res.data.message || "Login successful" });
      if (onLoginSuccess) onLoginSuccess(res.data.user);
    } catch (err) {
      console.error("Login error:", err);
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
    <div className="app-body login-center">
      <div className="form-page-wrapper">
        <div className="card">
          <h1>Welcome back!</h1>
          <p className="lead">Sign in to access your account.</p>
          <br></br>

          <form className="form" onSubmit={handleSubmit} noValidate>
            <div>
              <div className="label">Email</div>
              <br></br>
              <input
                name="email"
                type="email"
                aria-label="Email"
                value={form.email}
                onChange={handleChange}
                className="form-input"
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <div className="small" style={{ color: "#ffb6b6" }}>{errors.email}</div>}
            </div>

            <div>
              <div className="label">Password</div>
              <br></br>
              <input
                name="password"
                type="password"
                aria-label="Password"
                value={form.password}
                onChange={handleChange}
                className="form-input"
                placeholder="At least 6 characters"
                autoComplete="current-password"
              />
              {errors.password && <div className="small" style={{ color: "#ffb6b6" }}>{errors.password}</div>}
            </div>

            {statusMsg && (
              <div className={`status ${statusMsg.type === "success" ? "ok" : "err"}`}>
                {statusMsg.text}
              </div>
            )}

            <div className="actions actions-vertical">
  <button className="btn primary" onClick={handleSubmit} disabled={loading}>
    {loading ? "Signing in..." : "Sign in"}
  </button>

  <div className="small create-account-row">
    New here?{" "}
    <button type="button" onClick={onSwitchToRegister} className="link-btn">
      Create an account
    </button>
  </div>
</div>
          </form>
        </div>
      </div>
    </div>
  );
}