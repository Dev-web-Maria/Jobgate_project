import React from 'react';
import './NotFound.css'; // Assuming you have a CSS file for styles and animations

const NotFound = () => {
  const handleGoHome = () => {
    // Navigate to home page logic here
    console.log("Navigate to home");
  };

  return (
    <div className="not-found-container">
      {/* Animated background elements */}
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>
      <div className="shape shape-3"></div>
      <div className="shape shape-4"></div>
      
      <div className="not-found-content">
        <h1 className="error-code pulse">404</h1>
        <h2 className="error-title fade-in">Oops! Page Not Found</h2>
        <p className="error-message fade-in">
          The page you're looking for seems to have disappeared into the digital void.
        </p>
        
        <button className="home-button bounce" onClick={handleGoHome}>
          Return Home
        </button>
        
        <div className="decoration-elements">
          <div className="decoration dot-1 floating"></div>
          <div className="decoration dot-2 floating"></div>
          <div className="decoration dot-3 floating"></div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;