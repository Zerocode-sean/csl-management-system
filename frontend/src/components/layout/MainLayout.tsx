import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="ml-64 min-h-screen">
        <Header title={title} subtitle={subtitle} />
        
        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
