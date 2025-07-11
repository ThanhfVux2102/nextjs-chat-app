"use client"; // cần cho Next.js app router
import React, { useState } from 'react';
import './login.css';
import { login } from '@/lib/api'; // dùng hàm gọi API

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      localStorage.setItem('access_token', data.access_token);
      setMessage("Đăng nhập thành công!");
      // Có thể chuyển trang bằng window.location.href = "/" hoặc router.push()
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="form-section">
        <h2>LOGIN INTO YOUR ACCOUNT</h2>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-icon">
              <input
                type="email"
                placeholder="alex@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <img src="/email-icon.png" alt="email icon" />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-icon">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <img src="/lock-icon.png" alt="lock icon" />
            </div>
          </div>

          <div className="options">
            <label><input type="checkbox" /> Remember me?</label>
            <a href="#">Forgot Password?</a>
          </div>

          <button type="submit" className="btn-black">Login Now</button>
        </form>

        {message && <p style={{ marginTop: "10px", color: "red" }}>{message}</p>}

        <div className="divider">OR</div>
        <button className="btn-light">Signup Now</button>
      </div>

      <div className="image-section">
        <img src="/login.jpg" alt="team" />
      </div>
    </div>
  );
};

export default Login;
