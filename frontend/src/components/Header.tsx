import React from 'react';
import { Search, User, Menu, Bell } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onMobileMenuToggle?: () => void;
  sidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onMobileMenuToggle,
  sidebarCollapsed = false,
}) => {
  return (
    <header
      id="main-top-header"
      style={{ left: sidebarCollapsed ? '3.5rem' : '15rem' }}
      className="fixed top-0 right-0 h-13 bg-[var(--c-bg-card)]/90 backdrop-blur-md border-b border-[var(--c-border)] z-40 flex items-center justify-between px-5 transition-[left] duration-200"
    >
      <div className="flex items-center gap-3 w-80">
        {/* Mobile toggle */}
        <button
          id="mobile-menu-toggle-btn"
          onClick={onMobileMenuToggle}
          className="md:hidden text-[var(--c-text-muted)] hover:text-[var(--c-text)] p-1 rounded-md"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Global Search */}
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-text-subtle)]" />
          <input
            id="global-search-input"
            className="w-full bg-[var(--c-bg)] pl-8 pr-7 py-1.5 rounded-md text-[13px] text-[var(--c-text)] placeholder:text-[var(--c-text-subtle)] border border-[var(--c-border)] focus:outline-none focus:border-[var(--c-accent)] focus:ring-1 focus:ring-[var(--c-accent)] transition-all"
            placeholder="Search accounts, leads, contacts..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              id="clear-search-btn"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--c-text-subtle)] hover:text-[var(--c-text)] transition-colors p-0.5"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right Header: Status + Profile */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--c-hover-bg)] border border-[var(--c-border)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-[11px] font-medium text-[var(--c-text-muted)]">FastAPI Connected</span>
        </div>

        <div
          id="user-profile-avatar"
          className="w-7 h-7 rounded-md bg-[var(--c-hover-bg)] border border-[var(--c-border)] flex items-center justify-center text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg-high)] cursor-pointer transition-colors"
          title="Account profile"
        >
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    </header>
  );
};
