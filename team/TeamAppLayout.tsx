
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TeamTabBar from './components/TeamTabBar';
import LoginPage from './pages/LoginPage';
import AppointmentsPage from './pages/AppointmentsPage';
import ScanPage from './pages/ScanPage';
import MorePage from './pages/MorePage';
import ClientProfilePage from './pages/ClientProfilePage';


const TeamAppLayout: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('salon_team_token');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('salon_team_token');
    setIsAuthenticated(false);
  };

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show TabBar on main pages only, hide on detail pages if needed, 
  // but for simplicity we keep it on main nav pages.
  // We'll hide it on Client Profile to give more space? 
  // Let's keep it consistent with the customer app approach: 
  // TabBar is always visible unless specific routes.
  // For MVP, let's keep it visible everywhere except scan maybe? 
  // Let's hide it on Scan page to focus on camera.
  const showTabBar = location.pathname !== '/team/scan';

  return (
    <div className="w-full max-w-[430px] bg-app-bg max-h-screen min-h-screen shadow-2xl relative flex flex-col overflow-hidden font-alexandria mx-auto">
      <div className="flex-1 overflow-y-auto no-scrollbar relative pb-20">
        <Routes>
          <Route path="/" element={<Navigate to="/team/appointments" replace />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="more" element={<MorePage onLogout={handleLogout} />} />
          <Route path="client/:clientId" element={<ClientProfilePage />} />
          <Route path="*" element={<Navigate to="/team/appointments" replace />} />
        </Routes>
      </div>
      {showTabBar && <TeamTabBar />}
    </div>
  );
};

export default TeamAppLayout;
