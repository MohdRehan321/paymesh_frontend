import React, { useState } from 'react';
import api from '../api';

const Login = () => {
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // The proxy in package.json will automatically route this to http://localhost:8080/auth/login
      const response = await api.post("/auth/login", { email, password });
      
      console.log("FULL BACKEND RESPONSE:", response); // Debug hook

      // 1. Prioritize Authorization Header
      const authHeader = response.headers['authorization'] || response.headers['Authorization'];
      let token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

      // 2. Fallback to Body Parsing
      if (!token && response.data) {
        // Safely handle cases where the backend sends a raw string instead of a JSON object
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        
        // Check all common key variations and nested structures
        token = data.token || data.accessToken || data.jwt || data.data?.token;
      }

      if (token) {
        login(token); 
        alert("Login successful!");
        navigate("/home");
      } else {
        alert("Login failed: The token is missing from the payload. Check the F12 Console.");
      }

    } catch (err) {
      console.error("AXIOS ERROR:", err);
      const errorMsg = err.response?.data?.message || err.message;
      alert("Request failed: " + errorMsg);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
      />

      <input
        type="password"
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Password"
      />

      <button type="submit">Login</button>

      {error && <p>{error}</p>}
    </form>
  );
};

export default Login;