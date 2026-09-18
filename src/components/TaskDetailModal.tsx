import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Trash2,
  Flag,
  ListTree,
  AlertCircle,
} from 'lucide-react';
import { Task, Resource, Language, TaskStatus, TaskPriority } from '../types';
import { getDaysBetween, addDays, STATUS_CONFIG } from '../utils/projectUtils';

interface TaskDetailModalProps {
  task: Task | null;
  tasks: Task[];
  resources: Resource[];
  language: Language;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  tasks,
  resources,
  language,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!task) return null;

  const isLo = language === 'lo';

  const [name, setName] = useState(task.name);
  const [startDate, setStartDate] = useState(task.startDate);
  const [endDate, setEndDate] = useState(task.endDate);
  const [duration, setDuration] = useState(task.duration);
  const [progress, setProgress] = useState(task.progress);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task.assigneeIds || []);
  const [predecessors, setPredecessors] = useState<string[]>(task.predecessors || []);
  const [isMilestone, setIsMilestone] = useState(Boolean(task.isMilestone));
  const [notes, setNotes] = useState(task.notes || '');

  // Keep duration in sync with dates
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (newStart && duration > 0) {
      setEndDate(addDays(newStart, duration));
    }
  };

  const handleEndDateChange = (newEnd: string) => {
    setEndDate(newEnd);
    if (startDate && newEnd) {
      const days = getDaysBetween(startDate, newEnd);
      setDuration(days);
    }
  };

  const handleDurationChange = (newDur: number) => {
    const val = Math.max(0, newDur);
    setDuration(val);
    if (val === 0) {
      setIsMilestone(true);
    }
    if (startDate && val > 0) {
      setEndDate(addDays(startDate, val));
    }
  };

  const handleProgressChange = (newProg: number) => {
    setProgress(newProg);
    if (newProg === 100) setStatus('completed');
    else if (newProg > 0 && status === 'not_started') setStatus('in_progress');
    else if (newProg === 0 && status === 'completed') setStatus('not_started');
  };

  const toggleAssignee = (resId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(resId) ? prev.filter((id) => id !== resId) : [...prev, resId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...task,
      name: name.trim(),
      startDate,
      endDate,
      duration: isMilestone ? 0 : duration,
      progress,
      status,
      priority,
      assigneeIds,
      predecessors,
      isMilestone,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
              WBS {task.wbs}
            </span>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate max-w-sm">
              {isLo ? 'ລາຍລະອຽດໜ້າວຽກ (Task Information)' : 'Task Information'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Task Name */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isLo ? 'ຊື່ໜ້າວຽກ *' : 'Task Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs text-slate-900 font-medium"
            />
          </div>

          {/* Milestone Checkbox */}
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <input
              type="checkbox"
              id="milestone-chk"
              checked={isMilestone}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsMilestone(checked);
                if (checked) {
                  setDuration(0);
                  setEndDate(startDate);
                } else if (duration === 0) {
                  setDuration(1);
                  setEndDate(addDays(startDate, 1));
                }
              }}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="milestone-chk" className="text-slate-700 font-medium flex items-center gap-1.5 cursor-pointer">
              <Flag className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{isLo ? 'ກຳນົດເປັນຈຸດໝາຍສຳຄັນ (Milestone - 0 Days)' : 'Set as Milestone (0 Duration)'}</span>
            </label>
          </div>

          {/* Dates and Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isLo ? 'ວັນທີເລີ່ມ' : 'Start Date'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isLo ? 'ວັນທີສິ້ນສຸດ' : 'Finish Date'}
              </label>
              <input
                type="date"
                value={endDate}
                disabled={isMilestone}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isLo ? 'ໄລຍະເວລາ (ມື້)' : 'Duration (Days)'}
              </label>
              <input
                type="number"
                min="0"
                value={duration}
                disabled={isMilestone}
                onChange={(e) => handleDurationChange(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono disabled:opacity-60"
              />
            </div>
          </div>

          {/* Progress Slider and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <div className="flex justify-between items-center mb-1 font-semibold text-slate-700">
                <span>{isLo ? 'ຄວາມຄືບໜ້າ (Progress)' : 'Progress'}</span>
                <span className="font-mono text-blue-600">{progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => handleProgressChange(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isLo ? 'ສະຖານະ (Status)' : 'Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="not_started">{isLo ? 'ຍັງບໍ່ເລີ່ມ' : 'Not Started'}</option>
                <option value="in_progress">{isLo ? 'ກຳລັງດຳເນີນການ' : 'In Progress'}</option>
                <option value="completed">{isLo ? 'ສຳເລັດແລ້ວ' : 'Completed'}</option>
                <option value="on_hold">{isLo ? 'ໂຈະຊົ່ວຄາວ' : 'On Hold'}</option>
                <option value="delayed">{isLo ? 'ຊັກຊ້າ' : 'Delayed'}</option>
              </select>
            </div>
          </div>

          {/* Priority & Predecessors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isLo ? 'ບຸລິມະສິດ (Priority)' : 'Priority'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">{isLo ? 'ຕ່ຳ (Low)' : 'Low'}</option>
                <option value="medium">{isLo ? 'ປານກາງ (Medium)' : 'Medium'}</option>
                <option value="high">{isLo ? 'ສູງ (High)' : 'High'}</option>
                <option value="urgent">{isLo ? 'ດ່ວນທີ່ສຸດ (Critical)' : 'Urgent'}</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isLo ? 'ວຽກກ່ອນໜ້າ (Predecessors)' : 'Predecessors (WBS or IDs)'}
              </label>
              <input
                type="text"
                value={predecessors.join(', ')}
                onChange={(e) =>
                  setPredecessors(
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="e.g. 1.1, 1.2"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Assigned Resources Selection */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              {isLo ? 'ມອບໝາຍຊັບພະຍາກອນ / ຜູ້ຮັບຜິດຊອບ' : 'Assign Resources'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 p-2 rounded-lg max-h-36 overflow-y-auto">
              {resources.map((r) => {
                const isSelected = assigneeIds.includes(r.id);
                return (
                  <div
                    key={r.id}
                    onClick={() => toggleAssignee(r.id)}
                    className={`flex items-center gap-2 p-1.5 rounded-md border cursor-pointer transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                      style={{ backgroundColor: r.avatarColor }}
                    >
                      {r.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 text-[11px] truncate">
                        {r.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{r.role}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isLo ? 'ໝາຍເຫດເພີ່ມເຕີມ (Notes)' : 'Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isLo ? 'ລາຍລະອຽດ, ຂໍ້ກຳນົດ ຫຼື ເງື່ອນໄຂ...' : 'Any task details, deliverables...'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(isLo ? 'ຕ້ອງການລຶບໜ້າວຽກນີ້ແທ້ບໍ່?' : 'Delete this task?')) {
                  onDelete(task.id);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isLo ? 'ລຶບໜ້າວຽກ' : 'Delete'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition"
              >
                {isLo ? 'ຍົກເລີກ' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                {isLo ? 'ບັນທຶກ' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
