import React from 'react';
import './ErrorBanner.css';

interface ErrorBannerProps {
  message: string;
  onClose: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onClose }) => (
  <div className="error-banner">
    <span className="error-message">{message}</span>
    <button className="close-btn" onClick={onClose}>✕</button>
  </div>
);

export default ErrorBanner;
