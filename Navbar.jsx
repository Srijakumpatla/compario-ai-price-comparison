// src/Navbar.jsx
import React from "react";

export default function Navbar({
  user,
  page,
  onLogin,
  onRegister,
  onLogout,
  goHome,
  goUpload,
  goHistory,
  goProfile,
}) {
  const handleLogoClick = () => {
    if (user) {
      goUpload();   // ✅ logged in → upload page
    } else {
      goHome();     // ✅ logged out → home
    }
  };

  return (
    <div className="navbar">
      {/* LEFT */}
      <div
        className="nav-left"
        onClick={handleLogoClick}
        role="button"
        tabIndex={0}
      >
        <div className="logo-square" />
        <div className="site-title">Compario</div>
      </div>

      {/* RIGHT */}
      <div className="nav-right">
        {!user ? (
          <>
            <button className="nav-btn primary" onClick={onLogin}>
              Login
            </button>
            <button className="nav-btn primary" onClick={onRegister}>
              Sign Up
            </button>
          </>
        ) : (
          <>
            <div className="user-name">Hi, {user.name}</div>

            {/* ✅ UPLOAD */}
            <button className="nav-btn primary" onClick={goUpload}>
              Upload
            </button>

            {/* ✅ HISTORY */}
            <button className="nav-btn primary" onClick={goHistory}>
              History
            </button>

            {/* ✅ PROFILE */}
            <button className="nav-btn primary" onClick={goProfile}>
              Profile
            </button>

            {/* LOGOUT */}
            <button className="nav-btn primary" onClick={onLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}