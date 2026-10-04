import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import api from "../services/api"; // Use our new centralized API layer
import "../stylesheets/styles.scss";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const handleLogin = async (e) => {
    e.preventDefault();
    const payload = { email, password };
  
    try {
    const response = await api.post("/auth/login", payload);
    
    // 1. Try Header first (safest), then try standard JSON body
    let token = response.headers['authorization']?.replace("Bearer ", "") || response.data?.token;

    // 2. If body is a raw text string instead of JSON, parse it
    if (!token && typeof response.data === 'string') {
      try {
        token = JSON.parse(response.data).token;
      } catch (e) {
        token = response.data; // Final fallback if it's strictly a raw string
      }
    }
      if (token) {
        login(token); 
        alert("Login successful!");
        navigate("/home");
      } else {
        alert("Login failed: No token received from server. Check backend response format.");
        console.log("Full Response:", response); // Helps debug if token is hiding elsewhere
      }
  
   } catch (err) {
    console.error("Network error:", err);
    const errorData = err.response?.data;
    
    // Check if the backend sent a JSON object, stringify it or extract the message
    const errorMessage = typeof errorData === 'object' 
        ? (errorData.message || JSON.stringify(errorData)) 
        : (errorData || err.message);
        
    alert("Request failed: " + errorMessage);
   }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <button type="submit" className="submit-btn btn-login">
            Sign In
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;