import { Task, Resource, ProjectData, TaskStatus, TaskPriority } from '../types';

/**
 * Calculates business days or calendar days difference between two YYYY-MM-DD dates
 */
export function getDaysBetween(startStr: string, endStr: string): number {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = end.getTime() - start.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(days, 0) + 1; // inclusive of start day
}

/**
 * Adds days to a date string (YYYY-MM-DD)
 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + (days - 1));
  return d.toISOString().split('T')[0];
}

/**
 * Formats date for display: YYYY-MM-DD or DD/MM/YYYY
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Recalculates WBS numbering and parent summaries for a flat list of tasks.
 */
export function recalculateWbsAndRollups(tasks: Task[]): Task[] {
  const result: Task[] = [];
  const levelCounters: number[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = { ...tasks[i] };
    const indent = Math.max(0, task.indent || 0);

    // Update level counters for WBS
    while (levelCounters.length <= indent) {
      levelCounters.push(0);
    }
    levelCounters[indent]++;
    levelCounters.length = indent + 1;

    // Build WBS string (e.g., 1, 1.1, 1.2, 2, 2.1)
    task.wbs = levelCounters.join('.');

    // Check if next task has higher indent (meaning this task is a parent / summary task)
    const nextTask = tasks[i + 1];
    task.isSummary = Boolean(nextTask && nextTask.indent > indent);

    result.push(task);
  }

  // Second pass: Calculate rollup durations and progress for summary tasks
  for (let i = result.length - 1; i >= 0; i--) {
    const task = result[i];
    if (task.isSummary) {
      const childTasks: Task[] = [];
      for (let j = i + 1; j < result.length; j++) {
        if (result[j].indent <= task.indent) break;
        if (result[j].indent === task.indent + 1) {
          childTasks.push(result[j]);
        }
      }

      if (childTasks.length > 0) {
        // Rollup start date (earliest)
        const childStarts = childTasks.map((c) => c.startDate).filter(Boolean).sort();
        if (childStarts.length > 0) task.startDate = childStarts[0];

        // Rollup end date (latest)
        const childEnds = childTasks.map((c) => c.endDate).filter(Boolean).sort();
        if (childEnds.length > 0) task.endDate = childEnds[childEnds.length - 1];

        // Rollup duration
        if (task.startDate && task.endDate) {
          task.duration = getDaysBetween(task.startDate, task.endDate);
        }

        // Weighted progress by duration
        const totalDuration = childTasks.reduce((sum, c) => sum + (c.duration || 1), 0);
        const weightedProgress = childTasks.reduce(
          (sum, c) => sum + (c.progress || 0) * (c.duration || 1),
          0
        );
        task.progress = totalDuration > 0 ? Math.round(weightedProgress / totalDuration) : 0;

        if (task.progress === 100) task.status = 'completed';
        else if (task.progress > 0) task.status = 'in_progress';
      }
    }
  }

  return result;
}

/**
 * Analyzes resource allocation to detect over-allocation (>100% capacity)
 */
export function calculateResourceWorkloads(
  resources: Resource[],
  tasks: Task[]
): {
  resource: Resource;
  allocatedTasks: Task[];
  totalWorkDays: number;
  isOverallocated: boolean;
  activeWorkloadPercent: number;
}[] {
  const todayStr = new Date().toISOString().split('T')[0];

  return resources.map((resource) => {
    const assigned = tasks.filter(
      (t) => !t.isSummary && t.assigneeIds && t.assigneeIds.includes(resource.id)
    );

    const totalWorkDays = assigned.reduce((sum, t) => sum + (t.duration || 1), 0);

    // Count concurrent active tasks today or in progress
    const activeTasks = assigned.filter(
      (t) => t.status !== 'completed' && t.startDate <= todayStr && t.endDate >= todayStr
    );

    // If assigned to 2 or more active concurrent full-time tasks, flag overallocation
    const activeUnits = activeTasks.length * 100;
    const isOverallocated = activeUnits > resource.capacity;

    return {
      resource,
      allocatedTasks: assigned,
      totalWorkDays,
      isOverallocated,
      activeWorkloadPercent: activeUnits,
    };
  });
}

/**
 * Initial demo resources (realistic roles for enterprise project)
 */
export const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'res-1',
    name: 'ສົມສັກ ແກ້ວມະນີ (Somsack K.)',
    role: 'Project Manager / ຫົວໜ້າໂຄງການ',
    email: 'somsack.k@example.la',
    type: 'work',
    capacity: 100,
    hourlyRate: 35,
    avatarColor: '#2563EB',
  },
  {
    id: 'res-2',
    name: 'ວຽງສະຫວັນ ສີສຸລາດ (Viengsavanh S.)',
    role: 'Lead Backend Developer / ຫົວໜ້າລະບົບຫຼັງບ້ານ',
    email: 'vieng.s@example.la',
    type: 'work',
    capacity: 100,
    hourlyRate: 40,
    avatarColor: '#16A34A',
  },
  {
    id: 'res-3',
    name: 'ມະນີພອນ ວົງຄຳ (Maneephone V.)',
    role: 'UI/UX Designer / ຜູ້ອອກແບບລະບົບ',
    email: 'maneephone.v@example.la',
    type: 'work',
    capacity: 100,
    hourlyRate: 30,
    avatarColor: '#D97706',
  },
  {
    id: 'res-4',
    name: 'ອານຸສິດ ພອນໄຊ (Anousith P.)',
    role: 'Frontend Engineer / ວິສະວະກອນໜ້າບ້ານ',
    email: 'anousith.p@example.la',
    type: 'work',
    capacity: 100,
    hourlyRate: 32,
    avatarColor: '#9333EA',
  },
  {
    id: 'res-5',
    name: 'ດາວອນ ພັນທະວົງ (Davone P.)',
    role: 'QA & Test Specialist / ຜູ້ກວດສອບຄຸນນະພາບ',
    email: 'davone.p@example.la',
    type: 'work',
    capacity: 100,
    hourlyRate: 28,
    avatarColor: '#DC2626',
  },
];

/**
 * Initial demo project data with authentic MS Project WBS structure
 */
export const INITIAL_PROJECT: ProjectData = {
  id: 'proj-1',
  title: 'ໂຄງການພັດທະນາລະບົບຄຸ້ມຄອງວຽກງານ ແລະ ເຊື່ອມຕໍ່ Real-time Sheets',
  description: 'ແຜນງານຄຸ້ມຄອງໂຄງການຮູບແບບ MS Project ພ້ອມຈັດການຊັບພະຍາກອນ ແລະ ຊິງຄ໌ Google Sheets',
  startDate: '2026-09-20',
  endDate: '2026-11-15',
  autoSync: false,
};

export const INITIAL_TASKS: Task[] = [
  // 1. Planning Phase (Summary)
  {
    id: 'task-1',
    wbs: '1',
    name: '1. ການວາງແຜນ ແລະ ສຳຫຼວດຄວາມຕ້ອງການ (Planning & Analysis)',
    parentId: null,
    indent: 0,
    startDate: '2026-09-20',
    endDate: '2026-09-30',
    duration: 11,
    progress: 90,
    status: 'in_progress',
    priority: 'high',
    assigneeIds: ['res-1'],
    predecessors: [],
    isSummary: true,
  },
  {
    id: 'task-1-1',
    wbs: '1.1',
    name: 'ກຳນົດຂອບເຂດວຽກ ແລະ ເປົ້າໝາຍໂຄງການ (Scope & Objectives)',
    parentId: 'task-1',
    indent: 1,
    startDate: '2026-09-20',
    endDate: '2026-09-24',
    duration: 5,
    progress: 100,
    status: 'completed',
    priority: 'high',
    assigneeIds: ['res-1', 'res-2'],
    predecessors: [],
    notes: 'ສຳເລັດການເຊັນຮັບຮອງຂອບເຂດວຽກ (Scope Signed off)',
  },
  {
    id: 'task-1-2',
    wbs: '1.2',
    name: 'ສຳພາດຜູ້ໃຊ້ ແລະ ເກັບກຳ Requirement (User Interviews & Gathering)',
    parentId: 'task-1',
    indent: 1,
    startDate: '2026-09-25',
    endDate: '2026-09-30',
    duration: 6,
    progress: 80,
    status: 'in_progress',
    priority: 'medium',
    assigneeIds: ['res-1', 'res-3'],
    predecessors: ['1.1'],
  },
  {
    id: 'task-1-3',
    wbs: '1.3',
    name: 'ຈຸດໝາຍ: ສຳເລັດແຜນ Project Charter (Milestone)',
    parentId: 'task-1',
    indent: 1,
    startDate: '2026-09-30',
    endDate: '2026-09-30',
    duration: 0,
    progress: 100,
    status: 'completed',
    priority: 'critical' as any,
    assigneeIds: ['res-1'],
    predecessors: ['1.2'],
    isMilestone: true,
  },

  // 2. System Design Phase
  {
    id: 'task-2',
    wbs: '2',
    name: '2. ການອອກແບບລະບົບ ແລະ UI/UX (System Architecture & Design)',
    parentId: null,
    indent: 0,
    startDate: '2026-10-01',
    endDate: '2026-10-14',
    duration: 14,
    progress: 60,
    status: 'in_progress',
    priority: 'high',
    assigneeIds: ['res-2', 'res-3'],
    predecessors: ['1.3'],
    isSummary: true,
  },
  {
    id: 'task-2-1',
    wbs: '2.1',
    name: 'ອອກແບບຖານຂໍ້ມູນ & WBS Data Model (Database Schema)',
    parentId: 'task-2',
    indent: 1,
    startDate: '2026-10-01',
    endDate: '2026-10-06',
    duration: 6,
    progress: 100,
    status: 'completed',
    priority: 'high',
    assigneeIds: ['res-2'],
    predecessors: ['1.3'],
  },
  {
    id: 'task-2-2',
    wbs: '2.2',
    name: 'ອອກແບບ Wireframe & Interactive Prototype (Figma UI)',
    parentId: 'task-2',
    indent: 1,
    startDate: '2026-10-04',
    endDate: '2026-10-12',
    duration: 9,
    progress: 65,
    status: 'in_progress',
    priority: 'medium',
    assigneeIds: ['res-3'],
    predecessors: ['2.1'],
  },
  {
    id: 'task-2-3',
    wbs: '2.3',
    name: 'ກວດສອບ ແລະ ປັບແກ້ UI ກັບຜູ້ບໍລິຫານ (Design Review)',
    parentId: 'task-2',
    indent: 1,
    startDate: '2026-10-13',
    endDate: '2026-10-14',
    duration: 2,
    progress: 20,
    status: 'in_progress',
    priority: 'high',
    assigneeIds: ['res-1', 'res-3'],
    predecessors: ['2.2'],
  },

  // 3. Development Phase
  {
    id: 'task-3',
    wbs: '3',
    name: '3. ການພັດທະນາລະບົບ (Development & Implementation)',
    parentId: null,
    indent: 0,
    startDate: '2026-10-15',
    endDate: '2026-11-05',
    duration: 22,
    progress: 25,
    status: 'in_progress',
    priority: 'urgent',
    assigneeIds: ['res-2', 'res-4'],
    predecessors: ['2.3'],
    isSummary: true,
  },
  {
    id: 'task-3-1',
    wbs: '3.1',
    name: 'ພັດທະນາລະບົບ Gantt Chart & WBS Hierarchy (Frontend)',
    parentId: 'task-3',
    indent: 1,
    startDate: '2026-10-15',
    endDate: '2026-10-25',
    duration: 11,
    progress: 40,
    status: 'in_progress',
    priority: 'high',
    assigneeIds: ['res-4'],
    predecessors: ['2.3'],
  },
  {
    id: 'task-3-2',
    wbs: '3.2',
    name: 'ພັດທະນາໂມດູນຈັດການຊັບພະຍາກອນ (Resource Pool & Capacity)',
    parentId: 'task-3',
    indent: 1,
    startDate: '2026-10-20',
    endDate: '2026-10-28',
    duration: 9,
    progress: 30,
    status: 'in_progress',
    priority: 'medium',
    assigneeIds: ['res-2', 'res-4'],
    predecessors: ['3.1'],
  },
  {
    id: 'task-3-3',
    wbs: '3.3',
    name: 'ເຊື່ອມຕໍ່ Google Sheets API ສໍາລັບ Real-time Sync',
    parentId: 'task-3',
    indent: 1,
    startDate: '2026-10-26',
    endDate: '2026-11-04',
    duration: 10,
    progress: 10,
    status: 'in_progress',
    priority: 'urgent',
    assigneeIds: ['res-2'],
    predecessors: ['3.2'],
  },
  {
    id: 'task-3-4',
    wbs: '3.4',
    name: 'ຈຸດໝາຍ: ສຳເລັດລະບົບລຸ້ນ Beta (Beta Release Milestone)',
    parentId: 'task-3',
    indent: 1,
    startDate: '2026-11-05',
    endDate: '2026-11-05',
    duration: 0,
    progress: 0,
    status: 'not_started',
    priority: 'critical' as any,
    assigneeIds: ['res-1', 'res-2', 'res-4'],
    predecessors: ['3.3'],
    isMilestone: true,
  },

  // 4. Testing & Deployment
  {
    id: 'task-4',
    wbs: '4',
    name: '4. ການທົດສອບ ແລະ ສົ່ງມອບ (QA, Testing & Handover)',
    parentId: null,
    indent: 0,
    startDate: '2026-11-06',
    endDate: '2026-11-15',
    duration: 10,
    progress: 0,
    status: 'not_started',
    priority: 'high',
    assigneeIds: ['res-5'],
    predecessors: ['3.4'],
    isSummary: true,
  },
  {
    id: 'task-4-1',
    wbs: '4.1',
    name: 'ທົດສອບການຊິງຄ໌ຂໍ້ມູນພ້ອມກັນຫຼາຍຄົນ (Concurrency Testing)',
    parentId: 'task-4',
    indent: 1,
    startDate: '2026-11-06',
    endDate: '2026-11-10',
    duration: 5,
    progress: 0,
    status: 'not_started',
    priority: 'high',
    assigneeIds: ['res-5'],
    predecessors: ['3.4'],
  },
  {
    id: 'task-4-2',
    wbs: '4.2',
    name: 'ຝຶກອົບຮົມຜູ້ໃຊ້ ແລະ ສົ່ງມອບລະບົບ (Training & Deployment)',
    parentId: 'task-4',
    indent: 1,
    startDate: '2026-11-11',
    endDate: '2026-11-15',
    duration: 5,
    progress: 0,
    status: 'not_started',
    priority: 'medium',
    assigneeIds: ['res-1', 'res-5'],
    predecessors: ['4.1'],
  },
];

/**
 * Status translations and styles
 */
export const STATUS_CONFIG: Record<
  TaskStatus,
  { labelLo: string; labelEn: string; bg: string; text: string; border: string }
> = {
  not_started: {
    labelLo: 'ຍັງບໍ່ເລີ່ມ',
    labelEn: 'Not Started',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
  in_progress: {
    labelLo: 'ກຳລັງດຳເນີນການ',
    labelEn: 'In Progress',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  completed: {
    labelLo: 'ສຳເລັດແລ້ວ',
    labelEn: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  on_hold: {
    labelLo: 'ໂຈະຊົ່ວຄາວ',
    labelEn: 'On Hold',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  delayed: {
    labelLo: 'ຊັກຊ້າ',
    labelEn: 'Delayed',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { labelLo: string; labelEn: string; color: string }
> = {
  low: { labelLo: 'ຕ່ຳ', labelEn: 'Low', color: 'text-slate-500' },
  medium: { labelLo: 'ປານກາງ', labelEn: 'Medium', color: 'text-blue-600' },
  high: { labelLo: 'ສູງ', labelEn: 'High', color: 'text-amber-600' },
  urgent: { labelLo: 'ດ່ວນທີ່ສຸດ', labelEn: 'Critical', color: 'text-rose-600' },
};
