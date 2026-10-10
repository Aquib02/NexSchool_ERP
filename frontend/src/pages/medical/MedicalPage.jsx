import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stethoscope,
  HeartPulse,
  AlertTriangle,
  Pill,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  PhoneCall,
  User,
  Activity,
  AlertOctagon,
  Calendar,
  X,
  ShieldAlert,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import medicalService from '../../services/medicalService.js';
import studentService from '../../services/studentService.js';

export const MedicalPage = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'visits');
  const [loading, setLoading] = useState(false);

  // Data states
  const [visits, setVisits] = useState([]);
  const [records, setRecords] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [students, setStudents] = useState([]);

  // Filters & Search
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('All');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('All');

  // Modals
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);

  // Forms
  const [visitForm, setVisitForm] = useState({
    patronType: 'Student',
    studentId: '',
    symptoms: '',
    diagnosis: '',
    treatmentGiven: '',
    medicineName: '',
    medicineQty: 1,
    temperatureCelsius: '',
    bloodPressure: '',
    parentNotified: false,
    referredToHospital: false,
    status: 'Discharged',
  });

  const [recordForm, setRecordForm] = useState({
    studentId: '',
    bloodGroup: 'O+',
    heightCm: '',
    weightKg: '',
    allergen: '',
    allergySeverity: 'Moderate',
    allergyReaction: '',
    chronicConditions: '',
    emergencyHospital: '',
    familyPhysician: '',
  });

  const [medicineForm, setMedicineForm] = useState({
    name: '',
    category: 'Analgesic',
    quantityAvailable: 50,
    unit: 'Tablets',
    expiryDate: '',
    lowStockThreshold: 10,
    location: 'Cabinet 1',
  });

  const [banner, setBanner] = useState({ type: '', text: '' });
  const showBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 4000);
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [vRes, rRes, iRes, sRes] = await Promise.all([
        medicalService.getVisits(),
        medicalService.getRecords(),
        medicalService.getInventory(),
        studentService.getStudents({ limit: 100 }),
      ]);
      if (vRes.data?.data) setVisits(vRes.data.data);
      if (rRes.data?.data) setRecords(rRes.data.data);
      if (iRes.data?.data) setInventory(iRes.data.data);
      if (sRes.data?.data?.students) setStudents(sRes.data.data.students);
    } catch (err) {
      console.error(err);
      showBanner('error', 'Failed to load medical data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleCreateVisit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        patronType: visitForm.patronType,
        studentId: visitForm.studentId || undefined,
        symptoms: visitForm.symptoms,
        diagnosis: visitForm.diagnosis,
        treatmentGiven: visitForm.treatmentGiven,
        temperatureCelsius: visitForm.temperatureCelsius ? Number(visitForm.temperatureCelsius) : undefined,
        bloodPressure: visitForm.bloodPressure || undefined,
        parentNotified: visitForm.parentNotified,
        referredToHospital: visitForm.referredToHospital,
        status: visitForm.status,
        medicinesAdministered: visitForm.medicineName
          ? [{ medicineName: visitForm.medicineName, quantity: Number(visitForm.medicineQty || 1) }]
          : [],
      };

      const res = await medicalService.createVisit(payload);
      showBanner('success', 'Infirmary visit recorded successfully');
      if (res.data?.allergyAlerts?.length) {
        showBanner('error', `ATTENTION: Student has allergy warnings on record!`);
      }
      setIsVisitModalOpen(false);
      setVisitForm({
        patronType: 'Student',
        studentId: '',
        symptoms: '',
        diagnosis: '',
        treatmentGiven: '',
        medicineName: '',
        medicineQty: 1,
        temperatureCelsius: '',
        bloodPressure: '',
        parentNotified: false,
        referredToHospital: false,
        status: 'Discharged',
      });
      loadInitialData();
    } catch (err) {
      console.error(err);
      showBanner('error', err.response?.data?.message || 'Error recording visit');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const allergies = visitForm.allergen
        ? [
            {
              allergen: recordForm.allergen,
              severity: recordForm.allergySeverity,
              reaction: recordForm.allergyReaction,
            },
          ]
        : [];

      const payload = {
        studentId: recordForm.studentId,
        bloodGroup: recordForm.bloodGroup,
        heightCm: recordForm.heightCm ? Number(recordForm.heightCm) : undefined,
        weightKg: recordForm.weightKg ? Number(recordForm.weightKg) : undefined,
        allergies,
        chronicConditions: recordForm.chronicConditions
          ? recordForm.chronicConditions.split(',').map((c) => c.trim())
          : [],
        emergencyHospital: recordForm.emergencyHospital ? { hospitalName: recordForm.emergencyHospital } : undefined,
        familyPhysician: recordForm.familyPhysician ? { doctorName: recordForm.familyPhysician } : undefined,
      };

      await medicalService.upsertRecord(payload);
      showBanner('success', 'Student health profile saved successfully');
      setIsRecordModalOpen(false);
      loadInitialData();
    } catch (err) {
      console.error(err);
      showBanner('error', err.response?.data?.message || 'Error saving health profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMedicine = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await medicalService.createMedicine(medicineForm);
      showBanner('success', 'Medicine added to inventory');
      setIsMedicineModalOpen(false);
      setMedicineForm({
        name: '',
        category: 'Analgesic',
        quantityAvailable: 50,
        unit: 'Tablets',
        expiryDate: '',
        lowStockThreshold: 10,
        location: 'Cabinet 1',
      });
      loadInitialData();
    } catch (err) {
      console.error(err);
      showBanner('error', err.response?.data?.message || 'Error adding medicine');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVisitStatus = async (id, status) => {
    try {
      await medicalService.updateVisitStatus(id, { status });
      showBanner('success', `Visit status updated to ${status}`);
      loadInitialData();
    } catch (err) {
      console.error(err);
      showBanner('error', 'Failed to update visit status');
    }
  };

  // Stats
  const criticalAllergiesCount = records.reduce((count, r) => {
    const hasCrit = r.allergies?.some((a) => a.severity === 'Severe' || a.severity === 'Critical');
    return hasCrit ? count + 1 : count;
  }, 0);

  const underObservationCount = visits.filter((v) => v.status === 'Under Observation').length;
  const lowStockCount = inventory.filter((i) => i.quantityAvailable <= i.lowStockThreshold).length;

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
            <Stethoscope className="w-7 h-7 text-indigo-600" />
            Medical & Infirmary Services
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Student health directory, allergy alerts, clinic visit logs, and first aid dispensary.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsRecordModalOpen(true)}>
            <HeartPulse className="w-4 h-4 mr-1.5 text-rose-500" />
            Health Profile
          </Button>
          <Button variant="primary" onClick={() => setIsVisitModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Log Clinic Visit
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Visits</p>
            <h3 className="text-2xl font-bold text-slate-900">{visits.length}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Under Observation</p>
            <h3 className="text-2xl font-bold text-slate-900">{underObservationCount}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Critical Allergies</p>
            <h3 className="text-2xl font-bold text-slate-900">{criticalAllergiesCount}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Low Stock Medicines</p>
            <h3 className="text-2xl font-bold text-slate-900">{lowStockCount}</h3>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('visits')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'visits'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Clinic Visits ({visits.length})
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'records'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          Health Profiles ({records.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          Medicine Stock ({inventory.length})
        </button>
      </div>

      {/* TAB 1: CLINIC VISITS */}
      {activeTab === 'visits' && (
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search visits..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Under Observation">Under Observation</option>
                <option value="Discharged">Discharged</option>
                <option value="Referred Out">Referred Out</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : visits.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No clinic visits recorded"
              description="Click 'Log Clinic Visit' to record a student or staff consultation."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Visit #</th>
                    <th className="px-4 py-3">Patron</th>
                    <th className="px-4 py-3">Symptoms / Diagnosis</th>
                    <th className="px-4 py-3">Treatment / Medicine</th>
                    <th className="px-4 py-3">Vitals</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visits
                    .filter((v) => statusFilter === 'All' || v.status === statusFilter)
                    .filter((v) => {
                      if (!search.trim()) return true;
                      const q = search.toLowerCase();
                      const patronName = v.studentId
                        ? `${v.studentId.firstName} ${v.studentId.lastName}`
                        : v.employeeId
                        ? `${v.employeeId.firstName} ${v.employeeId.lastName}`
                        : '';
                      return (
                        v.visitNumber?.toLowerCase().includes(q) ||
                        patronName.toLowerCase().includes(q) ||
                        v.symptoms?.toLowerCase().includes(q) ||
                        v.diagnosis?.toLowerCase().includes(q) ||
                        v.treatment?.toLowerCase().includes(q)
                      );
                    })
                    .map((visit) => (
                      <tr key={visit._id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">
                          {visit.visitNumber}
                          <div className="text-[11px] text-slate-400 font-sans">
                            {new Date(visit.visitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {visit.studentId
                              ? `${visit.studentId.firstName} ${visit.studentId.lastName}`
                              : visit.employeeId
                              ? `${visit.employeeId.firstName} ${visit.employeeId.lastName}`
                              : 'Walk-in'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {visit.studentId?.admissionNumber || visit.employeeId?.employeeId || visit.patronType}
                          </p>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-slate-800 font-medium truncate">{visit.symptoms}</p>
                          <p className="text-xs text-slate-500 truncate">{visit.diagnosis || 'General checkup'}</p>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-slate-800 text-xs">{visit.treatmentGiven}</p>
                          {visit.medicinesAdministered?.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-medium mt-1">
                              <Pill className="w-3 h-3" />
                              {visit.medicinesAdministered.map((m) => `${m.medicineName} (${m.quantity})`).join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {visit.temperatureCelsius && <div>Temp: {visit.temperatureCelsius}°C</div>}
                          {visit.bloodPressure && <div>BP: {visit.bloodPressure}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              visit.status === 'Discharged'
                                ? 'success'
                                : visit.status === 'Under Observation'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {visit.status}
                          </Badge>
                          {visit.parentNotified && (
                            <span className="block text-[10px] text-emerald-600 font-medium mt-0.5">
                              ✓ Parent Notified
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {visit.status === 'Under Observation' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateVisitStatus(visit._id, 'Discharged')}
                            >
                              Discharge
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: HEALTH PROFILES */}
      {activeTab === 'records' && (
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
            >
              <option value="All">All Blood Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          {records.length === 0 ? (
            <EmptyState
              icon={HeartPulse}
              title="No health profiles registered"
              description="Register student medical records including allergies and emergency contacts."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {records
                .filter((r) => bloodGroupFilter === 'All' || r.bloodGroup === bloodGroupFilter)
                .filter((rec) => {
                  if (!search.trim()) return true;
                  const q = search.toLowerCase();
                  const name = rec.studentId ? `${rec.studentId.firstName} ${rec.studentId.lastName}` : '';
                  const sid = rec.studentId?.studentId || '';
                  return (
                    name.toLowerCase().includes(q) ||
                    sid.toLowerCase().includes(q) ||
                    rec.bloodGroup?.toLowerCase().includes(q) ||
                    rec.allergies?.some((a) => a.allergen?.toLowerCase().includes(q))
                  );
                })
                .map((rec) => {
                  const student = rec.studentId;
                  const hasSevereAllergy = rec.allergies?.some(
                    (a) => a.severity === 'Severe' || a.severity === 'Critical'
                  );

                  return (
                    <div
                      key={rec._id}
                      className={`p-4 rounded-2xl border ${
                        hasSevereAllergy
                          ? 'border-rose-300 bg-rose-50/30'
                          : 'border-slate-200/80 bg-white shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900">
                            {student?.firstName} {student?.lastName}
                          </h4>
                          <p className="text-xs text-slate-400 font-mono">{student?.admissionNumber}</p>
                        </div>
                        <Badge variant="primary">{rec.bloodGroup}</Badge>
                      </div>

                      {/* Allergy Badges */}
                      <div className="mt-3">
                        <p className="text-[11px] uppercase font-bold text-slate-400">Allergies</p>
                        {rec.allergies?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {rec.allergies.map((a, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                                  a.severity === 'Critical' || a.severity === 'Severe'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                <AlertTriangle className="w-3 h-3" />
                                {a.allergen} ({a.severity})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium">None reported</span>
                        )}
                      </div>

                      {/* Physical & Chronic Details */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                        <div>Height: {rec.heightCm ? `${rec.heightCm} cm` : 'N/A'}</div>
                        <div>Weight: {rec.weightKg ? `${rec.weightKg} kg` : 'N/A'}</div>
                        <div className="col-span-2">
                          Conditions: {rec.chronicConditions?.join(', ') || 'None'}
                        </div>
                      </div>

                      {/* Emergency contact info */}
                      {student?.emergencyContact && (
                        <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
                          <span>
                            Contact: {student.emergencyContact.name} ({student.emergencyContact.relationship})
                          </span>
                          <span className="font-semibold text-slate-700">{student.emergencyContact.phone}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: MEDICINE INVENTORY */}
      {activeTab === 'inventory' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900">Dispensary Stock & First Aid Supplies</h3>
            <Button variant="primary" size="sm" onClick={() => setIsMedicineModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Medicine
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Medicine / Item</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Available Qty</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => {
                  const isLow = item.quantityAvailable <= item.lowStockThreshold;
                  return (
                    <tr key={item._id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="px-4 py-3">{item.category}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {item.quantityAvailable} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{item.location}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {isLow ? (
                          <Badge variant="danger">Low Stock (≤{item.lowStockThreshold})</Badge>
                        ) : (
                          <Badge variant="success">In Stock</Badge>
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

      {/* MODAL: LOG CLINIC VISIT */}
      <Modal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        title="Log Infirmary Clinic Visit"
      >
        <form onSubmit={handleCreateVisit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Patron Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="patronType"
                  value="Student"
                  checked={visitForm.patronType === 'Student'}
                  onChange={(e) => setVisitForm({ ...visitForm, patronType: e.target.value })}
                />
                Student
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="patronType"
                  value="Staff"
                  checked={visitForm.patronType === 'Staff'}
                  onChange={(e) => setVisitForm({ ...visitForm, patronType: e.target.value })}
                />
                Staff
              </label>
            </div>
          </div>

          {visitForm.patronType === 'Student' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Student *</label>
              <select
                required
                value={visitForm.studentId}
                onChange={(e) => setVisitForm({ ...visitForm, studentId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName} ({s.admissionNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Symptoms *</label>
            <input
              type="text"
              required
              placeholder="e.g. High fever, stomach ache, scraped knee"
              value={visitForm.symptoms}
              onChange={(e) => setVisitForm({ ...visitForm, symptoms: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Treatment Given *</label>
            <textarea
              required
              rows={2}
              placeholder="Treatment details and first aid administered"
              value={visitForm.treatmentGiven}
              onChange={(e) => setVisitForm({ ...visitForm, treatmentGiven: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Administer Medicine</label>
              <input
                type="text"
                placeholder="e.g. Paracetamol"
                value={visitForm.medicineName}
                onChange={(e) => setVisitForm({ ...visitForm, medicineName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Qty Dispensed</label>
              <input
                type="number"
                min={1}
                value={visitForm.medicineQty}
                onChange={(e) => setVisitForm({ ...visitForm, medicineQty: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 37.8"
                value={visitForm.temperatureCelsius}
                onChange={(e) => setVisitForm({ ...visitForm, temperatureCelsius: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={visitForm.status}
                onChange={(e) => setVisitForm({ ...visitForm, status: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                <option value="Discharged">Discharged</option>
                <option value="Under Observation">Under Observation</option>
                <option value="Referred Out">Referred Out</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={visitForm.parentNotified}
                onChange={(e) => setVisitForm({ ...visitForm, parentNotified: e.target.checked })}
              />
              Parent Notified
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={visitForm.referredToHospital}
                onChange={(e) => setVisitForm({ ...visitForm, referredToHospital: e.target.checked })}
              />
              Referred to Hospital
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsVisitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              Save Visit Log
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: HEALTH PROFILE REGISTRATION */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Student Health Profile & Allergy Registry"
      >
        <form onSubmit={handleCreateRecord} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Student *</label>
            <select
              required
              value={recordForm.studentId}
              onChange={(e) => setRecordForm({ ...recordForm, studentId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            >
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.firstName} {s.lastName} ({s.admissionNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Blood Group</label>
              <select
                value={recordForm.bloodGroup}
                onChange={(e) => setRecordForm({ ...recordForm, bloodGroup: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Height (cm)</label>
              <input
                type="number"
                value={recordForm.heightCm}
                onChange={(e) => setRecordForm({ ...recordForm, heightCm: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Weight (kg)</label>
              <input
                type="number"
                value={recordForm.weightKg}
                onChange={(e) => setRecordForm({ ...recordForm, weightKg: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-bold text-rose-600 uppercase mb-2">Allergy Alert Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Allergen</label>
                <input
                  type="text"
                  placeholder="e.g. Peanuts, Penicillin, Dust"
                  value={recordForm.allergen}
                  onChange={(e) => setRecordForm({ ...recordForm, allergen: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Severity</label>
                <select
                  value={recordForm.allergySeverity}
                  onChange={(e) => setRecordForm({ ...recordForm, allergySeverity: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                >
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Chronic Conditions (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Asthma, Type 1 Diabetes"
              value={recordForm.chronicConditions}
              onChange={(e) => setRecordForm({ ...recordForm, chronicConditions: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              Save Health Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD MEDICINE */}
      <Modal
        isOpen={isMedicineModalOpen}
        onClose={() => setIsMedicineModalOpen(false)}
        title="Add Medicine or Supply"
      >
        <form onSubmit={handleCreateMedicine} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Medicine Name *</label>
            <input
              type="text"
              required
              value={medicineForm.name}
              onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={medicineForm.category}
                onChange={(e) => setMedicineForm({ ...medicineForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {['Analgesic', 'Antiseptic', 'Antibiotic', 'Bandage/Dressings', 'Ointment', 'Equipment', 'Other'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Initial Qty *</label>
              <input
                type="number"
                required
                min={0}
                value={medicineForm.quantityAvailable}
                onChange={(e) => setMedicineForm({ ...medicineForm, quantityAvailable: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={medicineForm.expiryDate}
                onChange={(e) => setMedicineForm({ ...medicineForm, expiryDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Low Stock Threshold</label>
              <input
                type="number"
                min={1}
                value={medicineForm.lowStockThreshold}
                onChange={(e) => setMedicineForm({ ...medicineForm, lowStockThreshold: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsMedicineModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              Add Item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MedicalPage;
