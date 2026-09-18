import React, { useState } from 'react';
import {
  Plus,
  ArrowRightToLine,
  ArrowLeftToLine,
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit,
  Search,
  CheckCircle,
  Flag,
  Users,
} from 'lucide-react';
import { Task, Resource, Language, TaskStatus, TaskPriority } from '../types';
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDateDisplay } from '../utils/projectUtils';

interface TaskSheetViewProps {
  tasks: Task[];
  resources: Resource[];
  language: Language;
  onUpdateTask: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onAddTask: (parentId?: string | null) => void;
  onDeleteTask: (taskId: string) => void;
  onIndentTask: (taskId: string) => void;
  onOutdentTask: (taskId: string) => void;
  onMoveTaskUp: (taskId: string) => void;
  onMoveTaskDown: (taskId: string) => void;
}

export const TaskSheetView: React.FC<TaskSheetViewProps> = ({
  tasks,
  resources,
  language,
  onUpdateTask,
  onSelectTask,
  onAddTask,
  onDeleteTask,
  onIndentTask,
  onOutdentTask,
  onMoveTaskUp,
  onMoveTaskDown,
}) => {
  const isLo = language === 'lo';
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const resourceMap = new Map<string, Resource>();
  resources.forEach((r) => resourceMap.set(r.id, r));

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.wbs.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] bg-white">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 gap-3">
        {/* WBS manipulation buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            id="sheet-add-task-btn"
            onClick={() => onAddTask(null)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isLo ? 'ເພີ່ມໜ້າວຽກໃໝ່' : 'New Task'}</span>
          </button>

          <button
            id="sheet-add-subtask-btn"
            disabled={!selectedTaskId}
            onClick={() => selectedTaskId && onAddTask(selectedTaskId)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 text-slate-700 rounded text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>{isLo ? 'ເພີ່ມວຽກຍ່ອຍ (Subtask)' : 'Add Subtask'}</span>
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button
            id="sheet-indent-btn"
            disabled={!selectedTaskId}
            onClick={() => selectedTaskId && onIndentTask(selectedTaskId)}
            className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded text-slate-700 transition"
            title={isLo ? 'ຫຍໍ້ໜ້າເຂົ້າ (Indent)' : 'Indent'}
          >
            <ArrowRightToLine className="w-3.5 h-3.5" />
          </button>

          <button
            id="sheet-outdent-btn"
            disabled={!selectedTaskId}
            onClick={() => selectedTaskId && onOutdentTask(selectedTaskId)}
            className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded text-slate-700 transition"
            title={isLo ? 'ຫຍໍ້ໜ້າອອກ (Outdent)' : 'Outdent'}
          >
            <ArrowLeftToLine className="w-3.5 h-3.5" />
          </button>

          <button
            id="sheet-move-up-btn"
            disabled={!selectedTaskId}
            onClick={() => selectedTaskId && onMoveTaskUp(selectedTaskId)}
            className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded text-slate-700 transition"
            title={isLo ? 'ຍ້າຍຂຶ້ນເທິງ' : 'Move Up'}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          <button
            id="sheet-move-down-btn"
            disabled={!selectedTaskId}
            onClick={() => selectedTaskId && onMoveTaskDown(selectedTaskId)}
            className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded text-slate-700 transition"
            title={isLo ? 'ຍ້າຍລົງລຸ່ມ' : 'Move Down'}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {selectedTaskId && (
            <button
              id="sheet-delete-btn"
              onClick={() => {
                if (window.confirm(isLo ? 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບໜ້າວຽກນີ້?' : 'Are you sure you want to delete this task?')) {
                  onDeleteTask(selectedTaskId);
                  setSelectedTaskId(null);
                }
              }}
              className="p-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded transition ml-1"
              title={isLo ? 'ລຶບໜ້າວຽກ' : 'Delete Task'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters & Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isLo ? 'ຄົ້ນຫາໜ້າວຽກ...' : 'Search tasks...'}
              className="pl-8 pr-3 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 w-44 sm:w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700"
          >
            <option value="all">{isLo ? 'ທຸກສະຖານະ' : 'All Status'}</option>
            <option value="not_started">{isLo ? 'ຍັງບໍ່ເລີ່ມ' : 'Not Started'}</option>
            <option value="in_progress">{isLo ? 'ກຳລັງດຳເນີນການ' : 'In Progress'}</option>
            <option value="completed">{isLo ? 'ສຳເລັດແລ້ວ' : 'Completed'}</option>
            <option value="on_hold">{isLo ? 'ໂຈະຊົ່ວຄາວ' : 'On Hold'}</option>
            <option value="delayed">{isLo ? 'ຊັກຊ້າ' : 'Delayed'}</option>
          </select>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-300 font-semibold">
            <tr className="h-10">
              <th className="px-3 py-2 w-16 text-center border-r border-slate-200">WBS</th>
              <th className="px-3 py-2 min-w-[280px] border-r border-slate-200">
                {isLo ? 'ຊື່ໜ້າວຽກ (Task Name)' : 'Task Name'}
              </th>
              <th className="px-2 py-2 w-20 text-center border-r border-slate-200">
                {isLo ? 'ໄລຍະເວລາ (ມື້)' : 'Duration (d)'}
              </th>
              <th className="px-3 py-2 w-28 text-center border-r border-slate-200">
                {isLo ? 'ວັນທີເລີ່ມ' : 'Start Date'}
              </th>
              <th className="px-3 py-2 w-28 text-center border-r border-slate-200">
                {isLo ? 'ວັນທີສິ້ນສຸດ' : 'End Date'}
              </th>
              <th className="px-2 py-2 w-24 text-center border-r border-slate-200">
                {isLo ? 'ຄວາມຄືບໜ້າ' : '% Complete'}
              </th>
              <th className="px-3 py-2 w-32 border-r border-slate-200">
                {isLo ? 'ສະຖານະ' : 'Status'}
              </th>
              <th className="px-3 py-2 w-24 border-r border-slate-200">
                {isLo ? 'ບຸລິມະສິດ' : 'Priority'}
              </th>
              <th className="px-3 py-2 min-w-[160px] border-r border-slate-200">
                {isLo ? 'ຜູ້ຮັບຜິດຊອບ (Resources)' : 'Assignees'}
              </th>
              <th className="px-3 py-2 w-24 border-r border-slate-200">
                {isLo ? 'ວຽກກ່ອນໜ້າ' : 'Predecessors'}
              </th>
              <th className="px-3 py-2 w-16 text-center">
                {isLo ? 'ຈັດການ' : 'Action'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const isSelected = selectedTaskId === task.id;
              const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.not_started;
              const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              const assignees = task.assigneeIds.map((id) => resourceMap.get(id)).filter(Boolean);

              return (
                <tr
                  key={task.id}
                  id={`sheet-row-${task.id}`}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`h-10 hover:bg-blue-50/50 cursor-pointer transition ${
                    isSelected ? 'bg-blue-50/90 ring-1 ring-inset ring-blue-400' : ''
                  }`}
                >
                  {/* WBS */}
                  <td className="px-3 py-1.5 text-center font-mono font-medium text-slate-500 border-r border-slate-100">
                    {task.wbs}
                  </td>

                  {/* Task Name with Indent */}
                  <td className="px-3 py-1.5 border-r border-slate-100 font-medium">
                    <div
                      className="flex items-center gap-2"
                      style={{ paddingLeft: `${(task.indent || 0) * 18}px` }}
                    >
                      {task.isMilestone ? (
                        <Flag className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                      ) : task.isSummary ? (
                        <span className="w-2 h-2 rounded-full bg-slate-700 flex-shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      )}
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => onUpdateTask({ ...task, name: e.target.value })}
                        className={`w-full bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 border border-transparent hover:border-slate-300 truncate transition ${
                          task.isSummary ? 'font-bold text-slate-900' : 'text-slate-800'
                        }`}
                      />
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="px-2 py-1.5 text-center border-r border-slate-100">
                    <input
                      type="number"
                      min="0"
                      value={task.duration}
                      disabled={task.isSummary}
                      onChange={(e) => {
                        const dur = Math.max(0, parseInt(e.target.value, 10) || 0);
                        onUpdateTask({ ...task, duration: dur });
                      }}
                      className="w-14 text-center font-mono bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 border border-transparent hover:border-slate-300 disabled:opacity-60"
                    />
                  </td>

                  {/* Start Date */}
                  <td className="px-2 py-1.5 text-center border-r border-slate-100">
                    <input
                      type="date"
                      value={task.startDate}
                      disabled={task.isSummary}
                      onChange={(e) => onUpdateTask({ ...task, startDate: e.target.value })}
                      className="text-xs font-mono bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 border border-transparent hover:border-slate-300 disabled:opacity-60"
                    />
                  </td>

                  {/* End Date */}
                  <td className="px-2 py-1.5 text-center border-r border-slate-100">
                    <input
                      type="date"
                      value={task.endDate}
                      disabled={task.isSummary}
                      onChange={(e) => onUpdateTask({ ...task, endDate: e.target.value })}
                      className="text-xs font-mono bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 border border-transparent hover:border-slate-300 disabled:opacity-60"
                    />
                  </td>

                  {/* Progress % */}
                  <td className="px-2 py-1.5 text-center border-r border-slate-100">
                    <div className="flex items-center justify-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={task.progress}
                        disabled={task.isSummary}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                          const newStatus = val === 100 ? 'completed' : val > 0 ? 'in_progress' : 'not_started';
                          onUpdateTask({ ...task, progress: val, status: newStatus });
                        }}
                        className="w-12 text-center font-mono bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 border border-transparent hover:border-slate-300 disabled:opacity-60"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="px-3 py-1.5 border-r border-slate-100">
                    <select
                      value={task.status}
                      disabled={task.isSummary}
                      onChange={(e) => {
                        const st = e.target.value as TaskStatus;
                        const prog = st === 'completed' ? 100 : task.progress;
                        onUpdateTask({ ...task, status: st, progress: prog });
                      }}
                      className={`text-xs px-2 py-1 rounded font-medium ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border} focus:ring-1 focus:ring-blue-500 w-full disabled:opacity-60`}
                    >
                      <option value="not_started">{isLo ? 'ຍັງບໍ່ເລີ່ມ' : 'Not Started'}</option>
                      <option value="in_progress">{isLo ? 'ກຳລັງດຳເນີນການ' : 'In Progress'}</option>
                      <option value="completed">{isLo ? 'ສຳເລັດແລ້ວ' : 'Completed'}</option>
                      <option value="on_hold">{isLo ? 'ໂຈະຊົ່ວຄາວ' : 'On Hold'}</option>
                      <option value="delayed">{isLo ? 'ຊັກຊ້າ' : 'Delayed'}</option>
                    </select>
                  </td>

                  {/* Priority */}
                  <td className="px-3 py-1.5 border-r border-slate-100">
                    <select
                      value={task.priority}
                      onChange={(e) => onUpdateTask({ ...task, priority: e.target.value as TaskPriority })}
                      className="text-xs bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 rounded px-1.5 py-1 text-slate-700 w-full"
                    >
                      <option value="low">{isLo ? 'ຕ່ຳ' : 'Low'}</option>
                      <option value="medium">{isLo ? 'ປານກາງ' : 'Medium'}</option>
                      <option value="high">{isLo ? 'ສູງ' : 'High'}</option>
                      <option value="urgent">{isLo ? 'ດ່ວນ' : 'Urgent'}</option>
                    </select>
                  </td>

                  {/* Assignees */}
                  <td className="px-3 py-1.5 border-r border-slate-100">
                    <div
                      onClick={() => onSelectTask(task)}
                      className="flex items-center gap-1 min-h-[26px] p-1 hover:bg-white rounded border border-transparent hover:border-slate-200 transition"
                      title={isLo ? 'ກົດເພື່ອເລືອກຜູ້ຮັບຜິດຊອບ' : 'Click to manage assignees'}
                    >
                      {assignees.length > 0 ? (
                        assignees.map((r) => (
                          <span
                            key={r!.id}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white shadow-2xs"
                            style={{ backgroundColor: r!.avatarColor }}
                          >
                            {r!.name.split(' ')[0]}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-[11px] flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {isLo ? 'ຍັງບໍ່ມີຜູ້ຮັບຜິດຊອບ' : 'Unassigned'}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Predecessors */}
                  <td className="px-3 py-1.5 border-r border-slate-100 font-mono text-slate-600">
                    <input
                      type="text"
                      value={task.predecessors.join(', ')}
                      onChange={(e) => {
                        const preds = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        onUpdateTask({ ...task, predecessors: preds });
                      }}
                      placeholder="e.g. 1.1"
                      className="w-full bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 border border-transparent hover:border-slate-300 text-xs"
                    />
                  </td>

                  {/* Edit detail button */}
                  <td className="px-2 py-1.5 text-center">
                    <button
                      onClick={() => onSelectTask(task)}
                      className="p-1 hover:bg-blue-100 rounded text-blue-600 transition"
                      title={isLo ? 'ເບິ່ງລາຍລະອຽດໜ້າວຽກ' : 'View Task Details'}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
