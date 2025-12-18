import React from 'react';
import { useAuthStore } from '../stores/authStore';

const AuthTest: React.FC = () => {
  const { isAuthenticated, user, setUser, logout } = useAuthStore();

  const handleTestLogin = () => {
    const mockUser = {
      id: '1',
      username: 'admin',
      email: 'admin@csl.com',
      role: 'admin' as const,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
    };

    setUser(mockUser);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Authentication Test</h2>
      
      <div className="mb-4">
        <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? `${user.firstName} ${user.lastName} (${user.username})` : 'None'}</p>
        <p><strong>Role:</strong> {user?.role || 'N/A'}</p>
      </div>

      <div className="space-x-2">
        <button 
          onClick={handleTestLogin}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={isAuthenticated}
        >
          Test Login
        </button>
        
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          disabled={!isAuthenticated}
        >
          Logout
        </button>
      </div>

      {isAuthenticated && (
        <div className="mt-4 p-3 bg-green-100 rounded">
          <p className="text-green-800">✅ Authentication working!</p>
          <a href="/admin/dashboard" className="text-blue-600 underline">
            Go to Dashboard
          </a>
        </div>
      )}
    </div>
  );
};

export default AuthTest;
