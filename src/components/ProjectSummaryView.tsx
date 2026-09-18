import React from 'react';
import { Task, Resource, ProjectData, Language } from '../types';
import { STATUS_CONFIG, formatDateDisplay } from '../utils/projectUtils';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Flag,
  Sheet,
} from 'lucide-react';

interface ProjectSummaryViewProps {
  project: ProjectData;
  tasks: Task[];
  resources: Resource[];
  language: Language;
  onOpenSyncModal: () => void;
}

export const ProjectSummaryView: React.FC<ProjectSummaryViewProps> = ({
  project,
  tasks,
  resources,
  language,
  onOpenSyncModal,
}) => {
  const isLo = language === 'lo';

  const nonSummaryTasks = tasks.filter((t) => !t.isSummary);
  const totalTasks = nonSummaryTasks.length;
  const completedTasks = nonSummaryTasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = nonSummaryTasks.filter((t) => t.status === 'in_progress').length;
  const delayedTasks = nonSummaryTasks.filter((t) => t.status === 'delayed').length;
  const notStartedTasks = nonSummaryTasks.filter((t) => t.status === 'not_started').length;

  const overallProgress =
    totalTasks > 0
      ? Math.round(nonSummaryTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / totalTasks)
      : 0;

  const totalDurationDays = nonSummaryTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const milestones = tasks.filter((t) => t.isMilestone);

  // Approximate cost calculation: resource standard rate * 8 hours/day * task duration
  const resourceMap = new Map<string, Resource>();
  resources.forEach((r) => resourceMap.set(r.id, r));

  let estimatedTotalLaborCost = 0;
  nonSummaryTasks.forEach((t) => {
    t.assigneeIds.forEach((resId) => {
      const res = resourceMap.get(resId);
      if (res && res.type === 'work') {
        estimatedTotalLaborCost += (t.duration || 1) * 8 * res.hourlyRate;
      }
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Completion */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{isLo ? 'ຄວາມຄືບໜ້າລວມ' : 'Overall Progress'}</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{overallProgress}%</span>
            <span className="text-xs text-slate-500 font-medium">
              {completedTasks}/{totalTasks} {isLo ? 'ໜ້າວຽກ' : 'tasks'}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-2">
            <div
              style={{ width: `${overallProgress}%` }}
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
            />
          </div>
        </div>

        {/* Total Working Days */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{isLo ? 'ໄລຍະເວລາລວມ' : 'Total Work Days'}</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{totalDurationDays}</span>
            <span className="text-xs text-slate-500 font-medium">{isLo ? 'ມື້ເຮັດວຽກ' : 'working days'}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isLo ? 'ຄຳນວນຈາກຜົນລວມຂອງທຸກໜ້າວຽກຍ່ອຍ' : 'Calculated across all subtasks'}
          </p>
        </div>

        {/* Resources Allocated */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{isLo ? 'ທີມງານ & ຊັບພະຍາກອນ' : 'Resource Pool'}</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{resources.length}</span>
            <span className="text-xs text-slate-500 font-medium">{isLo ? 'ຄົນ' : 'members'}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isLo ? 'ຄວາມສາມາດສະເລ່ຍ: 100% capacity' : 'Average capacity: 100%'}
          </p>
        </div>

        {/* Estimated Labor Cost */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{isLo ? 'ປະເມີນຄ່າໃຊ້ຈ່າຍແຮງງານ' : 'Estimated Labor Cost'}</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              ${estimatedTotalLaborCost.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">USD</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isLo ? 'ອີງຕາມອັດຕາຊົ່ວໂມງຂອງຊັບພະຍາກອນ' : 'Based on resource standard rates'}
          </p>
        </div>
      </div>

      {/* Task Status Breakdown & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            {isLo ? 'ສະຖານະໜ້າວຽກປັດຈຸບັນ (Task Status Breakdown)' : 'Task Status Breakdown'}
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isLo ? 'ສຳເລັດແລ້ວ (Completed)' : 'Completed'}
                </span>
                <span className="font-mono">{completedTasks} / {totalTasks}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-blue-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {isLo ? 'ກຳລັງດຳເນີນການ (In Progress)' : 'In Progress'}
                </span>
                <span className="font-mono">{inProgressTasks} / {totalTasks}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {isLo ? 'ຍັງບໍ່ເລີ່ມ (Not Started)' : 'Not Started'}
                </span>
                <span className="font-mono">{notStartedTasks} / {totalTasks}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  style={{ width: `${totalTasks > 0 ? (notStartedTasks / totalTasks) * 100 : 0}%` }}
                  className="h-full bg-slate-400 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isLo ? 'ຊັກຊ້າ / ມີບັນຫາ (Delayed)' : 'Delayed'}
                </span>
                <span className="font-mono">{delayedTasks} / {totalTasks}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  style={{ width: `${totalTasks > 0 ? (delayedTasks / totalTasks) * 100 : 0}%` }}
                  className="h-full bg-rose-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Milestones Tracker */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Flag className="w-4 h-4 text-amber-500" />
              <span>{isLo ? 'ຈຸດໝາຍສຳຄັນຂອງໂຄງການ (Milestones)' : 'Key Milestones'}</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {milestones.filter((m) => m.progress === 100).length} / {milestones.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {milestones.map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-3.5 h-3.5 rotate-45 transform border-2 border-white shadow-2xs flex-shrink-0 ${
                      m.progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <div className="truncate">
                    <span className="font-semibold text-slate-800">{m.name}</span>
                    <span className="text-slate-400 font-mono text-[10px] ml-1.5">WBS {m.wbs}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-[11px] text-slate-600">
                    {formatDateDisplay(m.startDate)}
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      m.progress === 100 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {m.progress === 100 ? (isLo ? 'ສຳເລັດ' : 'Achieved') : (isLo ? 'ຍັງບໍ່ຮອດ' : 'Pending')}
                  </span>
                </div>
              </div>
            ))}

            {milestones.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400 italic">
                {isLo ? 'ຍັງບໍ່ມີການກຳນົດ Milestone' : 'No milestones defined'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Collaboration Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-lg">
            <Sheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-950">
              {isLo
                ? 'ເຊື່ອມຕໍ່ຂໍ້ມູນຮ່ວມກັນໃນທີມຜ່ານ Google Sheets Real-time'
                : 'Real-time Team Collaboration with Google Sheets'}
            </h4>
            <p className="text-xs text-emerald-800 mt-0.5">
              {isLo
                ? 'ຂໍ້ມູນທັງໝົດຈະຖືກບັນທຶກ ແລະ ສາມາດແບ່ງປັນໃຫ້ທີມງານເປີດເບິ່ງ ຫຼື ແກ້ໄຂຮ່ວມກັນໃນ Google Spreadsheet ໄດ້ຕະຫຼອດເວລາ.'
                : 'Project plan data is synced directly to Google Sheets for team-wide real-time visibility and editing.'}
            </p>
          </div>
        </div>

        <button
          id="summary-open-sheets-modal-btn"
          onClick={onOpenSyncModal}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition shadow-xs"
        >
          {project.spreadsheetId
            ? isLo
              ? 'ຈັດການການເຊື່ອມຕໍ່ Sheet'
              : 'Manage Connected Sheet'
            : isLo
            ? 'ເຊື່ອມຕໍ່ Google Sheet ດຽວນີ້'
            : 'Connect Google Sheet'}
        </button>
      </div>
    </div>
  );
};
