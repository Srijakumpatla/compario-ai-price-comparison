// src/App.jsx
import React, { useEffect, useState } from "react";
import Home from "./Home";
import UploadPage from "./UploadPage";
import History from "./History";
import Profile from "./Profile";
import Login from "./Login";
import Register from "./Register";
import Navbar from "./Navbar";
import "./styles.css";

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("compario_user");
    if (raw) {
      setUser(JSON.parse(raw));
      setPage("upload");
    }
  }, []);

  const handleLoginSuccess = (userObj) => {
    setUser(userObj);
    localStorage.setItem("compario_user", JSON.stringify(userObj));
    setPage("upload");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("compario_user");
    setPage("home");
  };

  return (
    <div className="app-root">
      <Navbar
        user={user}
        page={page}
        goHome={() => setPage("home")}
        goHistory={() => setPage("history")}
        goUpload={() => setPage("upload")}   // ✅ NEW
        goProfile={() => setPage("profile")}
        onLogin={() => setPage("login")}
        onRegister={() => setPage("register")}
        onLogout={handleLogout}
      />

      <main className="main-area">
        {page === "home" && <Home onRegister={() => setPage("register")} />}
        {page === "login" && <Login onLoginSuccess={handleLoginSuccess} />}
        {page === "register" && <Register />}
        {page === "upload" && user && <UploadPage user={user} />}
        {page === "history" && user && <History user={user} />}
        {page === "profile" && user && <Profile user={user} />}
      </main>
    </div>
  );
}