import React from 'react';
import { Search, User, Menu } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onMobileMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onMobileMenuToggle,
}) => {
  return (
    <header
      id="main-top-header"
      className="fixed top-0 left-64 right-0 h-16 bg-[#0f131c]/90 backdrop-blur-xl border-b border-white/5 z-40 flex items-center justify-between px-6 shadow-sm"
    >
      <div className="flex items-center gap-4 w-96">
        {/* Mobile toggle */}
        <button
          id="mobile-menu-toggle-btn"
          onClick={onMobileMenuToggle}
          className="md:hidden text-[#d0c5af] hover:text-white p-1 rounded"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#d0c5af]" />
          <input
            id="global-search-input"
            className="w-full bg-[#181c24] pl-9 pr-4 py-1.5 rounded-xl font-['Hanken_Grotesk'] text-[13px] text-[#dfe2ee] placeholder:text-[#d0c5af]/60 border border-white/5 focus:outline-none focus:ring-1 focus:ring-[#f2ca50] transition-all"
            placeholder="Search leads, companies, signals..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              id="clear-search-btn"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#d0c5af] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* User Profile Avatar */}
        <div id="user-profile-avatar-container" className="flex items-center pl-2">
          <div
            id="user-profile-avatar"
            className="w-8 h-8 rounded-full bg-[#f2ca50] flex items-center justify-center text-[#3c2f00] font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity"
            title="Alex Mercer (Enterprise Lead)"
          >
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};
