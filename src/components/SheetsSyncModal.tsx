import React, { useState, useEffect } from 'react';
import {
  X,
  Sheet,
  ExternalLink,
  RefreshCw,
  Plus,
  Link,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  FileSpreadsheet,
  DownloadCloud,
  UploadCloud,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ProjectData, DriveSheetFile, Language } from '../types';

interface SheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  language: Language;
  isSignedIn: boolean;
  onSignIn: () => void;
  onCreateNewSheet: (title: string) => Promise<void>;
  onConnectExistingSheet: (sheetId: string, sheetName?: string) => Promise<void>;
  onDisconnectSheet: () => void;
  onPushToSheet: () => Promise<void>;
  onPullFromSheet: () => Promise<void>;
  onFetchDriveSheets: () => Promise<DriveSheetFile[]>;
  isSyncing: boolean;
}

export const SheetsSyncModal: React.FC<SheetsSyncModalProps> = ({
  isOpen,
  onClose,
  project,
  language,
  isSignedIn,
  onSignIn,
  onCreateNewSheet,
  onConnectExistingSheet,
  onDisconnectSheet,
  onPushToSheet,
  onPullFromSheet,
  onFetchDriveSheets,
  isSyncing,
}) => {
  if (!isOpen) return null;

  const isLo = language === 'lo';

  const [activeTab, setActiveTab] = useState<'status' | 'create' | 'link'>(
    project.spreadsheetId ? 'status' : 'create'
  );
  const [newTitle, setNewTitle] = useState(
    project.title ? `${project.title} - MS Project Plan` : 'Project Plan - MS Project'
  );
  const [manualSheetInput, setManualSheetInput] = useState('');
  const [driveFiles, setDriveFiles] = useState<DriveSheetFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'push' | 'pull' | 'disconnect' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch user's Google Drive spreadsheets when Link tab is opened
  useEffect(() => {
    if (activeTab === 'link' && isSignedIn) {
      setIsLoadingDrive(true);
      onFetchDriveSheets()
        .then((files) => setDriveFiles(files))
        .catch((err) => console.error('Failed to load drive files:', err))
        .finally(() => setIsLoadingDrive(false));
    }
  }, [activeTab, isSignedIn]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setActionError(null);
    try {
      await onCreateNewSheet(newTitle.trim());
      setActionSuccess(isLo ? 'ສ້າງ Google Sheet ສຳເລັດແລ້ວ!' : 'Google Sheet created successfully!');
      setActiveTab('status');
    } catch (err: any) {
      setActionError(err.message || 'Failed to create sheet');
    }
  };

  const handleLinkManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSheetInput.trim()) return;
    setActionError(null);

    // Extract ID from full URL if pasted
    let id = manualSheetInput.trim();
    const match = id.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      id = match[1];
    }

    try {
      await onConnectExistingSheet(id, 'Connected Project Sheet');
      setActionSuccess(isLo ? 'ເຊື່ອມຕໍ່ Google Sheet ສຳເລັດ!' : 'Connected successfully!');
      setActiveTab('status');
    } catch (err: any) {
      setActionError(err.message || 'Failed to connect sheet');
    }
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      if (confirmAction === 'push') {
        await onPushToSheet();
        setActionSuccess(isLo ? 'ບັນທຶກຂໍ້ມູນລົງ Google Sheets ສຳເລັດແລ້ວ!' : 'Synced to Google Sheets successfully!');
      } else if (confirmAction === 'pull') {
        await onPullFromSheet();
        setActionSuccess(isLo ? 'ດຶງຂໍ້ມູນລ້າສຸດຈາກ Google Sheets ສຳເລັດແລ້ວ!' : 'Pulled latest updates from Google Sheets!');
      } else if (confirmAction === 'disconnect') {
        onDisconnectSheet();
        setActiveTab('create');
      }
    } catch (err: any) {
      setActionError(err.message || 'Operation failed');
    } finally {
      setConfirmAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Sheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {isLo ? 'ເຊື່ອມຕໍ່ Google Sheets ແບບ Real-time' : 'Google Sheets Real-time Integration'}
              </h3>
              <p className="text-[11px] text-emerald-200">
                {isLo
                  ? 'ບັນທຶກ ແລະ ແບ່ງປັນຂໍ້ມູນໂຄງການໃຫ້ທີມງານເບິ່ງຮ່ວມກັນແບບ Real-time'
                  : 'Sync and collaborate on project schedules in real-time'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-emerald-700 rounded-lg text-emerald-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Required Warning */}
        {!isSignedIn && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                {isLo
                  ? 'ກະລຸນາເຂົ້າສູ່ລະບົບດ້ວຍບັນຊີ Google ເພື່ອເຂົ້າເຖິງ Google Drive ແລະ Google Sheets.'
                  : 'Please sign in with your Google Account to connect your spreadsheets.'}
              </span>
            </div>
            <button
              onClick={onSignIn}
              className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-md text-xs font-semibold whitespace-nowrap shadow-2xs"
            >
              {isLo ? 'ເຂົ້າສູ່ລະບົບ Google' : 'Sign In with Google'}
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 text-xs font-medium">
          {project.spreadsheetId && (
            <button
              onClick={() => setActiveTab('status')}
              className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'status'
                  ? 'border-emerald-600 text-emerald-800 font-bold bg-white rounded-t'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isLo ? 'ສະຖານະການຊິງຄ໌' : 'Sync Status'}</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-emerald-600 text-emerald-800 font-bold bg-white rounded-t'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isLo ? 'ສ້າງ Sheet ໃໝ່ໃນ Drive' : 'Create New Sheet'}</span>
          </button>

          <button
            onClick={() => setActiveTab('link')}
            className={`px-4 py-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'link'
                ? 'border-emerald-600 text-emerald-800 font-bold bg-white rounded-t'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>{isLo ? 'ເຊື່ອມຕໍ່ Sheet ທີ່ມີຢູ່ແລ້ວ' : 'Link Existing Sheet'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Notifications */}
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* TAB 1: STATUS (If sheet connected) */}
          {activeTab === 'status' && project.spreadsheetId && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      {isLo ? 'ໄຟລ໌ GOOGLE SPREADSHEET ທີ່ເຊື່ອມຕໍ່' : 'Connected Spreadsheet'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {project.spreadsheetName || 'Project Plan'}
                      <a
                        href={project.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${project.spreadsheetId}/edit`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 font-semibold underline text-xs"
                      >
                        <span>{isLo ? 'ເປີດໃນ Google Sheets' : 'Open in Sheets'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      ID: {project.spreadsheetId}
                    </p>
                  </div>
                </div>

                {project.lastSyncedAt && (
                  <div className="flex items-center gap-1.5 text-slate-600 text-[11px] pt-2 border-t border-emerald-200/60">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isLo ? 'ເວລາຊິງຄ໌ຫຼ້າສຸດ:' : 'Last Synced:'} {project.lastSyncedAt}</span>
                  </div>
                )}
              </div>

              {/* Two-way Sync Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Push to Sheets */}
                <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold">
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    <span>{isLo ? 'ບັນທຶກລົງ Sheet (Push)' : 'Push to Google Sheet'}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    {isLo
                      ? 'ອັບເດດໜ້າວຽກ, WBS, ໄລຍະເວລາ ແລະ ຊັບພະຍາກອນຈາກເວັບລົງໃນ Google Sheet'
                      : 'Write current WBS tasks, schedules, and resources to the Google Sheet.'}
                  </p>
                  <button
                    onClick={() => setConfirmAction('push')}
                    disabled={isSyncing || !isSignedIn}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isLo ? 'ບັນທຶກລົງ Sheet ດຽວນີ້' : 'Sync Now to Sheet'}</span>
                  </button>
                </div>

                {/* Pull from Sheets */}
                <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold">
                    <DownloadCloud className="w-4 h-4 text-emerald-600" />
                    <span>{isLo ? 'ດຶງຂໍ້ມູນຈາກ Sheet (Pull)' : 'Pull from Google Sheet'}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    {isLo
                      ? 'ດຶງການປ່ຽນແປງທີ່ທີມງານແກ້ໄຂໃນ Google Sheet ກັບມາສະແດງໃນແອັບ'
                      : 'Import updates made by teammates in the Google Sheet into this app.'}
                  </p>
                  <button
                    onClick={() => setConfirmAction('pull')}
                    disabled={isSyncing || !isSignedIn}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>{isLo ? 'ດຶງຂໍ້ມູນຈາກ Sheet' : 'Fetch Updates from Sheet'}</span>
                  </button>
                </div>
              </div>

              {/* How Team Works Together */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-slate-600">
                <span className="font-semibold text-slate-800">
                  {isLo ? '💡 ວິທີເຮັດວຽກຮ່ວມກັນໃນທີມ (Team Real-time Collaboration):' : '💡 Team Collaboration Guide:'}
                </span>
                <p className="text-[11px]">
                  {isLo
                    ? '1. ກົດເປີດ Sheet ຜ່ານລິ້ງດ້ານເທິງ > ແບ່ງປັນ (Share) ໃຫ້ສະມາຊິກໃນທີມ.'
                    : '1. Click "Open in Sheets" above > Share with your project team.'}
                  <br />
                  {isLo
                    ? '2. ທີມງານສາມາດເບິ່ງ ຫຼື ແກ້ໄຂວຽກ, ສະຖານະ, ຜູ້ຮັບຜິດຊອບໃນ Sheet ໄດ້ພ້ອມກັນ.'
                    : '2. Teammates can view and update tasks, statuses, and assignees directly in Google Sheets.'}
                  <br />
                  {isLo
                    ? '3. ກົດ "ດຶງຂໍ້ມູນຈາກ Sheet" ເພື່ອໃຫ້ແອັບອັບເດດຕາມການປ່ຽນແປງຂອງທີມງານ.'
                    : '3. Click "Fetch Updates from Sheet" anytime to synchronize team edits into this app.'}
                </p>
              </div>

              {/* Disconnect Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setConfirmAction('disconnect')}
                  className="text-rose-600 hover:text-rose-800 text-xs font-medium underline"
                >
                  {isLo ? 'ຕັດການເຊື່ອມຕໍ່ Google Sheet ນີ້' : 'Disconnect this Google Sheet'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CREATE NEW SPREADSHEET */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  {isLo ? 'ສ້າງ Google Sheet ໃໝ່ອັດຕະໂນມັດ' : 'Create a New Google Spreadsheet'}
                </h4>
                <p className="text-slate-500">
                  {isLo
                    ? 'ລະບົບຈະສ້າງໄຟລ໌ Google Sheet ໃນ Google Drive ຂອງທ່ານ ພ້ອມຕາຕະລາງ Tasks ແລະ Resources ທີ່ຈັດຮູບແບບຢ່າງສວຍງາມ.'
                    : 'A new Google Spreadsheet will be created in your Google Drive with formatted Tasks and Resources sheets.'}
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {isLo ? 'ຊື່ໄຟລ໌ Spreadsheet *' : 'Spreadsheet Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1 text-emerald-900">
                <span className="font-semibold">
                  {isLo ? 'ໂຄງສ້າງທີ່ຈະຖືກສ້າງໃນ Google Sheet:' : 'Structure to be created in Google Sheet:'}
                </span>
                <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-emerald-800">
                  <li>{isLo ? 'ແຖບ "Tasks": ຊື່ວຽກ, WBS, ໄລຍະເວລາ, ວັນທີເລີ່ມ-ສິ້ນສຸດ, % ຄວາມຄືບໜ້າ, ສະຖານະ, ຜູ້ຮັບຜິດຊອບ, ວຽກກ່ອນໜ້າ' : 'Tab "Tasks": Task Name, WBS, Duration, Start/End Dates, Progress %, Status, Assignees, Predecessors'}</li>
                  <li>{isLo ? 'ແຖບ "Resources": ຊື່ຊັບພະຍາກອນ, ຕຳແໜ່ງ, ປະເພດ, ຄວາມສາມາດ (Capacity), ອັດຕາຄ່າຈ້າງ' : 'Tab "Resources": Name, Role, Type, Capacity %, Hourly Rate'}</li>
                </ul>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSyncing || !isSignedIn}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg font-semibold transition flex items-center gap-2 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isLo ? 'ສ້າງໄຟລ໌ ແລະ ເຊື່ອມຕໍ່ທັນທີ' : 'Create & Connect Spreadsheet'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: LINK EXISTING SPREADSHEET */}
          {activeTab === 'link' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  {isLo ? 'ເລືອກ Google Sheet ຈາກ Drive ຫຼື ວາງ Link' : 'Select Sheet from Drive or Paste URL'}
                </h4>
                <p className="text-slate-500">
                  {isLo
                    ? 'ທ່ານສາມາດເລືອກໄຟລ໌ Sheet ທີ່ເຄີຍສ້າງໄວ້ ຫຼື ວາງ URL / Spreadsheet ID.'
                    : 'Select a spreadsheet from your Google Drive or enter a Spreadsheet ID.'}
                </p>
              </div>

              {/* Manual URL / ID input */}
              <form onSubmit={handleLinkManual} className="flex gap-2">
                <input
                  type="text"
                  value={manualSheetInput}
                  onChange={(e) => setManualSheetInput(e.target.value)}
                  placeholder={isLo ? 'ວາງ Google Sheets URL ຫຼື Spreadsheet ID...' : 'Paste Google Sheet URL or ID...'}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isSyncing || !isSignedIn || !manualSheetInput.trim()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg font-semibold transition whitespace-nowrap"
                >
                  {isLo ? 'ເຊື່ອມຕໍ່' : 'Connect'}
                </button>
              </form>

              {/* Recent Drive Spreadsheets list */}
              <div className="space-y-2 pt-2">
                <span className="font-semibold text-slate-700 block">
                  {isLo ? 'ໄຟລ໌ Google Sheet ໃນ Drive ຂອງທ່ານ:' : 'Your Google Drive Spreadsheets:'}
                </span>

                {isLoadingDrive ? (
                  <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isLo ? 'ກຳລັງໂຫຼດລາຍການໄຟລ໌...' : 'Loading files from Drive...'}</span>
                  </div>
                ) : driveFiles.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-52 overflow-y-auto">
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 flex items-center justify-between hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800 truncate">{file.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              ID: {file.id}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            try {
                              await onConnectExistingSheet(file.id, file.name);
                              setActiveTab('status');
                            } catch (err: any) {
                              setActionError(err.message || 'Failed to connect');
                            }
                          }}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold text-xs border border-emerald-200 transition ml-2 flex-shrink-0"
                        >
                          {isLo ? 'ເລືອກໄຟລ໌ນີ້' : 'Select'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400 italic">
                    {isLo ? 'ບໍ່ພົບໄຟລ໌ Google Sheet ໃນ Drive ຫຼື ຍັງບໍ່ໄດ້ເຊື່ອມຕໍ່' : 'No spreadsheets found in Drive'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Dialog (Mandatory for Workspace mutating actions) */}
        {confirmAction && (
          <div className="absolute inset-0 z-20 bg-slate-900/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>{isLo ? 'ຢືນຢັນການດຳເນີນການ' : 'Confirm Action'}</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {confirmAction === 'push' &&
                  (isLo
                    ? `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການບັນທຶກ ແລະ ຂຽນທັບຂໍ້ມູນໜ້າວຽກ ແລະ ຊັບພະຍາກອນລົງໃນ Google Sheet "${project.spreadsheetName || 'Project Plan'}"?`
                    : `Are you sure you want to write and sync all tasks and resources to Google Sheet "${project.spreadsheetName || 'Project Plan'}"?`)}

                {confirmAction === 'pull' &&
                  (isLo
                    ? `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການດຶງຂໍ້ມູນລ້າສຸດຈາກ Google Sheet? ຂໍ້ມູນໃນແອັບຈະຖືກອັບເດດຕາມ Sheet.`
                    : `Are you sure you want to import latest data from the Google Sheet? Current app tasks will be synchronized.`)}

                {confirmAction === 'disconnect' &&
                  (isLo
                    ? `ຕ້ອງການຕັດການເຊື່ອມຕໍ່ກັບ Google Sheet ນີ້ບໍ? ຂໍ້ມູນໃນ Google Sheet ຈະຍັງຄົງຢູ່ບໍ່ຖືກລຶບ.`
                    : `Disconnect this Google Sheet? The data inside Google Sheets will remain intact.`)}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-xs transition"
                >
                  {isLo ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  onClick={executeConfirmedAction}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs transition"
                >
                  {isLo ? 'ຢືນຢັນ' : 'Confirm & Proceed'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
