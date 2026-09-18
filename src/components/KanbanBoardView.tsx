import React from 'react';
import { Task, Resource, Language, TaskStatus } from '../types';
import { STATUS_CONFIG, formatDateDisplay } from '../utils/projectUtils';
import { Clock, CheckCircle2, AlertCircle, Plus, MoreHorizontal } from 'lucide-react';

interface KanbanBoardViewProps {
  tasks: Task[];
  resources: Resource[];
  language: Language;
  onUpdateTask: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onAddTask: () => void;
}

const LANES: TaskStatus[] = ['not_started', 'in_progress', 'completed', 'on_hold', 'delayed'];

export const KanbanBoardView: React.FC<KanbanBoardViewProps> = ({
  tasks,
  resources,
  language,
  onUpdateTask,
  onSelectTask,
  onAddTask,
}) => {
  const isLo = language === 'lo';

  const resourceMap = new Map<string, Resource>();
  resources.forEach((r) => resourceMap.set(r.id, r));

  // Exclude summary tasks from board cards so only actionable leaf tasks are moved
  const leafTasks = tasks.filter((t) => !t.isSummary);

  const moveTaskStatus = (task: Task, newStatus: TaskStatus) => {
    const newProgress = newStatus === 'completed' ? 100 : newStatus === 'not_started' ? 0 : task.progress > 0 ? task.progress : 50;
    onUpdateTask({
      ...task,
      status: newStatus,
      progress: newProgress,
    });
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 sm:p-6 bg-slate-100/60 min-h-[calc(100vh-112px)]">
      <div className="flex gap-4 min-w-[1100px] h-full items-start">
        {LANES.map((status) => {
          const cfg = STATUS_CONFIG[status];
          const columnTasks = leafTasks.filter((t) => t.status === status);

          return (
            <div
              key={status}
              className="flex-1 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col max-h-[calc(100vh-150px)]"
            >
              {/* Lane Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      status === 'completed'
                        ? 'bg-emerald-500'
                        : status === 'in_progress'
                        ? 'bg-blue-500'
                        : status === 'delayed'
                        ? 'bg-rose-500'
                        : status === 'on_hold'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <h3 className="font-bold text-xs text-slate-800">
                    {isLo ? cfg.labelLo : cfg.labelEn}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {columnTasks.map((task) => {
                  const assignees = task.assigneeIds.map((id) => resourceMap.get(id)).filter(Boolean);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs hover:shadow-xs transition cursor-pointer space-y-2.5 group"
                    >
                      {/* Top: WBS & Priority */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-slate-400 font-semibold">
                          WBS {task.wbs}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            task.priority === 'urgent'
                              ? 'bg-rose-50 text-rose-600'
                              : task.priority === 'high'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {task.priority.toUpperCase()}
                        </span>
                      </div>

                      {/* Task Name */}
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-2">
                        {task.name}
                      </h4>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                          <span>{isLo ? 'ຄວາມຄືບໜ້າ' : 'Progress'}</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            style={{ width: `${task.progress}%` }}
                            className={`h-full rounded-full ${
                              task.status === 'completed'
                                ? 'bg-emerald-500'
                                : task.status === 'delayed'
                                ? 'bg-rose-500'
                                : 'bg-blue-600'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Dates & Assignees */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.duration} {isLo ? 'ມື້' : 'd'}</span>
                        </div>

                        {/* Assignee Avatar Chips */}
                        <div className="flex items-center -space-x-1">
                          {assignees.map((r) => (
                            <div
                              key={r!.id}
                              title={r!.name}
                              style={{ backgroundColor: r!.avatarColor }}
                              className="w-5 h-5 rounded-full text-white font-bold flex items-center justify-center text-[9px] border border-white"
                            >
                              {r!.name[0]}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quick Move Status Selector */}
                      <div className="pt-1 flex items-center justify-between text-[10px]" onClick={(e) => e.stopPropagation()}>
                        <span className="text-slate-400">{isLo ? 'ຍ້າຍສະຖານະ:' : 'Move to:'}</span>
                        <select
                          value={task.status}
                          onChange={(e) => moveTaskStatus(task, e.target.value as TaskStatus)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 text-[10px]"
                        >
                          {LANES.map((l) => (
                            <option key={l} value={l}>
                              {isLo ? STATUS_CONFIG[l].labelLo : STATUS_CONFIG[l].labelEn}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}

                {columnTasks.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs italic">
                    {isLo ? 'ບໍ່ມີໜ້າວຽກ' : 'No tasks'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
