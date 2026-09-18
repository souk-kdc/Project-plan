import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  ArrowLeftToLine,
  ArrowRightToLine,
  ChevronUp,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  Flag,
} from 'lucide-react';
import { Task, Resource, Language } from '../types';
import { formatDateDisplay, STATUS_CONFIG } from '../utils/projectUtils';

interface GanttViewProps {
  tasks: Task[];
  resources: Resource[];
  language: Language;
  onUpdateTask: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onAddTask: (parentId?: string | null) => void;
  onIndentTask: (taskId: string) => void;
  onOutdentTask: (taskId: string) => void;
  onMoveTaskUp: (taskId: string) => void;
  onMoveTaskDown: (taskId: string) => void;
}

type ZoomLevel = 'day' | 'week' | 'month';

export const GanttView: React.FC<GanttViewProps> = ({
  tasks,
  resources,
  language,
  onUpdateTask,
  onSelectTask,
  onAddTask,
  onIndentTask,
  onOutdentTask,
  onMoveTaskUp,
  onMoveTaskDown,
}) => {
  const isLo = language === 'lo';
  const [zoom, setZoom] = useState<ZoomLevel>('day');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const rightTimelineRef = useRef<HTMLDivElement>(null);
  const leftTableRef = useRef<HTMLDivElement>(null);

  // Synchronize vertical scroll between left table and right timeline
  const handleLeftScroll = () => {
    if (leftTableRef.current && rightTimelineRef.current) {
      rightTimelineRef.current.scrollTop = leftTableRef.current.scrollTop;
    }
  };

  const handleRightScroll = () => {
    if (leftTableRef.current && rightTimelineRef.current) {
      leftTableRef.current.scrollTop = rightTimelineRef.current.scrollTop;
    }
  };

  const toggleCollapse = (taskId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // Determine which tasks are visible (taking collapsed parents into account)
  const visibleTasks = useMemo(() => {
    const list: Task[] = [];
    let skippingUnderParentIndent = -1;

    for (const t of tasks) {
      if (skippingUnderParentIndent >= 0) {
        if (t.indent > skippingUnderParentIndent) {
          continue; // skip child of collapsed parent
        } else {
          skippingUnderParentIndent = -1;
        }
      }

      list.push(t);

      if (t.isSummary && collapsedIds.has(t.id)) {
        skippingUnderParentIndent = t.indent;
      }
    }
    return list;
  }, [tasks, collapsedIds]);

  // Compute timeline boundaries
  const { minDate, maxDate, totalDays, dateList } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setDate(today.getDate() + 30);
      return {
        minDate: today,
        maxDate: nextMonth,
        totalDays: 30,
        dateList: [],
      };
    }

    let minTime = Infinity;
    let maxTime = -Infinity;

    tasks.forEach((t) => {
      if (t.startDate) {
        const s = new Date(t.startDate).getTime();
        if (!isNaN(s) && s < minTime) minTime = s;
      }
      if (t.endDate) {
        const e = new Date(t.endDate).getTime();
        if (!isNaN(e) && e > maxTime) maxTime = e;
      }
    });

    if (minTime === Infinity) minTime = new Date().getTime();
    if (maxTime === -Infinity) maxTime = minTime + 30 * 86400000;

    // Buffer padding of 5 days before and 10 days after
    const start = new Date(minTime);
    start.setDate(start.getDate() - 5);
    start.setHours(0, 0, 0, 0);

    const end = new Date(maxTime);
    end.setDate(end.getDate() + 10);
    end.setHours(0, 0, 0, 0);

    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    const dates: Date[] = [];
    for (let i = 0; i <= diffDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }

    return { minDate: start, maxDate: end, totalDays: diffDays, dateList: dates };
  }, [tasks]);

  // Column width per day based on zoom
  const dayWidth = zoom === 'day' ? 36 : zoom === 'week' ? 18 : 8;
  const timelineTotalWidth = (totalDays + 1) * dayWidth;

  const getDateX = (dateStr: string): number => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = (d.getTime() - minDate.getTime()) / 86400000;
    return Math.max(0, diff * dayWidth);
  };

  const todayX = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = (today.getTime() - minDate.getTime()) / 86400000;
    return diff * dayWidth;
  }, [minDate, dayWidth]);

  // Scroll to today or project start on mount
  useEffect(() => {
    if (rightTimelineRef.current && todayX > 200) {
      rightTimelineRef.current.scrollLeft = todayX - 200;
    }
  }, [todayX]);

  // Map resource by ID
  const resourceMap = useMemo(() => {
    const map = new Map<string, Resource>();
    resources.forEach((r) => map.set(r.id, r));
    return map;
  }, [resources]);

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] bg-white select-none">
      {/* MS Project View Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50 gap-2">
        {/* Left Toolbar: Quick WBS operations */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            id="gantt-add-subtask-btn"
            onClick={() => onAddTask(selectedTaskId)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded text-slate-700 font-medium transition"
            title={isLo ? 'ເພີ່ມໜ້າວຽກ ຫຼື ໜ້າວຽກຍ່ອຍ' : 'Add Task or Subtask'}
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>{isLo ? 'ເພີ່ມວຽກຍ່ອຍ' : 'Add Subtask'}</span>
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button
            id="gantt-indent-btn"
            disabled={!selectedTaskId}
            onClick={() => selectedTaskId && onIndentTask(selectedTaskId)}
            className="p-1 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded text-slate-700 transition"
            title={isLo ? 'ຫຍໍ້ໜ້າເຂົ້າ (Indent / ເປັນໜ້າວຽກຍ່ອຍ)' : 'Indent (Make subtask)'}
          >
            <ArrowRightToLine className="w-3.5 h-3.5" />
          </button>

          <button
            id="gantt-outdent-btn"
            disabled={!selectedTaskId}
            onClick={() => selectedTaskId && onOutdentTask(selectedTaskId)}
            className="p-1 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded text-slate-700 transition"
            title={isLo ? 'ຫຍໍ້ໜ້າອອກ (Outdent / ຍົກລະດັບວຽກ)' : 'Outdent'}
          >
            <ArrowLeftToLine className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button
            id="gantt-move-up-btn"
            disabled={!selectedTaskId}
            onClick={() => selectedTaskId && onMoveTaskUp(selectedTaskId)}
            className="p-1 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded text-slate-700 transition"
            title={isLo ? 'ຍ້າຍຂຶ້ນເທິງ' : 'Move Up'}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          <button
            id="gantt-move-down-btn"
            disabled={!selectedTaskId}
            onClick={() => selectedTaskId && onMoveTaskDown(selectedTaskId)}
            className="p-1 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded text-slate-700 transition"
            title={isLo ? 'ຍ້າຍລົງລຸ່ມ' : 'Move Down'}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Toolbar: Zoom & Timeline display scale */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium hidden sm:inline">
            {isLo ? 'ມຸມມອງເວລາ:' : 'Time scale:'}
          </span>
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
            <button
              id="zoom-day-btn"
              onClick={() => setZoom('day')}
              className={`px-2 py-0.5 rounded text-xs transition ${
                zoom === 'day' ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isLo ? 'ມື້ (Days)' : 'Days'}
            </button>
            <button
              id="zoom-week-btn"
              onClick={() => setZoom('week')}
              className={`px-2 py-0.5 rounded text-xs transition ${
                zoom === 'week' ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isLo ? 'ອາທິດ (Weeks)' : 'Weeks'}
            </button>
            <button
              id="zoom-month-btn"
              onClick={() => setZoom('month')}
              className={`px-2 py-0.5 rounded text-xs transition ${
                zoom === 'month' ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isLo ? 'ເດືອນ (Months)' : 'Months'}
            </button>
          </div>
        </div>
      </div>

      {/* Split View Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: WBS Table */}
        <div
          ref={leftTableRef}
          onScroll={handleLeftScroll}
          className="w-[45%] min-w-[340px] max-w-[620px] border-r border-slate-200 overflow-auto bg-white flex-shrink-0"
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-20 border-b border-slate-300 font-semibold">
              <tr className="h-10">
                <th className="px-2 py-2 w-12 text-center border-r border-slate-200">WBS</th>
                <th className="px-3 py-2 min-w-[200px] border-r border-slate-200">
                  {isLo ? 'ຊື່ໜ້າວຽກ (Task Name)' : 'Task Name'}
                </th>
                <th className="px-2 py-2 w-16 text-center border-r border-slate-200">
                  {isLo ? 'ມື້ (Days)' : 'Duration'}
                </th>
                <th className="px-2 py-2 w-20 text-center border-r border-slate-200">
                  {isLo ? 'ເລີ່ມ' : 'Start'}
                </th>
                <th className="px-2 py-2 w-20 text-center border-r border-slate-200">
                  {isLo ? 'ສິ້ນສຸດ' : 'Finish'}
                </th>
                <th className="px-2 py-2 w-16 text-center border-r border-slate-200">
                  {isLo ? '% ສຳເລັດ' : '% Done'}
                </th>
                <th className="px-2 py-2 w-28 border-r border-slate-200">
                  {isLo ? 'ຜູ້ຮັບຜິດຊອບ' : 'Assignee'}
                </th>
                <th className="px-2 py-2 w-24">
                  {isLo ? 'ສະຖານະ' : 'Status'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleTasks.map((task) => {
                const isSelected = selectedTaskId === task.id;
                const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.not_started;
                const assignees = task.assigneeIds.map((id) => resourceMap.get(id)).filter(Boolean);

                return (
                  <tr
                    key={task.id}
                    id={`wbs-row-${task.id}`}
                    onClick={() => setSelectedTaskId(task.id)}
                    onDoubleClick={() => onSelectTask(task)}
                    className={`h-9 hover:bg-blue-50/60 cursor-pointer transition ${
                      isSelected ? 'bg-blue-50 ring-1 ring-inset ring-blue-400' : ''
                    }`}
                  >
                    {/* WBS code */}
                    <td className="px-2 py-1 text-center font-mono text-slate-500 border-r border-slate-100">
                      {task.wbs}
                    </td>

                    {/* Task Name with Indent and Collapse icon */}
                    <td className="px-2 py-1 border-r border-slate-100 font-medium">
                      <div
                        className="flex items-center gap-1.5"
                        style={{ paddingLeft: `${(task.indent || 0) * 16}px` }}
                      >
                        {task.isSummary ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCollapse(task.id);
                            }}
                            className="p-0.5 hover:bg-slate-200 rounded text-slate-600"
                          >
                            {collapsedIds.has(task.id) ? (
                              <ChevronRight className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : task.isMilestone ? (
                          <Flag className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                        ) : (
                          <span className="w-3.5 inline-block" />
                        )}

                        <span
                          className={`truncate ${
                            task.isSummary ? 'font-bold text-slate-900' : 'text-slate-800'
                          }`}
                        >
                          {task.name}
                        </span>
                      </div>
                    </td>

                    {/* Duration in days */}
                    <td className="px-2 py-1 text-center font-mono text-slate-600 border-r border-slate-100">
                      {task.isMilestone ? '0d' : `${task.duration}d`}
                    </td>

                    {/* Start Date */}
                    <td className="px-2 py-1 text-center text-slate-500 border-r border-slate-100 whitespace-nowrap">
                      {formatDateDisplay(task.startDate)}
                    </td>

                    {/* End Date */}
                    <td className="px-2 py-1 text-center text-slate-500 border-r border-slate-100 whitespace-nowrap">
                      {formatDateDisplay(task.endDate)}
                    </td>

                    {/* Progress % */}
                    <td className="px-2 py-1 text-center border-r border-slate-100">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-mono text-[11px] text-slate-700">{task.progress}%</span>
                      </div>
                    </td>

                    {/* Assignees */}
                    <td className="px-2 py-1 border-r border-slate-100">
                      <div className="flex items-center gap-1 overflow-hidden">
                        {assignees.slice(0, 2).map((r) => (
                          <span
                            key={r!.id}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-white truncate max-w-[80px]"
                            style={{ backgroundColor: r!.avatarColor }}
                            title={r!.name}
                          >
                            {r!.name.split(' ')[0]}
                          </span>
                        ))}
                        {assignees.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            +{assignees.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-2 py-1 whitespace-nowrap">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}
                      >
                        {isLo ? statusCfg.labelLo : statusCfg.labelEn}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Side: Interactive Gantt Chart Timeline */}
        <div
          ref={rightTimelineRef}
          onScroll={handleRightScroll}
          className="flex-1 overflow-auto bg-slate-50/50 relative"
        >
          <div style={{ width: `${timelineTotalWidth}px`, minHeight: '100%' }}>
            {/* Timeline Header (Months & Days) */}
            <div className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 font-mono text-[11px]">
              {/* Day / Week Header Cells */}
              <div className="flex h-10 border-b border-slate-200">
                {dateList.map((d, index) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isFirstOfMonth = d.getDate() === 1 || index === 0;
                  const monthName = d.toLocaleString(isLo ? 'lo-LA' : 'en-US', { month: 'short' });

                  return (
                    <div
                      key={index}
                      style={{ width: `${dayWidth}px` }}
                      className={`flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-200 text-center ${
                        isWeekend ? 'bg-slate-200/40 text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {zoom === 'day' && (
                        <>
                          <span className="text-[9px] uppercase font-bold">
                            {isFirstOfMonth ? monthName : d.toLocaleString('en-US', { weekday: 'narrow' })}
                          </span>
                          <span className="font-semibold text-[11px]">{d.getDate()}</span>
                        </>
                      )}
                      {zoom === 'week' && (
                        <span className="text-[10px] font-medium">
                          {d.getDay() === 1 ? d.getDate() : ''}
                        </span>
                      )}
                      {zoom === 'month' && isFirstOfMonth && (
                        <span className="text-[10px] font-bold text-blue-700">{monthName}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Body Rows with Gantt Bars */}
            <div className="relative">
              {/* Today Red Vertical Marker Line */}
              {todayX >= 0 && todayX <= timelineTotalWidth && (
                <div
                  style={{ left: `${todayX}px` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 pointer-events-none"
                  title="Today"
                >
                  <div className="sticky top-11 -ml-6 px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-bold rounded shadow-xs">
                    {isLo ? 'ມື້ນີ້ (Today)' : 'Today'}
                  </div>
                </div>
              )}

              {/* Grid Column Background Lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {dateList.map((d, idx) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div
                      key={idx}
                      style={{ width: `${dayWidth}px` }}
                      className={`border-r border-slate-100 flex-shrink-0 ${
                        isWeekend ? 'bg-slate-100/30' : ''
                      }`}
                    />
                  );
                })}
              </div>

              {/* Task Gantt Bars */}
              <div className="relative z-5 divide-y divide-slate-100">
                {visibleTasks.map((task) => {
                  const isSelected = selectedTaskId === task.id;
                  const startX = getDateX(task.startDate);
                  const endX = getDateX(task.endDate) + dayWidth;
                  const barWidth = Math.max(dayWidth, endX - startX);
                  const assignees = task.assigneeIds.map((id) => resourceMap.get(id)).filter(Boolean);

                  return (
                    <div
                      key={task.id}
                      id={`gantt-bar-row-${task.id}`}
                      onClick={() => setSelectedTaskId(task.id)}
                      onDoubleClick={() => onSelectTask(task)}
                      className={`h-9 flex items-center relative transition ${
                        isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-100/40'
                      }`}
                    >
                      {/* Milestone Diamond */}
                      {task.isMilestone ? (
                        <div
                          style={{ left: `${startX}px` }}
                          className="absolute flex items-center gap-1.5 cursor-pointer group"
                        >
                          <div
                            className="w-4 h-4 bg-amber-500 border-2 border-white shadow-xs rotate-45 transform"
                            title={`${task.name} (${formatDateDisplay(task.startDate)})`}
                          />
                          <span className="text-[11px] font-bold text-amber-700 whitespace-nowrap pl-1 drop-shadow-xs">
                            {task.name}
                          </span>
                        </div>
                      ) : task.isSummary ? (
                        /* MS Project Summary Bracket Bar */
                        <div
                          style={{ left: `${startX}px`, width: `${barWidth}px` }}
                          className="absolute h-5 flex flex-col justify-between cursor-pointer group"
                        >
                          {/* Top black bar */}
                          <div className="h-2.5 bg-slate-900 rounded-t-sm flex items-center relative overflow-hidden">
                            {/* Inner progress fill */}
                            <div
                              style={{ width: `${task.progress}%` }}
                              className="h-full bg-blue-500 opacity-90"
                            />
                          </div>
                          {/* Left and right bracket teeth */}
                          <div className="flex justify-between -mt-1 text-slate-900 font-bold text-[10px]">
                            <span className="border-l-2 border-b-2 border-slate-900 w-2 h-2" />
                            <span className="border-r-2 border-b-2 border-slate-900 w-2 h-2" />
                          </div>

                          {/* Task summary label */}
                          <span className="absolute left-full ml-2 top-0 text-[11px] font-bold text-slate-800 whitespace-nowrap">
                            {task.name} ({task.progress}%)
                          </span>
                        </div>
                      ) : (
                        /* Standard Task Bar */
                        <div
                          style={{ left: `${startX}px`, width: `${barWidth}px` }}
                          className={`absolute h-6 rounded border shadow-xs flex items-center relative cursor-pointer overflow-hidden transition group ${
                            task.status === 'completed'
                              ? 'bg-emerald-400 border-emerald-500'
                              : task.status === 'delayed'
                              ? 'bg-rose-400 border-rose-500'
                              : task.status === 'on_hold'
                              ? 'bg-amber-300 border-amber-400'
                              : 'bg-blue-400 border-blue-500'
                          }`}
                          title={`${task.wbs} ${task.name}\nDuration: ${task.duration} days\nStart: ${task.startDate}\nFinish: ${task.endDate}\nProgress: ${task.progress}%`}
                        >
                          {/* Progress fill bar */}
                          <div
                            style={{ width: `${task.progress}%` }}
                            className={`h-full transition-all duration-300 ${
                              task.status === 'completed'
                                ? 'bg-emerald-600'
                                : task.status === 'delayed'
                                ? 'bg-rose-600'
                                : task.status === 'on_hold'
                                ? 'bg-amber-600'
                                : 'bg-blue-600'
                            }`}
                          />

                          {/* Inner bar label if wide enough */}
                          {barWidth > 70 && (
                            <span className="absolute inset-0 flex items-center px-2 text-[10px] font-semibold text-white truncate pointer-events-none drop-shadow-xs">
                              {task.progress}%
                            </span>
                          )}

                          {/* Outside Label with Assignee Tags */}
                          <div className="absolute left-full ml-2 flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-[11px] font-medium text-slate-700">
                              {task.name}
                            </span>
                            {assignees.map((r) => (
                              <span
                                key={r!.id}
                                className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white shadow-2xs"
                                style={{ backgroundColor: r!.avatarColor }}
                              >
                                {r!.name.split(' ')[0]}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
