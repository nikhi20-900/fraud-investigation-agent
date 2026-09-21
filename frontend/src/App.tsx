import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { CasesPage } from './pages/CasesPage';
import { InvestigationPage } from './pages/InvestigationPage';
import { GraphExplorerPage } from './pages/GraphExplorerPage';
import { fetchHealth } from './api/client';

const AppContent: React.FC = () => {
  const [backendOnline, setBackendOnline] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      const res = await fetchHealth();
      setBackendOnline(res.online);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: 'Overview',
          subtitle: 'Operations and priority queue',
        };
      case '/cases':
        return {
          title: 'Cases',
          subtitle: 'Active investigations and alerts',
        };
      case '/investigation':
        return {
          title: 'Investigations',
          subtitle: '',
        };
      case '/graph':
        return {
          title: 'Graph Explorer',
          subtitle: 'Entity relationship network',
        };
      case '/evaluation':
        return {
          title: 'Evaluation',
          subtitle: 'System performance metrics',
        };
      default:
        return {
          title: 'Fraud Intelligence',
          subtitle: '',
        };
    }
  };

  const meta = getPageMeta();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FAFAFA] text-gray-900">
      <Sidebar
        backendOnline={backendOnline}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/investigation" element={<InvestigationPage />} />
            <Route path="/graph" element={<GraphExplorerPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
