import React from 'react';
import { NavTab } from '../types';
import { LayoutDashboard, Users, Bot, CheckCircle, XCircle, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalLeadsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  approvedCount,
  rejectedCount,
  totalLeadsCount,
}) => {
  return (
    <aside
      id="main-sidebar"
      className="fixed left-0 top-0 h-full w-64 bg-[#181c24] z-50 flex flex-col justify-between border-r border-white/5"
    >
      <div className="flex flex-col">
        {/* Brand Header */}
        <div
          id="sidebar-brand-header"
          className="h-16 px-6 flex items-center gap-2 bg-[#0a0e16] border-b border-white/5"
        >
          <img
            id="vanguard-logo"
            alt="Vanguard AI Logo"
            className="h-8 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQmhRbvPLc5guSuglyufKVnXJCJJNRYkE-RH5rna7oAPj7zSPNs6oCm4h8fRPQLmK0UvWBiQ5wiGfBYrOE_Q4qtZiYEPRAaeSYA8P1JJFCnUukxihzmr4RF4iA4bwK-UDli9dhvnUu8uVVWhsmejWo7fk4PAfciyOPAq_usl-MEm6sPdQS48lgN-MC1hl-L7AE8nmesg3lET6n4MqV1u_D5jEpGZtxc85Fg8n0XX2gKz7nf9V5zcp4Wg"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-['Manrope'] text-[16px] font-semibold text-[#dfe2ee] truncate leading-tight">
              Vanguard Sales AI
            </span>
            <span className="font-['Hanken_Grotesk'] text-[11px] font-semibold text-[#f2ca50] tracking-wider uppercase">
              CrewAI Engine
            </span>
          </div>
        </div>

        {/* Navigation Category Header */}
        <div className="px-4 py-2 mt-2">
          <span className="font-['Hanken_Grotesk'] text-[11px] font-semibold text-[#d0c5af] uppercase px-2 tracking-wider opacity-80">
            Navigation
          </span>
        </div>

        {/* Navigation Links */}
        <nav id="sidebar-nav" className="flex flex-col gap-1 px-4">
          <button
            id="nav-dashboard-btn"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors text-left ${
              activeTab === 'dashboard'
                ? 'bg-[#d4af37] text-[#554300] font-semibold'
                : 'text-[#d0c5af] hover:bg-[#262a33] hover:text-[#dfe2ee]'
            }`}
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="font-['Hanken_Grotesk'] text-[13px] font-medium">Dashboard</span>
            </div>
          </button>

          <button
            id="nav-leads-btn"
            onClick={() => setActiveTab('leads')}
            className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors text-left ${
              activeTab === 'leads'
                ? 'bg-[#d4af37] text-[#554300] font-semibold'
                : 'text-[#d0c5af] hover:bg-[#262a33] hover:text-[#dfe2ee]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="font-['Hanken_Grotesk'] text-[13px] font-medium">Leads</span>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'leads'
                  ? 'bg-black/20 text-[#3c2f00]'
                  : 'bg-[#31353e] text-[#dfe2ee]'
              }`}
            >
              {totalLeadsCount}
            </span>
          </button>

          <button
            id="nav-ai-emails-btn"
            onClick={() => setActiveTab('ai-emails')}
            className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors text-left ${
              activeTab === 'ai-emails'
                ? 'bg-[#d4af37] text-[#554300] font-semibold'
                : 'text-[#d0c5af] hover:bg-[#262a33] hover:text-[#dfe2ee]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span className="font-['Hanken_Grotesk'] text-[13px] font-medium">AI Emails</span>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'ai-emails'
                  ? 'bg-black/20 text-[#3c2f00]'
                  : 'bg-[#f2ca50]/20 text-[#f2ca50]'
              }`}
            >
              {pendingCount} Pending
            </span>
          </button>

          <button
            id="nav-approved-btn"
            onClick={() => setActiveTab('approved')}
            className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors text-left ${
              activeTab === 'approved'
                ? 'bg-[#d4af37] text-[#554300] font-semibold'
                : 'text-[#d0c5af] hover:bg-[#262a33] hover:text-[#dfe2ee]'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="font-['Hanken_Grotesk'] text-[13px] font-medium">Approved</span>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'approved'
                  ? 'bg-black/20 text-[#3c2f00]'
                  : 'bg-[#31353e] text-[#58e7aa]'
              }`}
            >
              {approvedCount}
            </span>
          </button>

          <button
            id="nav-rejected-btn"
            onClick={() => setActiveTab('rejected')}
            className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors text-left ${
              activeTab === 'rejected'
                ? 'bg-[#d4af37] text-[#554300] font-semibold'
                : 'text-[#d0c5af] hover:bg-[#262a33] hover:text-[#dfe2ee]'
            }`}
          >
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              <span className="font-['Hanken_Grotesk'] text-[13px] font-medium">Rejected</span>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'rejected'
                  ? 'bg-black/20 text-[#3c2f00]'
                  : 'bg-[#31353e] text-[#ffb4ab]'
              }`}
            >
              {rejectedCount}
            </span>
          </button>

          <button
            id="nav-settings-btn"
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors text-left ${
              activeTab === 'settings'
                ? 'bg-[#d4af37] text-[#554300] font-semibold'
                : 'text-[#d0c5af] hover:bg-[#262a33] hover:text-[#dfe2ee]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="font-['Hanken_Grotesk'] text-[13px] font-medium">Settings</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Realtime Sheets Status Footer */}
      <div id="sidebar-telemetry-footer" className="p-4 bg-[#0a0e16] border-t border-white/5">
        <div className="p-2.5 rounded-lg bg-[#1c2028] flex items-center justify-between border border-white/5 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58e7aa] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#58e7aa]"></span>
            </span>
            <span className="font-['Hanken_Grotesk'] text-[12px] text-[#d0c5af]">Sheets Realtime</span>
          </div>
          <span className="font-['Hanken_Grotesk'] text-[12px] text-[#58e7aa] font-semibold">v2.4</span>
        </div>
      </div>
    </aside>
  );
};
