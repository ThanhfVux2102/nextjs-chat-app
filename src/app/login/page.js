import React from 'react';
import './login.css'; // nhớ tạo file login.css

const Login = () => {
  return (
    <div className="login-container">
      <div className="form-section">
        <h2>LOGIN INTO YOUR ACCOUNT</h2>
        <div className="form-group">
          <label>Email Address</label>
          <div className="input-icon">
            <input type="email" placeholder="alex@email.com" />
            <img src="/email-icon.png" alt="email icon" />
          </div>
        </div>
        <div className="form-group">
          <label>Password</label>
          <div className="input-icon">
            <input type="password" placeholder="Enter your password" />
            <img src="/lock-icon.png" alt="lock icon" />
          </div>
        </div>
        <div className="options">
          <label><input type="checkbox" /> Remember me?</label>
          <a href="#">Forgot Password?</a>
        </div>
        <button className="btn-black">Login Now</button>
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
