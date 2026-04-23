import React from "react";

export default function Home({ onLogin, onRegister }) {
  return (
    <div className="home-wrapper">
      
      {/* HERO SECTION */}
      <div className="hero">
        <h1 className="home-title">Smart Shopping.<br/>Better Savings.</h1>

        <p className="home-sub">
          Upload any product image to instantly find and compare prices across top e-commerce platforms.
        </p>

        <button className="btn primary hero-btn" onClick={onRegister}>
          Get Started
        </button>
      </div>


      {/* WORKFLOW SECTION */}
      <div className="steps-section">
        <h2 className="steps-title">How Compario works</h2>

        <div className="steps-row">

          {/* Step 1 */}
          <div className="step-card c1">
            <div className="step-content">
              <h4>1. Upload a product image</h4>
              <p>Take or upload any photo — phone, fridge, shoes, and more.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="step-card c2">
            <div className="step-content">
              <h4>2. AI identifies the product</h4>
              <p>Our Vision Transformer model instantly understands the item.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="step-card c3">
            <div className="step-content">
              <h4>3. Compare prices</h4>
              <p>See best deals across Amazon, Flipkart, Snapdeal, and others.</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}