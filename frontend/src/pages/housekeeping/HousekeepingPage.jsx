import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckSquare,
  Building2,
  Package,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Calendar,
  Layers,
  X,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import facilitiesService from '../../services/facilitiesService.js';
import staffService from '../../services/staffService.js';

export const HousekeepingPage = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(false);

  // Data states
  const [tasks, setTasks] = useState([]);
  const [areas, setAreas] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Modals & Selection
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Filters
  const [shiftFilter, setShiftFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Forms
  const [taskForm, setTaskForm] = useState({
    title: '',
    areaId: '',
    assignedTo: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    shift: 'Morning',
    remarks: '',
  });

  const [areaForm, setAreaForm] = useState({
    name: '',
    building: 'Main Block',
    floor: 'Ground Floor',
    cleaningFrequency: 'Daily',
    supervisorId: '',
  });

  const [supplyForm, setSupplyForm] = useState({
    name: '',
    category: 'Detergent/Chemical',
    quantityInStock: 10,
    unit: 'Liters',
    minimumAlertLevel: 5,
    storageLocation: 'Janitorial Closet 1',
  });

  const [banner, setBanner] = useState({ type: '', text: '' });
  const showBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, aRes, sRes, eRes] = await Promise.all([
        facilitiesService.getTasks(),
        facilitiesService.getAreas(),
        facilitiesService.getSupplies(),
        staffService.getEmployees({ limit: 100 }),
      ]);
      if (tRes.data?.data) setTasks(tRes.data.data);
      if (aRes.data?.data) setAreas(aRes.data.data);
      if (sRes.data?.data) setSupplies(sRes.data.data);
      if (eRes.data?.data?.employees) setEmployees(eRes.data.data.employees);
    } catch (err) {
      console.error(err);
      showBanner('error', 'Failed to load facilities data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await facilitiesService.createTask(taskForm);
      showBanner('success', 'Cleaning duty scheduled');
      setIsTaskModalOpen(false);
      setTaskForm({
        title: '',
        areaId: '',
        assignedTo: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        shift: 'Morning',
        remarks: '',
      });
      loadData();
    } catch (err) {
      console.error(err);
      showBanner('error', err.response?.data?.message || 'Failed to schedule task');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArea = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await facilitiesService.createArea({
        ...areaForm,
        supervisorId: areaForm.supervisorId || undefined,
      });
      showBanner('success', 'Campus zone added');
      setIsAreaModalOpen(false);
      setAreaForm({
        name: '',
        building: 'Main Block',
        floor: 'Ground Floor',
        cleaningFrequency: 'Daily',
        supervisorId: '',
      });
      loadData();
    } catch (err) {
      console.error(err);
      showBanner('error', err.response?.data?.message || 'Failed to create area');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupply = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await facilitiesService.createSupply(supplyForm);
      showBanner('success', 'Cleaning supply registered');
      setIsSupplyModalOpen(false);
      setSupplyForm({
        name: '',
        category: 'Detergent/Chemical',
        quantityInStock: 10,
        unit: 'Liters',
        minimumAlertLevel: 5,
        storageLocation: 'Janitorial Closet 1',
      });
      loadData();
    } catch (err) {
      console.error(err);
      showBanner('error', err.response?.data?.message || 'Failed to add supply');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChecklistItem = async (idx) => {
    if (!selectedTask) return;
    const updatedChecklist = [...selectedTask.checklist];
    updatedChecklist[idx].isCompleted = !updatedChecklist[idx].isCompleted;

    try {
      const res = await facilitiesService.updateTask(selectedTask._id, {
        checklist: updatedChecklist,
      });
      setSelectedTask(res.data.data);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyTask = async () => {
    if (!selectedTask) return;
    try {
      const res = await facilitiesService.updateTask(selectedTask._id, {
        status: 'Verified',
      });
      setSelectedTask(res.data.data);
      showBanner('success', 'Housekeeping task verified by supervisor');
      loadData();
    } catch (err) {
      console.error(err);
      showBanner('error', 'Failed to verify task');
    }
  };

  // Metrics
  const completedTasksCount = tasks.filter(
    (t) => t.status === 'Completed' || t.status === 'Verified'
  ).length;
  const pendingTasksCount = tasks.filter((t) => t.status === 'Pending').length;
  const lowSuppliesCount = supplies.filter(
    (s) => s.quantityInStock <= s.minimumAlertLevel
  ).length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      {banner.text && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium ${
            banner.type === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          <span>{banner.text}</span>
          <button onClick={() => setBanner({ type: '', text: '' })}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-indigo-600" />
            Housekeeping & Facilities
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cleaning rosters, shift checklist verification, campus areas, and sanitation inventory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsAreaModalOpen(true)}>
            <Building2 className="w-4 h-4 mr-1.5" />
            New Area
          </Button>
          <Button variant="primary" onClick={() => setIsTaskModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Assign Cleaning Task
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Tasks Scheduled</p>
            <h3 className="text-2xl font-bold text-slate-900">{tasks.length}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Completed / Verified</p>
            <h3 className="text-2xl font-bold text-slate-900">{completedTasksCount}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Campus Zones</p>
            <h3 className="text-2xl font-bold text-slate-900">{areas.length}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Low Supplies</p>
            <h3 className="text-2xl font-bold text-slate-900">{lowSuppliesCount}</h3>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'tasks'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Cleaning Duty Rosters ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('areas')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'areas'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Campus Zones ({areas.length})
        </button>
        <button
          onClick={() => setActiveTab('supplies')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'supplies'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Sanitation Supplies ({supplies.length})
        </button>
      </div>

      {/* TAB 1: CLEANING TASKS */}
      {activeTab === 'tasks' && (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h3 className="font-bold text-slate-900">Assigned Cleaning Shifts</h3>
            <div className="flex items-center gap-2">
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="All">All Shifts</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Verified">Verified</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No cleaning tasks scheduled"
              description="Assign daily cleaning duty rosters to staff members."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Task #</th>
                    <th className="px-4 py-3">Title & Area</th>
                    <th className="px-4 py-3">Assigned Staff</th>
                    <th className="px-4 py-3">Shift & Date</th>
                    <th className="px-4 py-3">Checklist Progress</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks
                    .filter((t) => shiftFilter === 'All' || t.shift === shiftFilter)
                    .filter((t) => statusFilter === 'All' || t.status === statusFilter)
                    .map((t) => {
                      const totalItems = t.checklist?.length || 0;
                      const doneItems = t.checklist?.filter((c) => c.isCompleted).length || 0;

                      return (
                        <tr key={t._id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">
                            {t.taskCode}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{t.title}</p>
                            <p className="text-xs text-slate-400">
                              {t.areaId?.name} ({t.areaId?.building})
                            </p>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <p className="font-medium text-slate-800">
                              {t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Unassigned'}
                            </p>
                            <span className="text-[11px] text-slate-400">{t.assignedTo?.employeeId}</span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className="font-medium">{t.shift}</span>
                            <span className="block text-[11px] text-slate-400">
                              {new Date(t.scheduledDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full transition-all"
                                  style={{
                                    width: `${totalItems > 0 ? (doneItems / totalItems) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-slate-600">
                                {doneItems}/{totalItems}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                t.status === 'Verified'
                                  ? 'success'
                                  : t.status === 'Completed'
                                  ? 'primary'
                                  : t.status === 'In Progress'
                                  ? 'warning'
                                  : 'default'
                              }
                            >
                              {t.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedTask(t)}
                            >
                              Checklist
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: CAMPUS AREAS */}
      {activeTab === 'areas' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900">Campus Facilities & Cleaning Frequency</h3>
            <Button variant="primary" size="sm" onClick={() => setIsAreaModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Zone
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((area) => (
              <div key={area._id} className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{area.name}</h4>
                    <p className="text-xs text-slate-400 font-medium">
                      {area.building} • {area.floor}
                    </p>
                  </div>
                  <Badge variant="primary">{area.cleaningFrequency}</Badge>
                </div>
                <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
                  <span>Supervisor</span>
                  <span className="font-semibold text-slate-700">
                    {area.supervisorId ? `${area.supervisorId.firstName} ${area.supervisorId.lastName}` : 'Unassigned'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: SANITATION SUPPLIES */}
      {activeTab === 'supplies' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900">Janitorial & Sanitation Supplies</h3>
            <Button variant="primary" size="sm" onClick={() => setIsSupplyModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Supply
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Item Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Stock Available</th>
                  <th className="px-4 py-3">Storage Location</th>
                  <th className="px-4 py-3">Min Alert Level</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplies.map((s) => {
                  const isLow = s.quantityInStock <= s.minimumAlertLevel;
                  return (
                    <tr key={s._id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="px-4 py-3">{s.category}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {s.quantityInStock} {s.unit}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{s.storageLocation}</td>
                      <td className="px-4 py-3 text-slate-500">{s.minimumAlertLevel}</td>
                      <td className="px-4 py-3">
                        {isLow ? (
                          <Badge variant="danger">Low Stock Alert</Badge>
                        ) : (
                          <Badge variant="success">Normal</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL: ASSIGN TASK */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Assign Daily Housekeeping Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Science Lab Floor Sanitization"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Campus Area *</label>
              <select
                required
                value={taskForm.areaId}
                onChange={(e) => setTaskForm({ ...taskForm, areaId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                <option value="">Select Campus Area</option>
                {areas.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.building})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assigned Staff *</label>
              <select
                required
                value={taskForm.assignedTo}
                onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                <option value="">Select Staff</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Scheduled Date *</label>
              <input
                type="date"
                required
                value={taskForm.scheduledDate}
                onChange={(e) => setTaskForm({ ...taskForm, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Shift</label>
              <select
                value={taskForm.shift}
                onChange={(e) => setTaskForm({ ...taskForm, shift: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              Schedule Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: INTERACTIVE CHECKLIST */}
      {selectedTask && (
        <Modal
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          title={`Checklist: ${selectedTask.title}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex justify-between">
              <span>Area: {selectedTask.areaId?.name}</span>
              <span>Shift: {selectedTask.shift}</span>
              <span className="font-semibold text-indigo-600">Status: {selectedTask.status}</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-slate-400">Shift Checkpoints</p>
              {selectedTask.checklist?.map((item, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/70 hover:bg-slate-50 cursor-pointer text-sm text-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => handleToggleChecklistItem(idx)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className={item.isCompleted ? 'line-through text-slate-400' : 'font-medium'}>
                    {item.item}
                  </span>
                </label>
              ))}
            </div>

            {selectedTask.status !== 'Verified' && (
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button variant="primary" onClick={handleVerifyTask}>
                  <UserCheck className="w-4 h-4 mr-1.5" />
                  Supervisor Sign-Off & Verify
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL: ADD AREA */}
      <Modal
        isOpen={isAreaModalOpen}
        onClose={() => setIsAreaModalOpen(false)}
        title="Add Campus Area"
      >
        <form onSubmit={handleCreateArea} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Area Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Science Block 1st Floor Restrooms"
              value={areaForm.name}
              onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Building *</label>
              <input
                type="text"
                required
                value={areaForm.building}
                onChange={(e) => setAreaForm({ ...areaForm, building: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Floor *</label>
              <input
                type="text"
                required
                value={areaForm.floor}
                onChange={(e) => setAreaForm({ ...areaForm, floor: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cleaning Frequency</label>
            <select
              value={areaForm.cleaningFrequency}
              onChange={(e) => setAreaForm({ ...areaForm, cleaningFrequency: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            >
              {['Hourly', 'Twice Daily', 'Daily', 'Alternate Days', 'Weekly'].map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsAreaModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              Create Zone
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD SUPPLY */}
      <Modal
        isOpen={isSupplyModalOpen}
        onClose={() => setIsSupplyModalOpen(false)}
        title="Add Cleaning Supply"
      >
        <form onSubmit={handleCreateSupply} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Supply Name *</label>
            <input
              type="text"
              required
              value={supplyForm.name}
              onChange={(e) => setSupplyForm({ ...supplyForm, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={supplyForm.category}
                onChange={(e) => setSupplyForm({ ...supplyForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {[
                  'Detergent/Chemical',
                  'Sanitary Paper',
                  'Trash Management',
                  'Tool/Mop/Brush',
                  'Safety Gear',
                  'Other',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Stock Quantity</label>
              <input
                type="number"
                min={0}
                value={supplyForm.quantityInStock}
                onChange={(e) => setSupplyForm({ ...supplyForm, quantityInStock: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsSupplyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              Save Supply
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HousekeepingPage;
