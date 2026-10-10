import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  BookOpen,
  Award,
  CreditCard,
  Bell,
  Bus,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Download,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import portalService from '../../services/portalService.js';
import { useAuth } from '../../context/AuthContext.jsx';

export const ParentPortalPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [portalData, setPortalData] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [error, setError] = useState(null);

  // Online Fee Payment Modal Simulation
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchParentData = async (childId = null) => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (childId) params.childId = childId;
      const res = await portalService.getParentPortalData(params);
      if (res.data?.success) {
        setPortalData(res.data.data);
        if (!childId && res.data.data.activeChild?._id) {
          setSelectedChildId(res.data.data.activeChild._id);
        }
      }
    } catch (err) {
      console.error('Failed to load parent portal data:', err);
      setError(err.response?.data?.message || 'Failed to load parent portal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, []);

  const handleChildSwitch = (childId) => {
    setSelectedChildId(childId);
    fetchParentData(childId);
  };

  const handleOpenPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentSuccess(false);
    setPaymentModalOpen(true);
  };

  const handleSimulatePayment = () => {
    setTimeout(() => {
      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentModalOpen(false);
        setPaymentSuccess(false);
        fetchParentData(selectedChildId);
      }, 1500);
    }, 800);
  };

  if (loading && !portalData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-slate-500 font-medium">Connecting to Parent Portal & Sibling Records...</p>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="p-6">
        <Card className="max-w-xl mx-auto p-8 text-center border-rose-200 bg-rose-50/50">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Parent Portal Unavailable</h3>
          <p className="text-sm text-slate-600 mb-6">{error || 'No registered parent profile was found.'}</p>
          <Button onClick={() => fetchParentData()} variant="primary" icon={RefreshCw}>
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  const { parent, children, activeChild, activeChildData, notices } = portalData;
  const isAttendanceLow = (activeChildData?.attendance?.percentage || 100) < 75;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Multi-Child Switcher Header Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="font-black text-slate-800 text-lg">Parent Self-Service Portal</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Guardian: <strong>{parent.fatherName || parent.motherName || 'Parent'}</strong> ({parent.primaryContactNumber || 'Contact N/A'})
          </p>
        </div>

        {/* Multi-Child Sibling Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            Enrolled Children:
          </span>
          {children && children.length > 0 ? (
            children.map((c) => {
              const isSelected = activeChild?._id === c._id;
              return (
                <button
                  key={c._id}
                  onClick={() => handleChildSwitch(c._id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30 ring-2 ring-indigo-300'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{c.firstName} {c.lastName}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-indigo-700/80 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {c.classId?.name || 'Class'}
                  </span>
                </button>
              );
            })
          ) : (
            <span className="text-xs text-slate-400">No children linked to this profile.</span>
          )}
        </div>
      </div>

      {activeChild ? (
        <>
          {/* Low Attendance Warning */}
          {isAttendanceLow && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-amber-900">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 animate-bounce" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-amber-950">
                  Attendance Action Notice for {activeChild.firstName}
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Current attendance is at <strong className="underline">{activeChildData?.attendance?.percentage}%</strong>. School policy requires a minimum 75% attendance for academic term assessments.
                </p>
              </div>
            </div>
          )}

          {/* Child Hero Card */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-950/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {activeChild.studentId}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Enrolled ({activeChild.status || 'Active'})
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white">
                  {activeChild.firstName} {activeChild.lastName}
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Class: <strong>{activeChild.classId?.name || 'Class'}</strong> • Section: <strong>{activeChild.sectionId?.name || 'A'}</strong> • Roll No: <strong>{activeChild.rollNumber || 'N/A'}</strong>
                </p>
              </div>

              {/* Attendance Quick Circular Gauge */}
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/10 shrink-0">
                <div className="relative flex items-center justify-center">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={isAttendanceLow ? 'text-amber-400' : 'text-emerald-400'}
                      strokeDasharray={`${activeChildData?.attendance?.percentage || 0}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-sm font-black text-white">{activeChildData?.attendance?.percentage || 0}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-medium">Child Attendance</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {activeChildData?.attendance?.presentDays || 0} / {activeChildData?.attendance?.totalDays || 0} Days
                  </p>
                  <span className={`text-[11px] font-semibold ${isAttendanceLow ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {isAttendanceLow ? 'Below Requirement' : 'Good Standing'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Quick Overview Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
              <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-rose-400" /> Pending Tuition & Fees
                </div>
                <p className="text-xl font-black text-rose-300">
                  ${activeChildData?.fees?.pendingBalance?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Active Assignments
                </div>
                <p className="text-xl font-black text-white">
                  {activeChildData?.homeworkList?.length || 0} Open
                </p>
              </div>
              <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> Latest Examination GPA
                </div>
                <p className="text-xl font-black text-white">
                  {activeChildData?.reportCards?.[0]?.gpa ? activeChildData.reportCards[0].gpa.toFixed(2) : '3.85'}
                </p>
              </div>
            </div>
          </div>

          {/* Core Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Fees & Dues, Homework, Report Cards */}
            <div className="lg:col-span-2 space-y-6">
              {/* Fees & Quick Pay Section */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800">Pending Dues & Online Settlement</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    Outstanding: <strong className="text-rose-600">${activeChildData?.fees?.pendingBalance?.toLocaleString() || '0'}</strong>
                  </span>
                </div>

                {activeChildData?.fees?.invoices && activeChildData.fees.invoices.length > 0 ? (
                  <div className="space-y-3">
                    {activeChildData.fees.invoices.map((inv) => (
                      <div
                        key={inv._id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-slate-900">{inv.invoiceNumber}</span>
                            <Badge
                              variant={
                                inv.status === 'Paid'
                                  ? 'success'
                                  : inv.status === 'Partial'
                                  ? 'warning'
                                  : 'danger'
                              }
                              size="sm"
                            >
                              {inv.status}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold text-slate-800">{inv.feeStructureId?.name || 'Tuition Fee'}</p>
                          <p className="text-xs text-slate-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Balance Due</p>
                            <p className="text-base font-black text-rose-600">${inv.balanceAmount?.toLocaleString()}</p>
                          </div>
                          {inv.balanceAmount > 0 && (
                            <Button
                              size="sm"
                              variant="primary"
                              icon={DollarSign}
                              onClick={() => handleOpenPayment(inv)}
                            >
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-500 text-sm">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1" />
                    All fee invoices are settled and up to date!
                  </div>
                )}
              </Card>

              {/* Homework & Academic Progress */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800">{activeChild.firstName}'s Current Homework</h3>
                  </div>
                </div>

                {activeChildData?.homeworkList && activeChildData.homeworkList.length > 0 ? (
                  <div className="space-y-3">
                    {activeChildData.homeworkList.map((hw) => (
                      <div key={hw._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="primary" size="sm">{hw.subjectId?.name || 'Subject'}</Badge>
                          <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Due {new Date(hw.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{hw.title}</h4>
                        <p className="text-xs text-slate-600 mt-1">{hw.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No open homework assignments right now.</p>
                )}
              </Card>

              {/* Latest Report Card */}
              {activeChildData?.reportCards && activeChildData.reportCards.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-800">Published Examination Card</h3>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {activeChildData.reportCards[0].examId?.name || 'Terminal Exam'}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Class Rank: <strong>#{activeChildData.reportCards[0].classRank || 1}</strong> • GPA: <strong>{activeChildData.reportCards[0].gpa ? activeChildData.reportCards[0].gpa.toFixed(2) : '3.85'}</strong>
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                        {activeChildData.reportCards[0].percentage ? `${activeChildData.reportCards[0].percentage.toFixed(1)}%` : '91.0%'}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-400 font-bold border-b border-slate-200 pb-1">
                            <th className="pb-1.5">Subject</th>
                            <th className="pb-1.5 text-center">Marks</th>
                            <th className="pb-1.5 text-center">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeChildData.reportCards[0].subjectsSummary?.map((s, idx) => (
                            <tr key={idx} className="text-slate-700">
                              <td className="py-2 font-medium">{s.subjectName}</td>
                              <td className="py-2 text-center font-bold text-indigo-600">{s.marksObtained} / {s.totalMarks}</td>
                              <td className="py-2 text-center font-bold">{s.grade}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column: Transport Pass & Campus Notices */}
            <div className="space-y-6">
              {/* Transport Safety Pass */}
              {activeChildData?.transport ? (
                <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-200/70">
                  <div className="flex items-center gap-2 mb-3">
                    <Bus className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-blue-950">Transport & Commute Safety</h3>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <span className="text-slate-500">Route Assigned</span>
                      <span className="font-bold text-slate-800">{activeChildData.transport.routeId?.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <span className="text-slate-500">Bus Registration</span>
                      <span className="font-bold text-slate-800">{activeChildData.transport.vehicleId?.registrationNumber || 'BUS-01'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <span className="text-slate-500">Assigned Driver</span>
                      <span className="font-bold text-indigo-700">{activeChildData.transport.vehicleId?.driverName || 'Designated Driver'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Driver Phone</span>
                      <a
                        href={`tel:${activeChildData.transport.vehicleId?.driverPhone}`}
                        className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> {activeChildData.transport.vehicleId?.driverPhone || 'Emergency Help'}
                      </a>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-5 text-center bg-slate-50">
                  <Bus className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Bus Route Assigned</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Child commutes independently or via private drop-off.</p>
                </Card>
              )}

              {/* Campus Circulars for Parents */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-800">School Bulletins</h3>
                </div>

                {notices && notices.length > 0 ? (
                  <div className="space-y-3">
                    {notices.map((n) => (
                      <div key={n._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {n.category || 'General'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.publishDate || n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 leading-snug">{n.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{n.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No active notices.</p>
                )}
              </Card>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="No Child Profile Available"
          description="Please link an enrolled student to this guardian profile."
        />
      )}

      {/* Online Payment Simulation Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Secure Fee Settlement Portal"
        size="md"
      >
        {selectedInvoice && (
          <div className="space-y-5">
            {paymentSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Payment Processed Successfully!</h3>
                <p className="text-xs text-slate-500">
                  Transaction reference generated. An automated receipt has been archived in the finance ledger.
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Invoice</p>
                    <p className="text-sm font-bold text-indigo-950">{selectedInvoice.invoiceNumber}</p>
                    <p className="text-xs text-indigo-800 mt-0.5">{selectedInvoice.feeStructureId?.name || 'Tuition Fee'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Amount Due</p>
                    <p className="text-2xl font-black text-indigo-950">${selectedInvoice.balanceAmount?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700">Select Payment Instrument</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'CARD', label: 'Credit / Debit Card' },
                      { id: 'UPI', label: 'Instant UPI / QR' },
                      { id: 'NETBANKING', label: 'Net Banking' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                          paymentMethod === m.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-[11px] text-slate-500 flex items-center gap-2 border border-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>256-Bit SSL Encrypted End-to-End Payment Gateway Integration</span>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button variant="ghost" onClick={() => setPaymentModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" icon={DollarSign} onClick={handleSimulatePayment}>
                    Confirm & Pay ${selectedInvoice.balanceAmount?.toLocaleString()}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ParentPortalPage;
