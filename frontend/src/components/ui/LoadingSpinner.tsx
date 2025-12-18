import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner: React.FC = () => (
  <div className="loading-spinner-overlay">
    <div className="spinner" />
  </div>
);

export default LoadingSpinner;
