import React, { useState, useEffect } from 'react';
import {
  Bus,
  MapPin,
  Users,
  Search,
  Plus,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  AlertCircle,
  X,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import transportService from '../../services/transportService.js';
import studentService from '../../services/studentService.js';

export const TransportPage = () => {
  const [activeTab, setActiveTab] = useState('vehicles');
  const [loading, setLoading] = useState(false);

  // Data states
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [students, setStudents] = useState([]);

  // Modals
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    model: '',
    seatingCapacity: 30,
    driverName: '',
    driverPhone: '',
  });

  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routeForm, setRouteForm] = useState({
    routeName: '',
    vehicleId: '',
    startLocation: '',
    endLocation: 'School Main Campus',
    stops: [
      { stopName: 'Central Square', pickupTime: '07:15 AM', dropTime: '03:45 PM', fare: 50 },
      { stopName: 'Park Avenue', pickupTime: '07:30 AM', dropTime: '03:30 PM', fare: 40 },
    ],
  });

  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [allocationForm, setAllocationForm] = useState({
    studentId: '',
    routeId: '',
    vehicleId: '',
    stopName: '',
    monthlyCharge: 50,
  });

  const [banner, setBanner] = useState({ type: '', text: '' });
  const showBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 4000);
  };

  const loadStudents = async () => {
    try {
      const res = await studentService.getStudents({ limit: 100 });
      if (res.data?.data?.students) setStudents(res.data.data.students);
    } catch (err) {
      console.error(err);
    }
  };

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await transportService.getVehicles();
      if (res.data?.data) setVehicles(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const res = await transportService.getRoutes();
      if (res.data?.data) setRoutes(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllocations = async () => {
    try {
      setLoading(true);
      const res = await transportService.getAllocations();
      if (res.data?.data) setAllocations(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (activeTab === 'vehicles') loadVehicles();
    if (activeTab === 'routes') loadRoutes();
    if (activeTab === 'allocations') loadAllocations();
  }, [activeTab]);

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      await transportService.createVehicle({
        vehicleNumber: vehicleForm.vehicleNumber,
        model: vehicleForm.model,
        seatingCapacity: Number(vehicleForm.seatingCapacity),
        driver: {
          name: vehicleForm.driverName,
          phone: vehicleForm.driverPhone,
        },
      });
      showBanner('success', 'Vehicle registered successfully.');
      setIsVehicleModalOpen(false);
      loadVehicles();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to register vehicle.');
    }
  };

  const handleAddStop = () => {
    setRouteForm({
      ...routeForm,
      stops: [
        ...routeForm.stops,
        { stopName: '', pickupTime: '07:45 AM', dropTime: '03:15 PM', fare: 40 },
      ],
    });
  };

  const handleStopChange = (index, field, value) => {
    const updated = [...routeForm.stops];
    updated[index][field] = field === 'fare' ? Number(value) : value;
    setRouteForm({ ...routeForm, stops: updated });
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      await transportService.createRoute(routeForm);
      showBanner('success', 'Transport route saved successfully.');
      setIsRouteModalOpen(false);
      loadRoutes();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to create route.');
    }
  };

  const handleAllocateSeat = async (e) => {
    e.preventDefault();
    try {
      await transportService.allocateTransport(allocationForm);
      showBanner('success', 'Student transport pass allocated successfully.');
      setIsAllocationModalOpen(false);
      loadAllocations();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to allocate seat.');
    }
  };

  return (
    <div className="space-y-6">
      {banner.text && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm font-medium ${
            banner.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{banner.text}</span>
          </div>
          <button onClick={() => setBanner({ type: '', text: '' })}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Transport Fleet & Route Logistics
            </h1>
            <Badge variant="primary">Phase 8</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage school buses, scheduled pickup/drop stops, and student seat allocations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => setIsRouteModalOpen(true)}
            icon={<MapPin className="w-4 h-4" />}
          >
            + New Route
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsVehicleModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'vehicles'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bus className="w-4 h-4" />
          <span>Vehicle Fleet</span>
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'routes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Routes & Schedules</span>
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'allocations'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Seat Allocations</span>
        </button>
      </div>

      {loading && (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading transport operations..." />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. VEHICLES TAB */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.length > 0 ? (
            vehicles.map((v) => (
              <Card key={v._id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {v.vehicleNumber}
                    </span>
                    <Badge variant={v.status === 'Active' ? 'success' : 'warning'}>{v.status}</Badge>
                  </div>

                  <h4 className="font-bold text-base text-slate-900 mt-2">{v.model}</h4>

                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Driver: {v.driver?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.driver?.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Seating Capacity</span>
                    <span className="font-bold text-sm text-slate-800">
                      {v.allocatedSeats || 0} occupied / {v.seatingCapacity} seats
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-md ${
                      v.availableSeats > 0
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {v.availableSeats} Left
                  </span>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-3">
              <EmptyState
                title="No fleet vehicles registered"
                description="Register buses and vans to configure school routes."
                actionLabel="+ Register First Vehicle"
                onAction={() => setIsVehicleModalOpen(true)}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ROUTES TAB */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'routes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {routes.length > 0 ? (
              routes.map((r) => (
                <Card key={r._id} className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-base text-slate-900">{r.routeName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {r.startLocation} &rarr; {r.endLocation}
                      </p>
                    </div>
                    {r.vehicleId && (
                      <Badge variant="primary">
                        Bus: {r.vehicleId.vehicleNumber} ({r.vehicleId.seatingCapacity} seats)
                      </Badge>
                    )}
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-600 block mb-2">
                      Scheduled Bus Stops ({r.stops?.length || 0})
                    </span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {r.stops?.map((stop, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800">{stop.stopName}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 font-medium">
                              {stop.pickupTime} / {stop.dropTime}
                            </span>
                            <span className="ml-2 font-bold text-emerald-600">${stop.fare}/mo</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-2">
                <EmptyState
                  title="No transport routes configured"
                  description="Create routes with designated stops, schedules, and monthly charges."
                  actionLabel="+ Create First Route"
                  onAction={() => setIsRouteModalOpen(true)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SEAT ALLOCATIONS TAB */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'allocations' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Active Bus Passes & Seat Allocations</h3>
            <Button
              variant="primary"
              onClick={() => setIsAllocationModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Allocate Bus Pass
            </Button>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Route Name</th>
                    <th className="py-3.5 px-4">Assigned Stop</th>
                    <th className="py-3.5 px-4">Vehicle</th>
                    <th className="py-3.5 px-4">Timings</th>
                    <th className="py-3.5 px-4 text-right">Monthly Fee</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allocations.length > 0 ? (
                    allocations.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {a.studentId?.firstName} {a.studentId?.lastName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {a.studentId?.admissionNumber} • {a.studentId?.currentClass?.name || 'Class'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{a.routeId?.routeName}</td>
                        <td className="py-3 px-4 font-semibold text-indigo-700">{a.stopName}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-700">
                          {a.vehicleId?.vehicleNumber}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {a.pickupTime} &rarr; {a.dropTime}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          ${a.monthlyCharge}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="success">{a.status}</Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        No students allocated to transport routes yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTER VEHICLE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        title="Register School Transport Vehicle"
      >
        <form onSubmit={handleCreateVehicle} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Vehicle Plate # *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BUS-12-DL"
                value={vehicleForm.vehicleNumber}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value.toUpperCase() })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Model / Make *</label>
              <input
                type="text"
                required
                placeholder="e.g. Tata Marcopolo 40-Seater"
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Seating Capacity *
            </label>
            <input
              type="number"
              min="1"
              required
              value={vehicleForm.seatingCapacity}
              onChange={(e) =>
                setVehicleForm({ ...vehicleForm, seatingCapacity: Number(e.target.value) })
              }
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Driver Name *</label>
              <input
                type="text"
                required
                placeholder="Driver full name"
                value={vehicleForm.driverName}
                onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Driver Phone *
              </label>
              <input
                type="tel"
                required
                placeholder="+1 555..."
                value={vehicleForm.driverPhone}
                onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsVehicleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Register Vehicle
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURE ROUTE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        title="Configure Transport Route & Stops"
      >
        <form onSubmit={handleCreateRoute} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Route Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. North Ridge Route 3"
                value={routeForm.routeName}
                onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Bus</label>
              <select
                value={routeForm.vehicleId}
                onChange={(e) => setRouteForm({ ...routeForm, vehicleId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Select Bus / Van</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.vehicleNumber} ({v.model})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Start Location *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Metro Junction"
                value={routeForm.startLocation}
                onChange={(e) => setRouteForm({ ...routeForm, startLocation: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Destination *
              </label>
              <input
                type="text"
                required
                value={routeForm.endLocation}
                onChange={(e) => setRouteForm({ ...routeForm, endLocation: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600">Route Bus Stops</label>
              <button
                type="button"
                onClick={handleAddStop}
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Stop
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {routeForm.stops.map((stop, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Stop Name"
                    required
                    value={stop.stopName}
                    onChange={(e) => handleStopChange(idx, 'stopName', e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="Pickup Time"
                    value={stop.pickupTime}
                    onChange={(e) => handleStopChange(idx, 'pickupTime', e.target.value)}
                    className="w-24 px-2 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                  <input
                    type="number"
                    placeholder="Fare ($)"
                    value={stop.fare}
                    onChange={(e) => handleStopChange(idx, 'fare', e.target.value)}
                    className="w-16 px-2 py-1.5 text-xs rounded-lg border border-slate-200 font-bold"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsRouteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Route
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ALLOCATE SEAT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        title="Issue Student Transport Pass"
      >
        <form onSubmit={handleAllocateSeat} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Student *</label>
            <select
              required
              value={allocationForm.studentId}
              onChange={(e) => setAllocationForm({ ...allocationForm, studentId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.firstName} {s.lastName} ({s.admissionNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select Route *</label>
              <select
                required
                value={allocationForm.routeId}
                onChange={(e) => {
                  const r = routes.find((route) => route._id === e.target.value);
                  setAllocationForm({
                    ...allocationForm,
                    routeId: e.target.value,
                    vehicleId: r?.vehicleId?._id || '',
                  });
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Select Route</option>
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.routeName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select Bus *</label>
              <select
                required
                value={allocationForm.vehicleId}
                onChange={(e) => setAllocationForm({ ...allocationForm, vehicleId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Select Vehicle</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.vehicleNumber} ({v.availableSeats || 0} seats left)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Designated Stop *</label>
              <input
                type="text"
                required
                placeholder="e.g. Hillcrest Corner"
                value={allocationForm.stopName}
                onChange={(e) => setAllocationForm({ ...allocationForm, stopName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Monthly Transport Charge ($)
              </label>
              <input
                type="number"
                min="0"
                value={allocationForm.monthlyCharge}
                onChange={(e) =>
                  setAllocationForm({ ...allocationForm, monthlyCharge: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsAllocationModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" icon={<ShieldCheck className="w-4 h-4" />}>
              Issue Pass & Allocate Seat
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TransportPage;
