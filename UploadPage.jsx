import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5001";

function formatINR(n) {
  if (!n) return "—";
  return Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const STORE_ICON = {
  amazon: "🛒",
  walmart: "🏬",
  flipkart: "🛍️",
};

export default function UploadPage({ user }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [compare, setCompare] = useState(null);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState(null);

  /* ---------- Image preview ---------- */
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /* ---------- Identify best deal platform ---------- */
  const getBestDealSite = () => {
    if (!compare?.best_deal) return null;

    const bestPrice = compare.best_deal.price_inr;

    for (const [site, item] of Object.entries(compare.lowest_per_site)) {
      if (
        item &&
        Math.abs(item.price_inr - bestPrice) < 0.01 &&
        item.title === compare.best_deal.title
      ) {
        return site;
      }
    }
    return null;
  };

  /* ---------- Search + Save History ---------- */
  const search = async () => {
    if (!file) return alert("Please choose an image");

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result;
      const fd = new FormData();
      fd.append("file", file);

      try {
        setLoading(true);

        // 1️⃣ Classify
        const cls = await axios.post(`${API_BASE}/api/classify-image`, fd);
        setLabel(cls.data.label);

        // 2️⃣ Save to history
        const key = `upload_history_${user.id}`;
        const oldHistory = JSON.parse(localStorage.getItem(key)) || [];

        localStorage.setItem(
          key,
          JSON.stringify([
            {
              image: base64Image,
              label: cls.data.label,
              time: new Date().toLocaleString(),
            },
            ...oldHistory,
          ])
        );

        // 3️⃣ Compare prices
        const cmp = await axios.post(`${API_BASE}/api/compare-prices`, {
          product_name: cls.data.label,
        });

        setCompare(cmp.data);
      } catch (err) {
        alert("Something went wrong");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  };

  const bestSite = getBestDealSite();

  return (
    <div className="upload-wrapper">
      <div className="upload-card">

        <h1>Hello, {user.name}</h1>
        <p className="upload-subtext">
          Upload an image and our AI will identify the product for you.
        </p>

        {/* ---------- Upload Field ---------- */}
        <div className="upload-field">
          <label className="upload-label">Choose an image</label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <div className="upload-selected">
            Selected: {file ? file.name : "none"}
          </div>
        </div>

        {/* ---------- Actions ---------- */}
        <div className="actions">
          <button
            className="btn primary upload-btn"
            onClick={search}
            disabled={loading}
          >
            {loading ? "Searching..." : "Search product"}
          </button>

          <button
            className="btn ghost"
            onClick={() => {
              setFile(null);
              setPreview(null);
              setCompare(null);
              setLabel(null);
            }}
          >
            Reset
          </button>
        </div>

        {/* ---------- Preview ---------- */}
        {preview && (
          <div className="preview-box">
            <img src={preview} alt="Uploaded" />
          </div>
        )}

        {/* ---------- Detected Label ---------- */}
        {label && (
          <h3 className="detected">
            Detected product: <b>{label}</b>
          </h3>
        )}

        {/* ================= RESULTS ================= */}
        {compare && (
          <div className="results">
            <h3>Search results</h3>

            <table className="results-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Product Details</th>
                  <th>Lowest Price (INR)</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {["amazon", "walmart", "flipkart"].map((site) => {
                  const item = compare.lowest_per_site?.[site];

                  return (
                    <tr key={site}>
                      <td className="store-cell">
                        {STORE_ICON[site]}{" "}
                        {site.charAt(0).toUpperCase() + site.slice(1)}
                      </td>

                      {item ? (
                        <>
                          <td>
                            <div className="product-title">{item.title}</div>
                            <div className="meta">
                              ⭐ {item.rating || "—"}
                              {item.num_ratings
                                ? ` (${item.num_ratings} reviews)`
                                : ""}
                            </div>
                            {item.delivery && (
                              <div className="meta">{item.delivery}</div>
                            )}
                          </td>

                          <td className="price-cell">
                            ₹{formatINR(item.price_inr)}
                          </td>

                          <td>
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noreferrer"
                              className="view-link"
                            >
                              View
                            </a>
                          </td>
                        </>
                      ) : (
                        <td colSpan="3" className="no-results">
                          No results found
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ---------- Best Deal ---------- */}
            {compare.best_deal && bestSite && (
              <div className="best-deal">
                <h4>🔥 Best Overall Deal</h4>

                <p className="store-name">
                  <strong>Platform:</strong>{" "}
                  {STORE_ICON[bestSite]}{" "}
                  {bestSite.charAt(0).toUpperCase() + bestSite.slice(1)}
                </p>

                <p className="product-title">
                  {compare.best_deal.title}
                </p>

                <strong>
                  ₹{formatINR(compare.best_deal.price_inr)}
                </strong>

                <br />

                <a
                  href={compare.best_deal.link}
                  target="_blank"
                  rel="noreferrer"
                  className="view-link"
                >
                  View product
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}