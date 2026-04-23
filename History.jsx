// src/History.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5001";

export default function History({ user }) {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [compare, setCompare] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load browser history
  useEffect(() => {
    if (!user?.id) return;
    const key = `upload_history_${user.id}`;
    const stored = JSON.parse(localStorage.getItem(key)) || [];
    setHistory(stored);
  }, [user]);

  const rerunCompare = async (item) => {
    try {
      setLoading(true);
      setSelected(item);
      setCompare(null);

      const res = await axios.post(
        `${API_BASE}/api/compare-prices`,
        { product_name: item.label }
      );

      setCompare(res.data);
    } catch (err) {
      alert("Failed to re-run comparison");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "20px auto" }}>
      <h2>🕘 Upload History</h2>

      {history.length === 0 && <p>No previous uploads.</p>}

      {/* HISTORY GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
          marginTop: 20,
        }}
      >
        {history.map((item, index) => (
          <div
            key={index}
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              padding: 10,
            }}
          >
            <img
              src={item.image}
              alt={item.label}
              style={{
                width: "100%",
                height: 140,
                objectFit: "cover",
                borderRadius: 6,
              }}
            />
            <div style={{ marginTop: 8, fontWeight: 700 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {item.time}
            </div>

            <button
              className="btn primary"
              style={{ marginTop: 8, width: "100%" }}
              onClick={() => rerunCompare(item)}
            >
              Re-run Compare
            </button>
          </div>
        ))}
      </div>

      {/* RE-RUN RESULT */}
      {loading && <p style={{ marginTop: 20 }}>Comparing prices...</p>}

      {compare && (
        <div style={{ marginTop: 30 }}>
          <h3>🔁 Results for: {selected.label}</h3>

          <table
            border="1"
            cellPadding="8"
            style={{ width: "100%", marginTop: 10 }}
          >
            <thead>
              <tr>
                <th>Store</th>
                <th>Product</th>
                <th>Price (INR)</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(compare.lowest_per_site).map(
                ([site, item]) =>
                  item && (
                    <tr key={site}>
                      <td>{site}</td>
                      <td>{item.title}</td>
                      <td>₹{item.price_inr}</td>
                      <td>
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}