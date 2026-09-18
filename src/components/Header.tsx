import React from 'react';
import {
  FolderKanban,
  Table,
  Users,
  LayoutGrid,
  BarChart3,
  Sheet,
  ExternalLink,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sliders,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ViewMode, Language, ProjectData } from '../types';

interface HeaderProps {
  project: ProjectData;
  onUpdateProjectTitle: (title: string) => void;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isSigningIn: boolean;
  onOpenSyncModal: () => void;
  isSyncing: boolean;
  lastSyncedAt?: string;
  onSyncNow: () => void;
  onAddTask: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onUpdateProjectTitle,
  currentView,
  onViewChange,
  language,
  onLanguageChange,
  user,
  onSignIn,
  onSignOut,
  isSigningIn,
  onOpenSyncModal,
  isSyncing,
  lastSyncedAt,
  onSyncNow,
  onAddTask,
}) => {
  const isLo = language === 'lo';

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: App Identity & Project Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
            <span>MP</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <input
                id="project-title-input"
                type="text"
                value={project.title}
                onChange={(e) => onUpdateProjectTitle(e.target.value)}
                className="font-semibold text-slate-900 text-base sm:text-lg bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 border border-transparent hover:border-slate-300 w-64 sm:w-96 truncate transition"
                placeholder={isLo ? 'ກະລຸນາໃສ່ຊື່ໂຄງການ...' : 'Project title...'}
              />
              <span className="hidden md:inline-flex items-center text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                MS Project Standard
              </span>
            </div>
            <p className="text-xs text-slate-500 px-1 truncate">
              {isLo
                ? 'ລະບົບວາງແຜນວຽກ, ໜ້າວຽກຍ່ອຍ, ຈັດການຊັບພະຍາກອນ & ຊິງຄ໌ Google Sheets'
                : 'Work Breakdown, Subtasks, Resource Allocation & Google Sheets Real-time'}
            </p>
          </div>
        </div>

        {/* Right: Actions & Integration */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Google Sheets Sync Integration Status */}
          {project.spreadsheetId ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-medium">
              <Sheet className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="hidden sm:inline">
                {isLo ? 'Google Sheets:' : 'Sheets:'}
              </span>
              <a
                id="open-spreadsheet-link"
                href={project.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${project.spreadsheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-emerald-950 flex items-center gap-1 font-semibold max-w-[120px] truncate"
                title={project.spreadsheetName || 'Open in Google Sheets'}
              >
                {project.spreadsheetName || 'Project Plan'}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>

              <button
                id="header-sync-now-btn"
                onClick={onSyncNow}
                disabled={isSyncing}
                title={isLo ? 'ກົດເພື່ອຊິງຄ໌ຂໍ້ມູນລົງ Google Sheets' : 'Sync now to Google Sheets'}
                className="ml-1 p-1 hover:bg-emerald-100 rounded text-emerald-700 transition flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline text-[11px]">
                  {isSyncing ? (isLo ? 'ກຳລັງຊິງຄ໌...' : 'Syncing...') : (isLo ? 'ຊິງຄ໌' : 'Sync')}
                </span>
              </button>

              <button
                id="sync-settings-btn"
                onClick={onOpenSyncModal}
                className="p-1 hover:bg-emerald-100 rounded text-emerald-700"
                title={isLo ? 'ຕັ້ງຄ່າການຊິງຄ໌ Google Sheet' : 'Sheet settings'}
              >
                <Sliders className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              id="connect-sheet-btn"
              onClick={onOpenSyncModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition shadow-xs"
            >
              <Sheet className="w-3.5 h-3.5" />
              <span>{isLo ? 'ເຊື່ອມຕໍ່ Google Sheets' : 'Connect Google Sheet'}</span>
            </button>
          )}

          {/* New Task Button */}
          <button
            id="add-task-header-btn"
            onClick={onAddTask}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isLo ? 'ເພີ່ມໜ້າວຽກ' : 'Add Task'}</span>
          </button>

          {/* Language Toggle */}
          <div className="flex items-center border border-slate-200 rounded-md overflow-hidden text-xs">
            <button
              id="lang-lo-btn"
              onClick={() => onLanguageChange('lo')}
              className={`px-2 py-1 transition ${
                isLo ? 'bg-slate-800 text-white font-medium' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              🇱🇦 ລາວ
            </button>
            <button
              id="lang-en-btn"
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 transition ${
                !isLo ? 'bg-slate-800 text-white font-medium' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              🇬🇧 EN
            </button>
          </div>

          {/* Google Auth Button / User Profile */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-slate-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {user.displayName || user.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  {user.email}
                </div>
              </div>
              <button
                id="signout-btn"
                onClick={onSignOut}
                title={isLo ? 'ອອກຈາກລະບົບ' : 'Sign out'}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="google-signin-btn"
              onClick={onSignIn}
              disabled={isSigningIn}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-md bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-xs transition"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isSigningIn ? (isLo ? 'ກຳລັງເຂົ້າສູ່ລະບົບ...' : 'Signing in...') : (isLo ? 'ເຂົ້າສູ່ລະບົບ Google' : 'Sign in')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between border-t border-slate-100 overflow-x-auto">
        <div className="flex items-center space-x-1 sm:space-x-2 py-1">
          <button
            id="view-tab-gantt"
            onClick={() => onViewChange('gantt')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition border-b-2 whitespace-nowrap ${
              currentView === 'gantt'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>{isLo ? 'ແຜນຜັງ Gantt (Gantt Chart)' : 'Gantt Chart'}</span>
          </button>

          <button
            id="view-tab-sheet"
            onClick={() => onViewChange('sheet')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition border-b-2 whitespace-nowrap ${
              currentView === 'sheet'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>{isLo ? 'ຕາຕະລາງໜ້າວຽກ (Task Sheet)' : 'Task Sheet'}</span>
          </button>

          <button
            id="view-tab-resources"
            onClick={() => onViewChange('resources')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition border-b-2 whitespace-nowrap ${
              currentView === 'resources'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isLo ? 'ຊັບພະຍາກອນ (Resources)' : 'Resource Pool'}</span>
          </button>

          <button
            id="view-tab-board"
            onClick={() => onViewChange('board')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition border-b-2 whitespace-nowrap ${
              currentView === 'board'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{isLo ? 'ກະດານວຽກ (Kanban Board)' : 'Kanban Board'}</span>
          </button>

          <button
            id="view-tab-summary"
            onClick={() => onViewChange('summary')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition border-b-2 whitespace-nowrap ${
              currentView === 'summary'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{isLo ? 'ສະຫຼຸບ KPI (Project Dashboard)' : 'Project Summary'}</span>
          </button>
        </div>

        {/* Sync Indicator info */}
        {lastSyncedAt && (
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {isLo ? 'ຊິງຄ໌ຫຼ້າສຸດ:' : 'Last synced:'} {lastSyncedAt}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
