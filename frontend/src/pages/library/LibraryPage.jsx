import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Bookmark,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Building,
  Tag,
  AlertCircle,
  X,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import libraryService from '../../services/libraryService.js';
import studentService from '../../services/studentService.js';
import { useAuth } from '../../context/AuthContext.jsx';

export const LibraryPage = () => {
  const { user } = useAuth();
  const isStudent = user?.role?.name === 'STUDENT';
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'catalog');
  const [loading, setLoading] = useState(false);

  // Data states
  const [books, setBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);

  // Search & Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== search) {
      setSearch(q);
    }
  }, [searchParams]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [trxStatusFilter, setTrxStatusFilter] = useState('');

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    category: 'Literature',
    isbn: '',
    rackNumber: 'R-01',
    shelfNumber: 'S-1',
    totalCopies: 3,
  });

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedBookForIssue, setSelectedBookForIssue] = useState(null);
  const [issueForm, setIssueForm] = useState({
    studentId: '',
    dueDate: '',
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

  const loadBooks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;

      const res = await libraryService.getBooks(params);
      if (res.data?.data) setBooks(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (trxStatusFilter) params.status = trxStatusFilter;

      const res = await libraryService.getTransactions(params);
      if (res.data?.data) setTransactions(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isStudent) {
      loadStudents();
    }
  }, [isStudent]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'catalog') loadBooks();
      if (activeTab === 'transactions') loadTransactions();
    }, 250);
    return () => clearTimeout(timer);
  }, [activeTab, categoryFilter, trxStatusFilter, search]);

  const handleCreateBook = async (e) => {
    e.preventDefault();
    try {
      await libraryService.createBook({
        title: bookForm.title,
        author: bookForm.author,
        category: bookForm.category,
        isbn: bookForm.isbn,
        rackLocation: {
          rackNumber: bookForm.rackNumber,
          shelfNumber: bookForm.shelfNumber,
        },
        totalCopies: Number(bookForm.totalCopies),
      });
      showBanner('success', 'Book cataloged successfully.');
      setIsBookModalOpen(false);
      loadBooks();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to catalog book.');
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    try {
      await libraryService.issueBook({
        bookId: selectedBookForIssue._id,
        studentId: issueForm.studentId,
        patronType: 'Student',
        dueDate: issueForm.dueDate,
      });
      showBanner('success', 'Book issued successfully.');
      setIsIssueModalOpen(false);
      loadBooks();
      if (activeTab === 'transactions') loadTransactions();
    } catch (err) {
      showBanner('error', err.response?.data?.message || 'Failed to issue book.');
    }
  };

  const handleReturnBook = async (transactionId) => {
    try {
      const res = await libraryService.returnBook(transactionId, { finePaid: true });
      showBanner('success', res.data?.message || 'Book returned.');
      loadTransactions();
    } catch (err) {
      showBanner('error', 'Failed to return book.');
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
              Library & Knowledge Resource Center
            </h1>
            <Badge variant="primary">Phase 8</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isStudent
              ? 'Browse available books in the school library catalog and check stock inventory.'
              : 'Book cataloging, rack locations, student loan circulation, and overdue fine management.'}
          </p>
        </div>

        {!isStudent && (
          <Button
            variant="primary"
            onClick={() => setIsBookModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Catalog New Book
          </Button>
        )}
      </div>

      {/* Tabs */}
      {!isStudent && (
        <div className="flex border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'catalog'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Book Catalog</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'transactions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Circulation Loans & Returns</span>
          </button>
        </div>
      )}

      {loading && (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="lg" message="Loading library resources..." />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. BOOK CATALOG TAB */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'catalog' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search title, author, ISBN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadBooks()}
                  className="w-full pl-9 pr-9 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">All Categories</option>
                  <option value="Science">Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Literature">Literature</option>
                  <option value="History">History</option>
                  <option value="Computing">Computing</option>
                </select>

                <Button variant="secondary" onClick={loadBooks} icon={<Filter className="w-3.5 h-3.5" />}>
                  Filter
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {books.length > 0 ? (
              books.map((b) => (
                <Card key={b._id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{b.category}</Badge>
                      <span className="text-xs font-mono text-slate-400">
                        {b.rackLocation?.rackNumber}/{b.rackLocation?.shelfNumber}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-slate-900 mt-2">{b.title}</h4>
                    <p className="text-xs text-slate-500">By {b.author}</p>
                    {b.isbn && <p className="text-[11px] font-mono text-slate-400 mt-1">ISBN: {b.isbn}</p>}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Inventory</span>
                      <span
                        className={`text-sm font-bold ${
                          b.availableCopies > 0 ? 'text-emerald-600' : 'text-rose-500'
                        }`}
                      >
                        {b.availableCopies} available / {b.totalCopies} total
                      </span>
                    </div>

                    {!isStudent ? (
                      <Button
                        size="sm"
                        variant={b.availableCopies > 0 ? 'primary' : 'secondary'}
                        disabled={b.availableCopies <= 0}
                        onClick={() => {
                          setSelectedBookForIssue(b);
                          setIsIssueModalOpen(true);
                        }}
                      >
                        {b.availableCopies > 0 ? 'Issue Book' : 'Out of Stock'}
                      </Button>
                    ) : (
                      <Badge variant={b.availableCopies > 0 ? 'success' : 'danger'}>
                        {b.availableCopies > 0 ? `${b.availableCopies} Available` : 'Out of Stock'}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-3">
                <EmptyState
                  title="No books cataloged"
                  description={
                    isStudent
                      ? "There are currently no books cataloged in the school library."
                      : "Add books with copies and rack locations to populate the school library."
                  }
                  actionLabel={!isStudent ? "+ Catalog First Book" : undefined}
                  onAction={!isStudent ? () => setIsBookModalOpen(true) : undefined}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TRANSACTIONS TAB */}
      {/* ========================================================================= */}
      {!loading && activeTab === 'transactions' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Transaction #</th>
                  <th className="py-3.5 px-4">Book Title</th>
                  <th className="py-3.5 px-4">Borrower</th>
                  <th className="py-3.5 px-4 text-center">Issue Date</th>
                  <th className="py-3.5 px-4 text-center">Due Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length > 0 ? (
                  transactions.map((trx) => (
                    <tr key={trx._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {trx.transactionNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{trx.bookId?.title}</div>
                        <div className="text-xs text-slate-400">By {trx.bookId?.author}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {trx.studentId?.firstName} {trx.studentId?.lastName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {trx.studentId?.admissionNumber || 'Staff Member'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-slate-500">
                        {new Date(trx.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-semibold text-slate-700">
                        {new Date(trx.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            trx.status === 'Returned'
                              ? 'success'
                              : trx.status === 'Overdue'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {trx.status}
                        </Badge>
                        {trx.fineAmount > 0 && trx.status !== 'Returned' && (
                          <span className="block text-xs text-rose-600 font-bold mt-0.5">
                            Fine: ${trx.fineAmount}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {trx.status !== 'Returned' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleReturnBook(trx._id)}
                            icon={<RotateCcw className="w-3.5 h-3.5" />}
                          >
                            Return Book
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No active library circulation loans found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CATALOG BOOK */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!isStudent && isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Catalog New Library Book"
      >
        <form onSubmit={handleCreateBook} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Book Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Introduction to Algorithms"
              value={bookForm.title}
              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Author *</label>
              <input
                type="text"
                required
                placeholder="e.g. Thomas H. Cormen"
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
              <select
                value={bookForm.category}
                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="Science">Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Literature">Literature</option>
                <option value="History">History</option>
                <option value="Computing">Computing</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ISBN</label>
              <input
                type="text"
                placeholder="e.g. 978-0262033848"
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Rack #</label>
              <input
                type="text"
                value={bookForm.rackNumber}
                onChange={(e) => setBookForm({ ...bookForm, rackNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Total Copies</label>
              <input
                type="number"
                min="1"
                required
                value={bookForm.totalCopies}
                onChange={(e) => setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save to Catalog
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ISSUE BOOK */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!isStudent && isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Check Out / Issue Library Book"
      >
        {selectedBookForIssue && (
          <form onSubmit={handleIssueBook} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800 text-sm block">
                  {selectedBookForIssue.title}
                </span>
                <span className="text-slate-400">By {selectedBookForIssue.author}</span>
              </div>
              <span className="font-bold text-emerald-600">
                {selectedBookForIssue.availableCopies} available
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Select Borrower (Student) *
              </label>
              <select
                required
                value={issueForm.studentId}
                onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
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

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Return Due Date</label>
              <input
                type="date"
                value={issueForm.dueDate}
                onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Defaults to 14 days loan period if left blank.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsIssueModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Confirm Checkout
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default LibraryPage;
