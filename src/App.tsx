import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { Task, Resource, ProjectData, ViewMode, Language, DriveSheetFile } from './types';
import {
  INITIAL_PROJECT,
  INITIAL_TASKS,
  INITIAL_RESOURCES,
  recalculateWbsAndRollups,
} from './utils/projectUtils';
import { initAuth, googleSignIn, getAccessToken, logout } from './services/auth';
import {
  createProjectSpreadsheet,
  exportToGoogleSheets,
  importFromGoogleSheets,
  listDriveSpreadsheets,
} from './services/sheetsService';

import { Header } from './components/Header';
import { GanttView } from './components/GanttView';
import { TaskSheetView } from './components/TaskSheetView';
import { ResourceManagementView } from './components/ResourceManagementView';
import { KanbanBoardView } from './components/KanbanBoardView';
import { ProjectSummaryView } from './components/ProjectSummaryView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { SheetsSyncModal } from './components/SheetsSyncModal';

const STORAGE_KEY_TASKS = 'msproject_tasks_v1';
const STORAGE_KEY_RESOURCES = 'msproject_resources_v1';
const STORAGE_KEY_PROJECT = 'msproject_project_v1';
const STORAGE_KEY_LANG = 'msproject_lang_v1';

export default function App() {
  // 1. Language state
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    return (saved === 'en' ? 'en' : 'lo') as Language;
  });

  // 2. Project data state
  const [project, setProject] = useState<ProjectData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECT);
      return saved ? JSON.parse(saved) : INITIAL_PROJECT;
    } catch {
      return INITIAL_PROJECT;
    }
  });

  // 3. Tasks state
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return recalculateWbsAndRollups(parsed);
      }
    } catch (e) {
      console.warn('Failed to restore tasks from storage:', e);
    }
    return recalculateWbsAndRollups(INITIAL_TASKS);
  });

  // 4. Resources state
  const [resources, setResources] = useState<Resource[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RESOURCES);
      return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
    } catch {
      return INITIAL_RESOURCES;
    }
  });

  // 5. Views and navigation
  const [currentView, setCurrentView] = useState<ViewMode>('gantt');
  const [user, setUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Save to localStorage whenever project, tasks, or resources change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROJECT, JSON.stringify(project));
  }, [project]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LANG, language);
  }, [language]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Google Sign-in Handler
  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        showToast(
          language === 'lo'
            ? `ຍິນດີຕ້ອນຮັບ ${result.user.displayName || result.user.email}!`
            : `Welcome ${result.user.displayName || result.user.email}!`
        );
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      showToast(language === 'lo' ? 'ການເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ ກະລຸນາລອງໃໝ່' : 'Sign-in failed. Please retry.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    showToast(language === 'lo' ? 'ອອກຈາກລະບົບແລ້ວ' : 'Signed out');
  };

  // Push updates to Google Sheets
  const handlePushToSheet = useCallback(async () => {
    if (!project.spreadsheetId) {
      setShowSyncModal(true);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setShowSyncModal(true);
      return;
    }

    setIsSyncing(true);
    try {
      await exportToGoogleSheets(token, project.spreadsheetId, tasks, resources);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setProject((prev) => ({ ...prev, lastSyncedAt: now }));
      showToast(
        language === 'lo'
          ? 'ບັນທຶກ ແລະ ຊິງຄ໌ຂໍ້ມູນລົງ Google Sheets ສຳເລັດແລ້ວ!'
          : 'Successfully synced to Google Sheets!'
      );
    } catch (err: any) {
      console.error('Push to sheets failed:', err);
      showToast(err.message || 'Sync failed');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [project.spreadsheetId, tasks, resources, language]);

  // Pull latest updates from Google Sheets
  const handlePullFromSheet = useCallback(async () => {
    if (!project.spreadsheetId) return;
    const token = getAccessToken();
    if (!token) {
      setShowSyncModal(true);
      return;
    }

    setIsSyncing(true);
    try {
      const { tasks: importedTasks, resources: importedResources } = await importFromGoogleSheets(
        token,
        project.spreadsheetId
      );

      if (importedTasks && importedTasks.length > 0) {
        const recalculated = recalculateWbsAndRollups(importedTasks);
        setTasks(recalculated);
      }

      if (importedResources && importedResources.length > 0) {
        setResources(importedResources);
      }

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setProject((prev) => ({ ...prev, lastSyncedAt: now }));
      showToast(
        language === 'lo'
          ? 'ດຶງຂໍ້ມູນລ້າສຸດຈາກ Google Sheets ສຳເລັດແລ້ວ!'
          : 'Successfully imported updates from Google Sheets!'
      );
    } catch (err: any) {
      console.error('Pull from sheets failed:', err);
      showToast(err.message || 'Import failed');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [project.spreadsheetId, language]);

  // Create new spreadsheet
  const handleCreateNewSheet = async (title: string) => {
    const token = getAccessToken();
    if (!token) throw new Error('Please sign in first');

    setIsSyncing(true);
    try {
      const newSheet = await createProjectSpreadsheet(token, title, tasks, resources);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setProject((prev) => ({
        ...prev,
        spreadsheetId: newSheet.id,
        spreadsheetUrl: newSheet.url,
        spreadsheetName: newSheet.name,
        lastSyncedAt: now,
      }));

      showToast(
        language === 'lo'
          ? `ສ້າງ Google Sheet "${newSheet.name}" ສຳເລັດແລ້ວ!`
          : `Created Google Sheet "${newSheet.name}"!`
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Connect existing spreadsheet
  const handleConnectExistingSheet = async (sheetId: string, sheetName?: string) => {
    const token = getAccessToken();
    if (!token) throw new Error('Please sign in first');

    setIsSyncing(true);
    try {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

      setProject((prev) => ({
        ...prev,
        spreadsheetId: sheetId,
        spreadsheetUrl: url,
        spreadsheetName: sheetName || 'Connected Project Sheet',
        lastSyncedAt: now,
      }));

      // Export current tasks to establish formatted headers if needed
      await exportToGoogleSheets(token, sheetId, tasks, resources);
      showToast(
        language === 'lo'
          ? 'ເຊື່ອມຕໍ່ ແລະ ຊິງຄ໌ຂໍ້ມູນກັບ Google Sheet ສຳເລັດແລ້ວ!'
          : 'Connected & synced with Google Sheet!'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectSheet = () => {
    setProject((prev) => ({
      ...prev,
      spreadsheetId: undefined,
      spreadsheetUrl: undefined,
      spreadsheetName: undefined,
      lastSyncedAt: undefined,
    }));
    showToast(language === 'lo' ? 'ຕັດການເຊື່ອມຕໍ່ Google Sheet ແລ້ວ' : 'Disconnected Google Sheet');
  };

  const handleFetchDriveSheets = async (): Promise<DriveSheetFile[]> => {
    const token = getAccessToken();
    if (!token) return [];
    return await listDriveSpreadsheets(token);
  };

  // Task Manipulation Functions
  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) => {
      const index = prev.findIndex((t) => t.id === updatedTask.id);
      if (index === -1) return prev;
      const updated = [...prev];
      updated[index] = updatedTask;
      return recalculateWbsAndRollups(updated);
    });
  };

  const handleAddTask = (parentId?: string | null) => {
    setTasks((prev) => {
      const today = new Date().toISOString().split('T')[0];
      const end = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

      let newIndent = 0;
      let insertIndex = prev.length;

      if (parentId) {
        const parentIndex = prev.findIndex((t) => t.id === parentId);
        if (parentIndex !== -1) {
          newIndent = (prev[parentIndex].indent || 0) + 1;
          // Find end of parent's subtree to insert below
          insertIndex = parentIndex + 1;
          while (insertIndex < prev.length && prev[insertIndex].indent >= newIndent) {
            insertIndex++;
          }
        }
      }

      const newTask: Task = {
        id: `task-${Date.now()}`,
        wbs: '',
        name:
          language === 'lo'
            ? newIndent > 0
              ? 'ໜ້າວຽກຍ່ອຍໃໝ່ (New Subtask)'
              : 'ໜ້າວຽກໃໝ່ (New Task)'
            : newIndent > 0
            ? 'New Subtask'
            : 'New Task',
        parentId: parentId || null,
        indent: newIndent,
        startDate: today,
        endDate: end,
        duration: 5,
        progress: 0,
        status: 'not_started',
        priority: 'medium',
        assigneeIds: [],
        predecessors: [],
      };

      const updated = [...prev];
      updated.splice(insertIndex, 0, newTask);
      return recalculateWbsAndRollups(updated);
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => {
      const target = prev.find((t) => t.id === taskId);
      if (!target) return prev;

      // Delete task and its children (tasks immediately following with higher indent)
      const targetIndex = prev.findIndex((t) => t.id === taskId);
      let deleteCount = 1;
      while (
        targetIndex + deleteCount < prev.length &&
        prev[targetIndex + deleteCount].indent > target.indent
      ) {
        deleteCount++;
      }

      const updated = [...prev];
      updated.splice(targetIndex, deleteCount);
      return recalculateWbsAndRollups(updated);
    });
  };

  const handleIndentTask = (taskId: string) => {
    setTasks((prev) => {
      const index = prev.findIndex((t) => t.id === taskId);
      if (index <= 0) return prev; // Cannot indent top item
      const updated = [...prev];
      const prevTask = updated[index - 1];

      // Max indent is prevTask.indent + 1
      if (updated[index].indent <= prevTask.indent) {
        updated[index] = {
          ...updated[index],
          indent: updated[index].indent + 1,
          parentId: prevTask.id,
        };
      }
      return recalculateWbsAndRollups(updated);
    });
  };

  const handleOutdentTask = (taskId: string) => {
    setTasks((prev) => {
      const index = prev.findIndex((t) => t.id === taskId);
      if (index === -1 || prev[index].indent <= 0) return prev;

      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        indent: Math.max(0, updated[index].indent - 1),
        parentId: updated[index].indent - 1 === 0 ? null : updated[index].parentId,
      };
      return recalculateWbsAndRollups(updated);
    });
  };

  const handleMoveTaskUp = (taskId: string) => {
    setTasks((prev) => {
      const index = prev.findIndex((t) => t.id === taskId);
      if (index <= 0) return prev;
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return recalculateWbsAndRollups(updated);
    });
  };

  const handleMoveTaskDown = (taskId: string) => {
    setTasks((prev) => {
      const index = prev.findIndex((t) => t.id === taskId);
      if (index === -1 || index >= prev.length - 1) return prev;
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return recalculateWbsAndRollups(updated);
    });
  };

  // Resource Pool Handlers
  const handleAddResource = (newRes: Resource) => {
    setResources((prev) => [...prev, newRes]);
    showToast(
      language === 'lo' ? `ເພີ່ມຊັບພະຍາກອນ ${newRes.name} ສຳເລັດ!` : `Added resource ${newRes.name}!`
    );
  };

  const handleUpdateResource = (updatedRes: Resource) => {
    setResources((prev) => prev.map((r) => (r.id === updatedRes.id ? updatedRes : r)));
    showToast(
      language === 'lo' ? `ອັບເດດຊັບພະຍາກອນ ${updatedRes.name} ແລ້ວ` : `Updated ${updatedRes.name}`
    );
  };

  const handleDeleteResource = (resourceId: string) => {
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
    // Remove from assigned tasks
    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        assigneeIds: t.assigneeIds.filter((id) => id !== resourceId),
      }))
    );
    showToast(language === 'lo' ? 'ລຶບຊັບພະຍາກອນສຳເລັດ' : 'Resource removed');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 animate-fade-in border border-slate-700">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Application Header */}
      <Header
        project={project}
        onUpdateProjectTitle={(title) => setProject((prev) => ({ ...prev, title }))}
        currentView={currentView}
        onViewChange={setCurrentView}
        language={language}
        onLanguageChange={setLanguage}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isSigningIn={isSigningIn}
        onOpenSyncModal={() => setShowSyncModal(true)}
        isSyncing={isSyncing}
        lastSyncedAt={project.lastSyncedAt}
        onSyncNow={handlePushToSheet}
        onAddTask={() => handleAddTask(null)}
      />

      {/* Main View Display */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentView === 'gantt' && (
          <GanttView
            tasks={tasks}
            resources={resources}
            language={language}
            onUpdateTask={handleUpdateTask}
            onSelectTask={setSelectedTaskForDetail}
            onAddTask={handleAddTask}
            onIndentTask={handleIndentTask}
            onOutdentTask={handleOutdentTask}
            onMoveTaskUp={handleMoveTaskUp}
            onMoveTaskDown={handleMoveTaskDown}
          />
        )}

        {currentView === 'sheet' && (
          <TaskSheetView
            tasks={tasks}
            resources={resources}
            language={language}
            onUpdateTask={handleUpdateTask}
            onSelectTask={setSelectedTaskForDetail}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onIndentTask={handleIndentTask}
            onOutdentTask={handleOutdentTask}
            onMoveTaskUp={handleMoveTaskUp}
            onMoveTaskDown={handleMoveTaskDown}
          />
        )}

        {currentView === 'resources' && (
          <ResourceManagementView
            resources={resources}
            tasks={tasks}
            language={language}
            onAddResource={handleAddResource}
            onUpdateResource={handleUpdateResource}
            onDeleteResource={handleDeleteResource}
          />
        )}

        {currentView === 'board' && (
          <KanbanBoardView
            tasks={tasks}
            resources={resources}
            language={language}
            onUpdateTask={handleUpdateTask}
            onSelectTask={setSelectedTaskForDetail}
            onAddTask={() => handleAddTask(null)}
          />
        )}

        {currentView === 'summary' && (
          <ProjectSummaryView
            project={project}
            tasks={tasks}
            resources={resources}
            language={language}
            onOpenSyncModal={() => setShowSyncModal(true)}
          />
        )}
      </main>

      {/* Task Details Edit Modal */}
      {selectedTaskForDetail && (
        <TaskDetailModal
          task={selectedTaskForDetail}
          tasks={tasks}
          resources={resources}
          language={language}
          onClose={() => setSelectedTaskForDetail(null)}
          onSave={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Google Sheets Real-time Sync Modal */}
      <SheetsSyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        project={project}
        language={language}
        isSignedIn={Boolean(user)}
        onSignIn={handleSignIn}
        onCreateNewSheet={handleCreateNewSheet}
        onConnectExistingSheet={handleConnectExistingSheet}
        onDisconnectSheet={handleDisconnectSheet}
        onPushToSheet={handlePushToSheet}
        onPullFromSheet={handlePullFromSheet}
        onFetchDriveSheets={handleFetchDriveSheets}
        isSyncing={isSyncing}
      />
    </div>
  );
}
