import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NewAssetModal from './NewAssetModal';
import UserSettingsModal from './UserSettingsModal';

export default function Layout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsNewAssetOpen(true);
    window.addEventListener('open-new-asset-modal', handleOpen);
    return () => window.removeEventListener('open-new-asset-modal', handleOpen);
  }, []);

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener('open-user-settings-modal', handleOpenSettings);
    return () => window.removeEventListener('open-user-settings-modal', handleOpenSettings);
  }, []);

  const handleAssetSaved = (newAsset) => {
    // Notify components that inventory has been updated
    window.dispatchEvent(new CustomEvent('inventory-updated', { detail: newAsset }));
  };

  return (
    <div className="min-h-screen bg-grid bg-[var(--bg-base)]">
      {/* Ambient top-left green glow — very subtle */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-0"
        style={{
          width: '500px', height: '400px',
          background: 'radial-gradient(circle at 20% 10%, rgba(22,163,74,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Desktop Sidebar */}
      <div className="hidden md:block relative z-30">
        <Sidebar onNewAssetClick={() => setIsNewAssetOpen(true)} />
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="relative z-10 h-full animate-slide-in" style={{ width: '260px' }}>
            <Sidebar onNewAssetClick={() => setIsNewAssetOpen(true)} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="relative z-10">
        <div className="md:ml-[260px]">
          <Header onMenuToggle={() => setIsMobileOpen(true)} />
          <main className="min-h-screen pt-20">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global New Asset Modal */}
      <NewAssetModal 
        isOpen={isNewAssetOpen} 
        onClose={() => setIsNewAssetOpen(false)} 
        onSave={handleAssetSaved}
      />

      {/* Global User Settings Modal */}
      <UserSettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
