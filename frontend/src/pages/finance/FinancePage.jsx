import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DollarSign,
  CreditCard,
  FileText,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
  Printer,
  Download,
  Building2,
  TrendingUp,
  TrendingDown,
  Layers,
  UserCheck,
  Receipt as ReceiptIcon,
  Clock,
  PieChart,
  Tag,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  X,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import financeService from '../../services/financeService.js';
import adminService from '../../services/adminService.js';
import studentService from '../../services/studentService.js';
import printElement from '../../utils/printUtils.js';

export const FinancePage = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);

  // 1. OVERVIEW DATA
  const [overview, setOverview] = useState(null);

  // 2. INVOICES DATA & FILTERS
  const [invoices, setInvoices] = useState([]);
  const [invoiceSearch, setInvoiceSearch] = useState(searchParams.get('search') || '');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('');
  const [invoiceClassFilter, setInvoiceClassFilter] = useState('');

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== invoiceSearch) {
      setInvoiceSearch(q);
    }
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 3. FEE STRUCTURES DATA
  const [feeStructures, setFeeStructures] = useState([]);

  // 4. PAYMENTS & RECEIPTS DATA
  const [payments, setPayments] = useState([]);

  // 5. DEFAULTERS DATA
  const [defaulters, setDefaulters] = useState([]);

  // 6. EXPENSES DATA
  const [expenses, setExpenses] = useState([]);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');

  // ==========================================
  // MODAL STATES
  // ==========================================
  // Collect Payment Modal
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'Cash',
    transactionReference: '',
    remarks: '',
  });

  // Printable Receipt Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Printable Invoice / Demand Bill Modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);

  // Fee Structure Creation Modal
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [structureForm, setStructureForm] = useState({
    name: '',
    classId: '',
    dueDate: '',
    lateFinePerDay: 5,
    components: [
      { name: 'Tuition Fee', amount: 400, frequency: 'Monthly', isOptional: false },
      { name: 'Computer / Lab Fee', amount: 100, frequency: 'Monthly', isOptional: false },
      { name: 'Library & Sports', amount: 50, frequency: 'Monthly', isOptional: false },
    ],
  });

  // Bulk Invoice Generation Modal
  const [isGenerateInvoiceModalOpen, setIsGenerateInvoiceModalOpen] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [classStudents, setClassStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [generateInvoiceForm, setGenerateInvoiceForm] = useState({
    feeStructureId: '',
    classId: '',
    targetScope: 'class',
    studentId: '',
    dueDateOverride: '',
  });

  // Apply Discount Modal
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [selectedInvoiceForDiscount, setSelectedInvoiceForDiscount] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    discountAmount: '',
    discountReason: 'Sibling Discount (10%)',
    isWaiver: false,
  });

  // Log Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Supplies',
    amount: '',
    paymentMethod: 'Bank Transfer',
    vendorName: '',
    vendorInvoiceNumber: '',
    remarks: '',
  });

  // Status message banners
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  const showBanner = (type, text) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage({ type: '', text: '' }), 4000);
  };

  // ==========================================
  // DATA FETCHING
  // ==========================================

  const loadClasses = async () => {
    try {
      const res = await adminService.getClasses();
      if (res.data?.data) {
        setClasses(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await financeService.getFinancialOverview();
      if (res.data?.data) {
        setOverview(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load financial overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (invoiceSearch) params.search = invoiceSearch;
      if (invoiceStatusFilter) params.status = invoiceStatusFilter;
      if (invoiceClassFilter) params.classId = invoiceClassFilter;

      const res = await financeService.getStudentFees(params);
      if (res.data?.data) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load student invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFeeStructures = async () => {
    try {
      setLoading(true);
      const res = await financeService.getFeeStructures();
      if (res.data?.data) {
        setFeeStructures(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load fee structures:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await financeService.getPayments();
      if (res.data?.data) {
        setPayments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDefaulters = async () => {
    try {
      setLoading(true);
      const res = await financeService.getDefaulters();
      if (res.data?.data) {
        setDefaulters(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load defaulters:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (expenseCategoryFilter) params.category = expenseCategoryFilter;
      const res = await financeService.getExpenses(params);
      if (res.data?.data) {
        setExpenses(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
    loadFeeStructures();
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') loadOverview();
    if (activeTab === 'invoices') {
      const timer = setTimeout(() => {
        loadInvoices();
      }, 250);
      return () => clearTimeout(timer);
    }
    if (activeTab === 'structures') loadFeeStructures();
    if (activeTab === 'payments') loadPayments();
    if (activeTab === 'defaulters') loadDefaulters();
    if (activeTab === 'expenses') loadExpenses();
  }, [activeTab, invoiceStatusFilter, invoiceClassFilter, invoiceSearch, expenseCategoryFilter]);

  // ==========================================
  // HANDLERS
  // ==========================================

  // 1. Fee Structure Handlers
  const handleAddComponent = () => {
    setStructureForm({
      ...structureForm,
      components: [
        ...structureForm.components,
        { name: '', amount: '', frequency: 'Monthly', isOptional: false },
      ],
    });
  };

  const handleComponentChange = (index, field, value) => {
    const updated = [...structureForm.components];
    updated[index][field] = field === 'amount' ? Number(value) || 0 : value;
    setStructureForm({ ...structureForm, components: updated });
  };

  const handleRemoveComponent = (index) => {
    const updated = structureForm.components.filter((_, i) => i !== index);
    setStructureForm({ ...structureForm, components: updated });
  };

  const handleCreateFeeStructure = async (e) => {
    e.preventDefault();
    try {
      if (!structureForm.name || !structureForm.classId) {
        showBanner('error', 'Please provide a name and select a class.');
        return;
      }

      await financeService.createFeeStructure(structureForm);
      showBanner('success', 'Fee structure template created successfully.');
      setIsStructureModalOpen(false);
      loadFeeStructures();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to create fee structure.');
    }
  };

  // 2. Invoice Generation Handlers
  const loadStudentsForClass = async (classId) => {
    if (!classId) {
      setClassStudents([]);
      return;
    }
    try {
      setLoadingStudents(true);
      const res = await studentService.getStudents({ classId, status: 'Active', limit: 200 });
      const list = res.data?.data?.students || (Array.isArray(res.data?.data) ? res.data?.data : []);
      setClassStudents(list);
    } catch (err) {
      console.error('Failed to load students for class:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenGenerateInvoiceModal = (preset = {}) => {
    loadFeeStructures();
    const structId = preset.feeStructureId || (feeStructures.length > 0 ? feeStructures[0]._id : '');
    const foundStruct = feeStructures.find((s) => s._id === structId);
    const clsId =
      preset.classId ||
      foundStruct?.classId?._id ||
      (typeof foundStruct?.classId === 'string' ? foundStruct.classId : '');

    setGenerateInvoiceForm({
      feeStructureId: structId,
      classId: clsId,
      targetScope: 'class',
      studentId: '',
      dueDateOverride: '',
    });

    if (clsId) {
      loadStudentsForClass(clsId);
    }

    setIsGenerateInvoiceModalOpen(true);
  };

  const handleSelectStructureForInvoice = (structId) => {
    const struct = feeStructures.find((s) => s._id === structId);
    const clsId =
      struct?.classId?._id ||
      (typeof struct?.classId === 'string' ? struct.classId : '');

    setGenerateInvoiceForm((prev) => ({
      ...prev,
      feeStructureId: structId,
      classId: clsId,
      studentId: '',
    }));

    if (clsId) {
      loadStudentsForClass(clsId);
    }
  };

  const handleGenerateInvoices = async (e) => {
    e.preventDefault();
    try {
      if (!generateInvoiceForm.feeStructureId) {
        showBanner('error', 'Please select a fee structure.');
        return;
      }
      if (generateInvoiceForm.targetScope === 'student' && !generateInvoiceForm.studentId) {
        showBanner('error', 'Please select a student to generate invoice for.');
        return;
      }

      setIsGeneratingInvoice(true);
      const payload = {
        feeStructureId: generateInvoiceForm.feeStructureId,
        classId: generateInvoiceForm.classId || undefined,
        dueDateOverride: generateInvoiceForm.dueDateOverride || undefined,
      };

      if (generateInvoiceForm.targetScope === 'student' && generateInvoiceForm.studentId) {
        payload.studentId = generateInvoiceForm.studentId;
      }

      const res = await financeService.generateInvoices(payload);
      showBanner('success', res.data?.message || 'Invoices generated successfully.');
      setIsGenerateInvoiceModalOpen(false);
      setActiveTab('invoices');
      loadInvoices();
      if (activeTab === 'overview') loadOverview();
      if (activeTab === 'defaulters') loadDefaulters();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to generate invoices.');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  // 3. Discount Handlers
  const handleOpenDiscountModal = (inv) => {
    setSelectedInvoiceForDiscount(inv);
    setDiscountForm({
      discountAmount: inv.discountAmount || '',
      discountReason: inv.discountReason || 'Sibling Discount',
      isWaiver: inv.status === 'Waived',
    });
    setIsDiscountModalOpen(true);
  };

  const handleApplyDiscount = async (e) => {
    e.preventDefault();
    try {
      await financeService.applyDiscountOrWaiver(selectedInvoiceForDiscount._id, discountForm);
      showBanner('success', 'Discount / Waiver applied successfully.');
      setIsDiscountModalOpen(false);
      loadInvoices();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to apply discount.');
    }
  };

  // 4. Payment Collection Handlers
  const handleOpenCollectModal = (inv) => {
    setSelectedInvoiceForPayment(inv);
    setPaymentForm({
      amount: inv.balanceAmount,
      paymentMethod: 'Cash',
      transactionReference: '',
      remarks: '',
    });
    setIsCollectModalOpen(true);
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        studentFeeId: selectedInvoiceForPayment._id,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        transactionReference: paymentForm.transactionReference,
        remarks: paymentForm.remarks,
      };

      const res = await financeService.collectPayment(payload);
      showBanner('success', 'Payment recorded and official receipt generated!');
      setIsCollectModalOpen(false);

      if (res.data?.data?.receipt) {
        setActiveReceipt(res.data.data.receipt);
        setIsReceiptModalOpen(true);
      }

      if (activeTab === 'invoices') loadInvoices();
      if (activeTab === 'overview') loadOverview();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to collect payment.');
    }
  };

  // 5. Printable Invoice & Receipt Handlers
  const handleViewInvoice = async (invoice) => {
    try {
      const res = await financeService.getStudentFeeById(invoice._id);
      if (res.data?.data) {
        setActiveInvoice(res.data.data);
      } else {
        setActiveInvoice(invoice);
      }
      setIsInvoiceModalOpen(true);
    } catch (err) {
      console.error('Failed to load invoice details:', err);
      setActiveInvoice(invoice);
      setIsInvoiceModalOpen(true);
    }
  };

  const handleViewReceipt = async (payment) => {
    try {
      const res = await financeService.getReceiptById(payment._id);
      if (res.data?.data) {
        setActiveReceipt(res.data.data);
        setIsReceiptModalOpen(true);
      }
    } catch (err) {
      showBanner('error', 'Failed to retrieve receipt details.');
    }
  };

  // 6. Expense Handlers
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await financeService.createExpense(expenseForm);
      showBanner('success', 'Expense recorded successfully.');
      setIsExpenseModalOpen(false);
      setExpenseForm({
        title: '',
        category: 'Supplies',
        amount: '',
        paymentMethod: 'Bank Transfer',
        vendorName: '',
        vendorInvoiceNumber: '',
        remarks: '',
      });
      loadExpenses();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to log expense.');
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Partially Paid':
        return 'warning';
      case 'Unpaid':
        return 'secondary';
      case 'Overdue':
        return 'danger';
      case 'Waived':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Message */}
      {actionMessage.text && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm font-medium transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage({ type: '', text: '' })}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Accounts & Financial Ledgers
            </h1>
            <Badge variant="primary">Phase 7</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Centralized fee structures, student billing, partial collections, receipts, and school expenditures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => setIsStructureModalOpen(true)}
            icon={<Layers className="w-4 h-4" />}
          >
            + Fee Structure
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleOpenGenerateInvoiceModal()}
            icon={<FileText className="w-4 h-4" />}
          >
            Generate Invoices
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setActiveTab('invoices');
              showBanner('info', 'Select an invoice below to record payment.');
            }}
            icon={<CreditCard className="w-4 h-4" />}
          >
            Collect Fee
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Financial Overview', icon: PieChart },
          { id: 'invoices', label: 'Student Invoices', icon: FileText },
          { id: 'structures', label: 'Fee Structures', icon: Layers },
          { id: 'payments', label: 'Payment History', icon: CreditCard },
          { id: 'defaulters', label: 'Overdue & Defaulters', icon: AlertTriangle },
          { id: 'expenses', label: 'Institutional Expenses', icon: TrendingDown },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Loading Overlay */}
      {loading && (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Synchronizing financial data..." />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. FINANCIAL OVERVIEW TAB */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-5 border-l-4 border-l-blue-500">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Billed
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ${overview.summary.totalInvoiced?.toLocaleString() || '0'}
              </p>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>{overview.summary.totalInvoicesCount} Active Invoices</span>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-emerald-500">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Collected Revenue
              </span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                ${overview.summary.totalCollected?.toLocaleString() || '0'}
              </p>
              <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Cleared & Settled</span>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-amber-500">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Outstanding Balance
              </span>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                ${overview.summary.totalOutstanding?.toLocaleString() || '0'}
              </p>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Pending collections</span>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-rose-500">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Expenses
              </span>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                ${overview.summary.totalExpenses?.toLocaleString() || '0'}
              </p>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                <span>Institutional Outlays</span>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-indigo-500 bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Net Operating Balance
              </span>
              <p
                className={`text-2xl font-bold mt-1 ${
                  overview.summary.netCashflow >= 0 ? 'text-indigo-600' : 'text-rose-600'
                }`}
              >
                ${overview.summary.netCashflow?.toLocaleString() || '0'}
              </p>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                <span>Collected - Expenses</span>
              </div>
            </Card>
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice State Breakdown */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Invoice Status Distribution
                </h3>
              </div>
              <div className="space-y-3">
                {overview.statusBreakdown && overview.statusBreakdown.length > 0 ? (
                  overview.statusBreakdown.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusBadgeVariant(item._id)}>{item._id}</Badge>
                        <span className="text-sm font-semibold text-slate-700">
                          {item.count} invoices
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">
                          ${item.amount?.toLocaleString()}
                        </div>
                        {item.balance > 0 && (
                          <div className="text-xs text-rose-500 font-medium">
                            ${item.balance?.toLocaleString()} balance
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No invoices generated yet.</p>
                )}
              </div>
            </Card>

            {/* Payment Modes */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Collections by Payment Mode
                </h3>
              </div>
              <div className="space-y-3">
                {overview.paymentMethods && overview.paymentMethods.length > 0 ? (
                  overview.paymentMethods.map((pm) => (
                    <div
                      key={pm._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-sm font-medium text-slate-700">{pm._id}</span>
                        <span className="text-xs text-slate-400">({pm.count} txns)</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-700">
                        ${pm.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No payments collected yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STUDENT INVOICES TAB */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search student, invoice #, admission..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadInvoices()}
                  className="w-full pl-9 pr-9 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
                {invoiceSearch && (
                  <button
                    onClick={() => setInvoiceSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select
                  value={invoiceClassFilter}
                  onChange={(e) => setInvoiceClassFilter(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>

                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Waived">Waived</option>
                </select>

                <Button variant="secondary" onClick={loadInvoices} icon={<Filter className="w-3.5 h-3.5" />}>
                  Filter
                </Button>
              </div>
            </div>
          </Card>

          {/* Invoices Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Student & Class</th>
                    <th className="py-3.5 px-4">Fee Structure</th>
                    <th className="py-3.5 px-4 text-right">Net Payable</th>
                    <th className="py-3.5 px-4 text-right">Paid</th>
                    <th className="py-3.5 px-4 text-right">Balance</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Due Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length > 0 ? (
                    invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleViewInvoice(inv)}
                            className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1.5 text-left group"
                            title="Click to view & print official invoice bill"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                            {inv.invoiceNumber}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {inv.studentId?.firstName} {inv.studentId?.lastName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {inv.studentId?.admissionNumber} • {inv.studentId?.classId?.name || inv.studentId?.currentClass?.name || 'Class'}{' '}
                            {inv.studentId?.sectionId?.name || inv.studentId?.currentSection?.name || ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {inv.feeStructureId?.name || 'General Structure'}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          ${inv.netPayable}
                          {inv.discountAmount > 0 && (
                            <span className="block text-xs text-emerald-600 font-normal">
                              -${inv.discountAmount} discount
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-600">
                          ${inv.paidAmount}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600">
                          ${inv.balanceAmount}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={getStatusBadgeVariant(inv.status)}>{inv.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-slate-500">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewInvoice(inv)}
                              title="View & Print Invoice Bill"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                            </Button>
                            {inv.balanceAmount > 0 && inv.status !== 'Waived' && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleOpenCollectModal(inv)}
                              >
                                Pay
                              </Button>
                            )}
                            {inv.status !== 'Paid' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenDiscountModal(inv)}
                                title="Apply discount / waiver"
                              >
                                <Tag className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <p className="text-sm">No student fee invoices match your filters.</p>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenGenerateInvoiceModal()}
                            icon={<FileText className="w-3.5 h-3.5" />}
                          >
                            Generate Invoices
                          </Button>
                        </div>
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
      {/* 3. FEE STRUCTURES TAB */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'structures' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Class Fee Structure Master</h3>
            <Button
              variant="primary"
              onClick={() => setIsStructureModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Fee Structure
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {feeStructures.length > 0 ? (
              feeStructures.map((struct) => (
                <Card key={struct._id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant="primary">{struct.classId?.name || 'Class'}</Badge>
                      <span className="text-xs text-slate-400">
                        Late fine: ${struct.lateFinePerDay}/day
                      </span>
                    </div>

                    <h4 className="font-bold text-lg text-slate-900 mt-2">{struct.name}</h4>

                    {/* Breakdown of components */}
                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                      {struct.components?.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-xs text-slate-600">
                          <span>{c.name}</span>
                          <span className="font-semibold text-slate-800">${c.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Total Term Fee</span>
                      <div className="text-xl font-black text-indigo-600">${struct.totalAmount}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        handleOpenGenerateInvoiceModal({
                          feeStructureId: struct._id,
                          classId: struct.classId?._id || (typeof struct.classId === 'string' ? struct.classId : ''),
                        });
                      }}
                      icon={<FileText className="w-3.5 h-3.5" />}
                    >
                      Bill Class
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-3">
                <EmptyState
                  title="No Fee Structures Defined"
                  description="Create your first fee structure to define tuition, labs, and activity fees per grade."
                  actionLabel="+ Create Fee Structure"
                  onAction={() => setIsStructureModalOpen(true)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PAYMENT HISTORY TAB */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'payments' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Receipt / Payment #</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Invoice Ref</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4 text-right">Amount Paid</th>
                  <th className="py-3.5 px-4 text-center">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length > 0 ? (
                  payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-600">
                        {p.paymentNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {p.studentId?.firstName} {p.studentId?.lastName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {p.studentId?.admissionNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {p.studentFeeId?.invoiceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 text-base">
                        ${p.amount}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-slate-500">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleViewReceipt(p)}
                          icon={<Printer className="w-3.5 h-3.5" />}
                        >
                          Print Receipt
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No payment transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 5. DEFAULTERS & OVERDUE TAB */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'defaulters' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-800 text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="font-semibold">Automated Defaulters Detection:</strong> Students listed below have unpaid dues past their statutory invoice due date. Accrued late fines are computed dynamically based on the class fee template.
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Student & Class</th>
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4 text-center">Due Date</th>
                    <th className="py-3.5 px-4 text-center">Days Overdue</th>
                    <th className="py-3.5 px-4 text-right">Unpaid Balance</th>
                    <th className="py-3.5 px-4 text-right">Accrued Fine</th>
                    <th className="py-3.5 px-4 text-right">Total Due</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {defaulters.length > 0 ? (
                    defaulters.map((d) => (
                      <tr key={d._id} className="hover:bg-rose-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {d.student?.firstName} {d.student?.lastName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {d.student?.admissionNumber} • {d.student?.currentClass?.name || 'Class'}{' '}
                            {d.student?.currentSection?.name || ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-indigo-600 text-xs">
                          {d.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-slate-500">
                          {new Date(d.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="danger">{d.daysOverdue} days</Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800">
                          ${d.balanceAmount}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-amber-600">
                          +${d.accruedLateFine}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600 text-base">
                          ${d.totalWithFine}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedInvoiceForPayment({
                                _id: d._id,
                                balanceAmount: d.totalWithFine,
                                invoiceNumber: d.invoiceNumber,
                              });
                              setPaymentForm({
                                amount: d.totalWithFine,
                                paymentMethod: 'Cash',
                                transactionReference: '',
                                remarks: `Defaulter settlement with late fine ($${d.accruedLateFine})`,
                              });
                              setIsCollectModalOpen(true);
                            }}
                          >
                            Collect Dues
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-emerald-600 font-medium">
                        ✓ Outstanding! Zero fee defaulters found across all classes.
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
      {/* 6. INSTITUTIONAL EXPENSES TAB */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="">All Categories</option>
                {[
                  'Utilities',
                  'Maintenance',
                  'Salaries',
                  'Supplies',
                  'Lab Equipment',
                  'Sports',
                  'Transport Fuel',
                  'Events',
                  'IT & Software',
                  'Other',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              onClick={() => setIsExpenseModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Log Expenditure
            </Button>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Title & Vendor</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Date</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.length > 0 ? (
                    expenses.map((exp) => (
                      <tr key={exp._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{exp.title}</div>
                          {exp.vendorName && (
                            <div className="text-xs text-slate-400">
                              Vendor: {exp.vendorName}{' '}
                              {exp.vendorInvoiceNumber && `(#${exp.vendorInvoiceNumber})`}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">{exp.category}</Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs font-medium">
                          {exp.paymentMethod}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600 text-base">
                          ${exp.amount?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-slate-500">
                          {new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={exp.status === 'Approved' ? 'success' : 'secondary'}>
                            {exp.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        No expenses logged for this filter.
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
      {/* MODAL 1: COLLECT PAYMENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        title="Collect Student Fee Payment"
      >
        {selectedInvoiceForPayment && (
          <form onSubmit={handleCollectPayment} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex justify-between items-center">
              <div>
                <span className="font-semibold">Invoice: </span>
                <span className="font-mono">{selectedInvoiceForPayment.invoiceNumber}</span>
              </div>
              <div>
                <span className="font-semibold">Due Balance: </span>
                <span className="font-bold text-indigo-700">
                  ${selectedInvoiceForPayment.balanceAmount}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Payment Amount ($) *
              </label>
              <input
                type="number"
                min="1"
                max={selectedInvoiceForPayment.balanceAmount}
                required
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 font-bold"
              />
              <span className="text-xs text-slate-400 mt-0.5 block">
                Supports partial installment payments up to outstanding balance.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Online Gateway">Online Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Transaction Ref / Cheque #
                </label>
                <input
                  type="text"
                  placeholder="Optional reference"
                  value={paymentForm.transactionReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
              <input
                type="text"
                placeholder="e.g. Paid in full by father"
                value={paymentForm.remarks}
                onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3">
              <Button variant="secondary" onClick={() => setIsCollectModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" icon={<ShieldCheck className="w-4 h-4" />}>
                Confirm & Generate Receipt
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: OFFICIAL PRINTABLE RECEIPT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Fee Receipt"
      >
        {activeReceipt && (
          <div className="space-y-6">
            {/* Printable Receipt Container */}
            <div id="printable-receipt" className="border-2 border-slate-300 rounded-2xl p-6 bg-white space-y-4">
              {/* Institution Letterhead */}
              <div className="text-center border-b-2 border-slate-200 pb-4">
                <div className="inline-flex p-2 rounded-xl bg-indigo-50 text-indigo-700 mb-1 font-bold">
                  <Building2 className="w-5 h-5 mr-1" /> GLOBAL INTERNATIONAL SCHOOL
                </div>
                <p className="text-xs text-slate-500">100 Campus Parkway, Central District • Tel: +1 (555) 019-2831</p>
                <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-widest">
                  OFFICIAL FEE PAYMENT RECEIPT
                </div>
              </div>

              {/* Receipt & Student Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Receipt Number</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {activeReceipt.receiptNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Date of Issue</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(activeReceipt.receiptDate).toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block">Student Name</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {activeReceipt.snapshot?.studentName}
                      </span>
                      <span className="text-slate-500 block">
                        Adm #: {activeReceipt.snapshot?.admissionNumber}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Class & Section</span>
                      <span className="font-bold text-slate-900">
                        {activeReceipt.snapshot?.className} - {activeReceipt.snapshot?.sectionName}
                      </span>
                      <span className="text-slate-500 block">
                        Parent: {activeReceipt.snapshot?.parentName || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Invoice Ref</th>
                      <th className="py-2.5 px-3">Payment Mode</th>
                      <th className="py-2.5 px-3 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 px-3 font-medium text-slate-800">Term School Fee Installment</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{activeReceipt.snapshot?.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">{activeReceipt.paymentMethod}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700 text-sm">
                        ${activeReceipt.amountPaid}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Remaining Balance & Signature */}
              <div className="flex justify-between items-end pt-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Remaining Invoice Balance</span>
                  <span
                    className={`font-bold text-sm ${
                      activeReceipt.snapshot?.balanceRemaining === 0
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  >
                    ${activeReceipt.snapshot?.balanceRemaining}{' '}
                    {activeReceipt.snapshot?.balanceRemaining === 0 ? '(Fully Paid)' : '(Outstanding)'}
                  </span>
                </div>

                <div className="text-right">
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Authorized Accounts Seal
                  </span>
                </div>
              </div>
            </div>

            {/* Print Action Bar */}
            <div className="flex justify-end gap-2.5">
              <Button variant="secondary" onClick={() => setIsReceiptModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => printElement('printable-receipt', 'Official_Fee_Receipt')}
                icon={<Printer className="w-4 h-4" />}
              >
                Print / Save PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2B: OFFICIAL PRINTABLE INVOICE / DEMAND BILL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Student Fee Invoice Details"
      >
        {activeInvoice && (
          <div className="space-y-6">
            {/* Printable Invoice Container */}
            <div id="printable-invoice" className="border-2 border-slate-300 rounded-2xl p-6 bg-white space-y-4">
              {/* Institution Letterhead */}
              <div className="text-center border-b-2 border-slate-200 pb-4">
                <div className="inline-flex p-2 rounded-xl bg-indigo-50 text-indigo-700 mb-1 font-bold">
                  <Building2 className="w-5 h-5 mr-1" /> GLOBAL INTERNATIONAL SCHOOL
                </div>
                <p className="text-xs text-slate-500">100 Campus Parkway, Central District • Tel: +1 (555) 019-2831</p>
                <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-indigo-100 text-xs font-bold text-indigo-800 uppercase tracking-widest">
                  OFFICIAL STUDENT FEE INVOICE / DEMAND BILL
                </div>
              </div>

              {/* Invoice & Student Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Invoice Number</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {activeInvoice.invoiceNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Billing Date</span>
                  <span className="font-semibold text-slate-800">
                    {activeInvoice.createdAt ? new Date(activeInvoice.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 col-span-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Billed Student</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {activeInvoice.studentId?.firstName} {activeInvoice.studentId?.lastName}
                      </span>
                      <span className="text-slate-500 block text-xs">
                        Adm #: {activeInvoice.studentId?.admissionNumber || activeInvoice.studentId?.studentId || 'N/A'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[11px]">Class Placement</span>
                      <span className="font-bold text-slate-900">
                        {activeInvoice.studentId?.classId?.name || 'Class'} {activeInvoice.studentId?.sectionId?.name ? `(${activeInvoice.studentId?.sectionId?.name})` : ''}
                      </span>
                      <span className="text-slate-500 block text-xs">
                        Parent: {activeInvoice.studentId?.parentId?.fatherName || activeInvoice.studentId?.emergencyContact?.name || 'Guardian'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block">Payment Due Date</span>
                  <span className="font-bold text-rose-600">
                    {new Date(activeInvoice.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Invoice Status</span>
                  <Badge variant={getStatusBadgeVariant(activeInvoice.status)}>
                    {activeInvoice.status}
                  </Badge>
                </div>
              </div>

              {/* Fee Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Item / Fee Component</th>
                      <th className="py-2.5 px-3">Frequency</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeInvoice.feeStructureId?.components && activeInvoice.feeStructureId.components.length > 0 ? (
                      activeInvoice.feeStructureId.components.map((comp, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{comp.name}</td>
                          <td className="py-2.5 px-3 text-slate-500">{comp.frequency || 'Monthly'}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-900">${comp.amount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{activeInvoice.feeStructureId?.name || 'Tuition & Facilities Fee'}</td>
                        <td className="py-2.5 px-3 text-slate-500">Term</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">${activeInvoice.baseAmount}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50/70 border-t border-slate-200 text-xs font-semibold">
                    <tr>
                      <td colSpan="2" className="py-2 px-3 text-slate-600">Subtotal (Base Amount)</td>
                      <td className="py-2 px-3 text-right text-slate-800">${activeInvoice.baseAmount}</td>
                    </tr>
                    {activeInvoice.discountAmount > 0 && (
                      <tr className="text-emerald-700">
                        <td colSpan="2" className="py-1 px-3">
                          Discount / Waiver ({activeInvoice.discountReason || 'Approved'})
                        </td>
                        <td className="py-1 px-3 text-right">-${activeInvoice.discountAmount}</td>
                      </tr>
                    )}
                    {activeInvoice.lateFine > 0 && (
                      <tr className="text-rose-600">
                        <td colSpan="2" className="py-1 px-3">Overdue Late Fine</td>
                        <td className="py-1 px-3 text-right">+${activeInvoice.lateFine}</td>
                      </tr>
                    )}
                    <tr className="border-t border-slate-200 text-slate-900 text-sm font-bold">
                      <td colSpan="2" className="py-2 px-3">Net Payable</td>
                      <td className="py-2 px-3 text-right text-indigo-700">${activeInvoice.netPayable}</td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="py-1 px-3 text-emerald-600 font-medium">Amount Already Paid</td>
                      <td className="py-1 px-3 text-right text-emerald-600 font-bold">${activeInvoice.paidAmount}</td>
                    </tr>
                    <tr className="bg-indigo-50/60 text-slate-900 font-bold">
                      <td colSpan="2" className="py-2.5 px-3 text-rose-700">Outstanding Balance Due</td>
                      <td className="py-2.5 px-3 text-right text-rose-700 text-base font-black">${activeInvoice.balanceAmount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment History inside invoice (if payments exist) */}
              {activeInvoice.payments && activeInvoice.payments.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    Recorded Payment History
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="py-1.5 px-3">Receipt / Trans #</th>
                        <th className="py-1.5 px-3">Date</th>
                        <th className="py-1.5 px-3">Method</th>
                        <th className="py-1.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeInvoice.payments.map((p, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-3 font-mono">{p.paymentNumber || p.transactionReference || 'N/A'}</td>
                          <td className="py-1.5 px-3">{new Date(p.paymentDate).toLocaleDateString()}</td>
                          <td className="py-1.5 px-3">{p.paymentMethod}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-emerald-600">${p.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Terms & Seal */}
              <div className="flex justify-between items-end pt-3 text-xs">
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <p>• Please settle on or before the due date to avoid recurring daily late fees.</p>
                  <p>• Accepted payment modes: Cash, UPI, Cheque, Bank Transfer (NEFT/IMPS).</p>
                  <p>• Retain this official demand notice for verification and accounts queries.</p>
                </div>

                <div className="text-right">
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Accounts Office Authorized
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2.5">
              <div>
                {activeInvoice.balanceAmount > 0 && activeInvoice.status !== 'Waived' && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setIsInvoiceModalOpen(false);
                      handleOpenCollectModal(activeInvoice);
                    }}
                    icon={<CreditCard className="w-4 h-4" />}
                  >
                    Pay Invoice Now
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setIsInvoiceModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => printElement('printable-invoice', 'Official_Fee_Invoice')}
                  icon={<Printer className="w-4 h-4" />}
                >
                  Print / Save PDF
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE FEE STRUCTURE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        title="Create Class Fee Structure"
      >
        <form onSubmit={handleCreateFeeStructure} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Structure Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Grade 10 Regular Term 1"
                value={structureForm.name}
                onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Applicable Class *
              </label>
              <select
                required
                value={structureForm.classId}
                onChange={(e) => setStructureForm({ ...structureForm, classId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Select Grade / Class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
              <input
                type="date"
                value={structureForm.dueDate}
                onChange={(e) => setStructureForm({ ...structureForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Late Fine ($ per day overdue)
              </label>
              <input
                type="number"
                min="0"
                value={structureForm.lateFinePerDay}
                onChange={(e) =>
                  setStructureForm({ ...structureForm, lateFinePerDay: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* Dynamic Component Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600">
                Fee Breakdown Components
              </label>
              <button
                type="button"
                onClick={handleAddComponent}
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Component
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {structureForm.components.map((comp, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Component name (e.g. Tuition)"
                    required
                    value={comp.name}
                    onChange={(e) => handleComponentChange(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    min="0"
                    required
                    value={comp.amount}
                    onChange={(e) => handleComponentChange(index, 'amount', e.target.value)}
                    className="w-24 px-3 py-1.5 text-xs rounded-lg border border-slate-200 font-bold"
                  />
                  {structureForm.components.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveComponent(index)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 p-3 rounded-xl bg-slate-50 flex justify-between items-center text-sm font-bold text-slate-800">
              <span>Total Calculated Term Fee:</span>
              <span className="text-indigo-600 text-base">
                $
                {structureForm.components.reduce(
                  (sum, c) => sum + (Number(c.amount) || 0),
                  0
                )}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="secondary" onClick={() => setIsStructureModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Fee Structure
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: BULK INVOICE GENERATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isGenerateInvoiceModalOpen}
        onClose={() => !isGeneratingInvoice && setIsGenerateInvoiceModalOpen(false)}
        title="Generate Student Fee Invoices"
      >
        {feeStructures.length === 0 ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                No Fee Structures Defined
              </div>
              <p>
                To generate student invoices, you must first define at least one Fee Structure template specifying the total tuition, lab, sports fees, and due date for a grade.
              </p>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="secondary" onClick={() => setIsGenerateInvoiceModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsGenerateInvoiceModalOpen(false);
                  setIsStructureModalOpen(true);
                }}
                icon={<Layers className="w-4 h-4" />}
              >
                + Create Fee Structure
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerateInvoices} className="space-y-4">
            <p className="text-xs text-slate-500">
              Generate official billing invoices from fee structure templates. Students with existing invoices for this template will automatically be preserved without duplication.
            </p>

            {/* 1. Fee Structure Template Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Fee Structure Template *
              </label>
              <select
                required
                value={generateInvoiceForm.feeStructureId}
                onChange={(e) => handleSelectStructureForInvoice(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-indigo-500"
              >
                <option value="">Select Fee Structure</option>
                {feeStructures.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} — ${s.totalAmount} ({s.classId?.name || 'Class'})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Fee Structure Detail Preview */}
            {(() => {
              const selected = feeStructures.find((s) => s._id === generateInvoiceForm.feeStructureId);
              if (!selected) return null;
              return (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Target Class:</span>
                    <span className="font-bold text-indigo-700">{selected.classId?.name || 'Assigned Grade'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Total Term Amount:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">${selected.totalAmount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Default Due Date:</span>
                    <span className="text-slate-600">
                      {selected.dueDate ? new Date(selected.dueDate).toLocaleDateString() : '30 days from creation'}
                    </span>
                  </div>
                  {selected.components && selected.components.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="block text-[11px] font-semibold text-slate-500 mb-1">Components Breakdown:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.components.map((c, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px]">
                            {c.name}: <strong className="text-indigo-600">${c.amount}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 2. Billing Target Scope */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Billing Scope
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGenerateInvoiceForm((prev) => ({ ...prev, targetScope: 'class', studentId: '' }))}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    generateInvoiceForm.targetScope === 'class'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Entire Class Batch
                </button>
                <button
                  type="button"
                  onClick={() => setGenerateInvoiceForm((prev) => ({ ...prev, targetScope: 'student' }))}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    generateInvoiceForm.targetScope === 'student'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Individual Student
                </button>
              </div>
            </div>

            {/* Individual Student Dropdown (if scope === 'student') */}
            {generateInvoiceForm.targetScope === 'student' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Student *
                </label>
                {loadingStudents ? (
                  <div className="text-xs text-slate-400 py-2">Loading active students...</div>
                ) : classStudents.length === 0 ? (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    No active students found in this class.
                  </div>
                ) : (
                  <select
                    required
                    value={generateInvoiceForm.studentId}
                    onChange={(e) => setGenerateInvoiceForm((prev) => ({ ...prev, studentId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="">Select Student</option>
                    {classStudents.map((st) => (
                      <option key={st._id} value={st._id}>
                        {st.firstName} {st.lastName} ({st.admissionNumber || st.studentId})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* 3. Optional Due Date Override */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Due Date (Optional)
              </label>
              <input
                type="date"
                value={generateInvoiceForm.dueDateOverride}
                onChange={(e) => setGenerateInvoiceForm((prev) => ({ ...prev, dueDateOverride: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Leave blank to retain the default structure due date.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                disabled={isGeneratingInvoice}
                onClick={() => setIsGenerateInvoiceModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isGeneratingInvoice}
                icon={<FileText className="w-4 h-4" />}
              >
                {isGeneratingInvoice ? 'Generating Invoices...' : 'Generate Student Invoices'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: APPLY DISCOUNT / WAIVER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        title="Apply Scholarship or Fee Waiver"
      >
        {selectedInvoiceForDiscount && (
          <form onSubmit={handleApplyDiscount} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700 flex justify-between">
              <div>
                <span className="text-slate-400 block">Student</span>
                <span className="font-bold">
                  {selectedInvoiceForDiscount.studentId?.firstName} {selectedInvoiceForDiscount.studentId?.lastName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Base Fee</span>
                <span className="font-bold text-slate-900">${selectedInvoiceForDiscount.baseAmount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isWaiver"
                checked={discountForm.isWaiver}
                onChange={(e) => setDiscountForm({ ...discountForm, isWaiver: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded-sm"
              />
              <label htmlFor="isWaiver" className="text-xs font-semibold text-slate-700">
                Grant 100% Full Fee Waiver
              </label>
            </div>

            {!discountForm.isWaiver && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Discount Amount ($) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedInvoiceForDiscount.baseAmount}
                  required
                  value={discountForm.discountAmount}
                  onChange={(e) =>
                    setDiscountForm({ ...discountForm, discountAmount: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 font-bold"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Discount / Waiver Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Sibling discount, Merit scholarship"
                value={discountForm.discountReason}
                onChange={(e) =>
                  setDiscountForm({ ...discountForm, discountReason: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3">
              <Button variant="secondary" onClick={() => setIsDiscountModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Apply to Invoice
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: LOG INSTITUTIONAL EXPENSE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Log Institutional Expenditure"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Expense Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Annual Fire Safety Maintenance"
              value={expenseForm.title}
              onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Category *
              </label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                {[
                  'Utilities',
                  'Maintenance',
                  'Salaries',
                  'Supplies',
                  'Lab Equipment',
                  'Sports',
                  'Transport Fuel',
                  'Events',
                  'IT & Software',
                  'Other',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Amount ($) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Payment Mode
              </label>
              <select
                value={expenseForm.paymentMethod}
                onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Corporate Card">Corporate Card</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Vendor Name
              </label>
              <input
                type="text"
                placeholder="Vendor or Supplier"
                value={expenseForm.vendorName}
                onChange={(e) => setExpenseForm({ ...expenseForm, vendorName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <Button variant="secondary" onClick={() => setIsExpenseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Expense Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FinancePage;
