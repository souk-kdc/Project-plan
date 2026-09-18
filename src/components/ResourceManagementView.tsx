import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Clock,
  Briefcase,
  Trash2,
  Edit2,
  Calendar,
} from 'lucide-react';
import { Resource, Task, Language, ResourceType } from '../types';
import { calculateResourceWorkloads } from '../utils/projectUtils';

interface ResourceManagementViewProps {
  resources: Resource[];
  tasks: Task[];
  language: Language;
  onAddResource: (resource: Resource) => void;
  onUpdateResource: (resource: Resource) => void;
  onDeleteResource: (resourceId: string) => void;
}

export const ResourceManagementView: React.FC<ResourceManagementViewProps> = ({
  resources,
  tasks,
  language,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
}) => {
  const isLo = language === 'lo';
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<ResourceType>('work');
  const [capacity, setCapacity] = useState(100);
  const [hourlyRate, setHourlyRate] = useState(30);
  const [avatarColor, setAvatarColor] = useState('#2563EB');

  const workloads = calculateResourceWorkloads(resources, tasks);

  const handleOpenAdd = () => {
    setName('');
    setRole('');
    setEmail('');
    setType('work');
    setCapacity(100);
    setHourlyRate(30);
    setAvatarColor('#2563EB');
    setEditingResource(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (res: Resource) => {
    setName(res.name);
    setRole(res.role);
    setEmail(res.email);
    setType(res.type);
    setCapacity(res.capacity);
    setHourlyRate(res.hourlyRate);
    setAvatarColor(res.avatarColor || '#2563EB');
    setEditingResource(res);
    setShowAddModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingResource) {
      onUpdateResource({
        ...editingResource,
        name: name.trim(),
        role: role.trim() || 'Team Member',
        email: email.trim(),
        type,
        capacity,
        hourlyRate,
        avatarColor,
      });
    } else {
      const newRes: Resource = {
        id: `res-${Date.now()}`,
        name: name.trim(),
        role: role.trim() || 'Team Member',
        email: email.trim(),
        type,
        capacity,
        hourlyRate,
        avatarColor,
      };
      onAddResource(newRes);
    }
    setShowAddModal(false);
  };

  const colorOptions = ['#2563EB', '#16A34A', '#D97706', '#9333EA', '#DC2626', '#0891B2', '#4F46E5'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {isLo ? 'ສາງຊັບພະຍາກອນໂຄງການ (Resource Pool & Allocation)' : 'Resource Pool & Allocation'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isLo
              ? 'ຈັດການສະມາຊິກທີມ, ບຸກຄະລາກອນ, ຄວາມສາມາດໃນການຮັບວຽກ (Capacity), ອັດຕາຄ່າຈ້າງ ແລະ ຕິດຕາມວຽກທີ່ມອບໝາຍ'
              : 'Manage team members, work capacity, standard rates, and monitor active assignments'}
          </p>
        </div>

        <button
          id="add-resource-btn"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isLo ? 'ເພີ່ມຊັບພະຍາກອນໃໝ່' : 'Add Resource'}</span>
        </button>
      </div>

      {/* Resource Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {isLo ? `ລາຍການຊັບພະຍາກອນທັງໝົດ (${resources.length})` : `All Resources (${resources.length})`}
          </span>
          <span className="text-xs text-slate-500">
            {isLo ? 'ຕາຕະລາງແບບ MS Project Resource Sheet' : 'MS Project Resource Sheet View'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 min-w-[200px]">{isLo ? 'ຊື່ຊັບພະຍາກອນ' : 'Resource Name'}</th>
                <th className="px-4 py-3">{isLo ? 'ຕຳແໜ່ງ' : 'Role'}</th>
                <th className="px-3 py-3 text-center">{isLo ? 'ປະເພດ' : 'Type'}</th>
                <th className="px-3 py-3 text-center">{isLo ? 'ຄວາມສາມາດ (Max Units)' : 'Capacity'}</th>
                <th className="px-3 py-3 text-center">{isLo ? 'ອັດຕາຄ່າຈ້າງ' : 'Standard Rate'}</th>
                <th className="px-3 py-3 text-center">{isLo ? 'ວຽກທີ່ມອບໝາຍ' : 'Assigned Tasks'}</th>
                <th className="px-4 py-3">{isLo ? 'ສະຖານະການຮັບວຽກ (Allocation)' : 'Allocation Status'}</th>
                <th className="px-3 py-3 text-center">{isLo ? 'ຈັດການ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workloads.map(({ resource, allocatedTasks, totalWorkDays, isOverallocated }) => {
                return (
                  <tr key={resource.id} className="hover:bg-slate-50/80 transition">
                    {/* Name & Avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs"
                          style={{ backgroundColor: resource.avatarColor }}
                        >
                          {resource.name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{resource.name}</div>
                          <div className="text-[11px] text-slate-400">{resource.email || 'No email specified'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3 text-slate-700 font-medium">{resource.role}</td>

                    {/* Type */}
                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium uppercase">
                        {resource.type}
                      </span>
                    </td>

                    {/* Capacity */}
                    <td className="px-3 py-3 text-center font-mono font-medium text-slate-700">
                      {resource.capacity}%
                    </td>

                    {/* Hourly Rate */}
                    <td className="px-3 py-3 text-center font-mono text-slate-700">
                      ${resource.hourlyRate}/hr
                    </td>

                    {/* Assigned Tasks Count & Days */}
                    <td className="px-3 py-3 text-center">
                      <span className="font-semibold text-slate-900">{allocatedTasks.length}</span>{' '}
                      <span className="text-slate-500">
                        ({totalWorkDays} {isLo ? 'ມື້' : 'days'})
                      </span>
                    </td>

                    {/* Overallocation Status */}
                    <td className="px-4 py-3">
                      {isOverallocated ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{isLo ? 'ວຽກເກີນກຳລັງ (Overallocated)' : 'Overallocated'}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isLo ? 'ປົກກະຕິ (Balanced)' : 'Balanced'}</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(resource)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded transition"
                          title={isLo ? 'ແກ້ໄຂ' : 'Edit'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(isLo ? `ຕ້ອງການລຶບຊັບພະຍາກອນ ${resource.name}?` : `Delete resource ${resource.name}?`)) {
                              onDeleteResource(resource.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition"
                          title={isLo ? 'ລຶບ' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resource Allocation Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-600" />
          <span>{isLo ? 'ລາຍລະອຽດວຽກທີ່ມອບໝາຍແຕ່ລະຄົນ (Assigned Task Details)' : 'Task Assignment Breakdown'}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workloads.map(({ resource, allocatedTasks }) => (
            <div key={resource.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: resource.avatarColor }}
                >
                  {resource.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 text-xs truncate">{resource.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{resource.role}</div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-1 max-h-40 overflow-y-auto">
                {allocatedTasks.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic">
                    {isLo ? 'ຍັງບໍ່ມີວຽກທີ່ມອບໝາຍ' : 'No tasks assigned yet'}
                  </div>
                ) : (
                  allocatedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="text-[11px] flex items-center justify-between gap-1 text-slate-700 bg-white p-1.5 rounded border border-slate-100"
                    >
                      <span className="font-mono text-slate-400 text-[10px]">{t.wbs}</span>
                      <span className="truncate flex-1 font-medium">{t.name}</span>
                      <span className="text-slate-500 font-mono text-[10px]">{t.duration}d</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingResource
                ? isLo
                  ? 'ແກ້ໄຂຊັບພະຍາກອນ'
                  : 'Edit Resource'
                : isLo
                ? 'ເພີ່ມຊັບພະຍາກອນໃໝ່'
                : 'Add New Resource'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  {isLo ? 'ຊື່ ແລະ ນາມສະກຸນ *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isLo ? 'ຕົວຢ່າງ: ສົມສັກ ແກ້ວມະນີ' : 'e.g. Somsack K.'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  {isLo ? 'ຕຳແໜ່ງ / ໜ້າທີ່' : 'Role / Title'}
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder={isLo ? 'ຕົວຢ່າງ: Senior Developer' : 'e.g. Frontend Engineer'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  {isLo ? 'ອີເມລ (Email)' : 'Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.la"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    {isLo ? 'ປະເພດ' : 'Type'}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ResourceType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="work">{isLo ? 'ແຮງງານ (Work)' : 'Work'}</option>
                    <option value="material">{isLo ? 'ວັດສະດຸ (Material)' : 'Material'}</option>
                    <option value="cost">{isLo ? 'ຄ່າໃຊ້ຈ່າຍ (Cost)' : 'Cost'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    {isLo ? 'ຄວາມສາມາດ (%)' : 'Capacity (%)'}
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    step="10"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 100)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    {isLo ? 'ອັດຕາຄ່າຈ້າງ ($/ຊມ)' : 'Rate ($/hr)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    {isLo ? 'ສີ Avatar' : 'Avatar Color'}
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {colorOptions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAvatarColor(c)}
                        className={`w-6 h-6 rounded-full transition ${
                          avatarColor === c ? 'ring-2 ring-offset-2 ring-slate-800' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition"
                >
                  {isLo ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                >
                  {isLo ? 'ບັນທຶກ' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
