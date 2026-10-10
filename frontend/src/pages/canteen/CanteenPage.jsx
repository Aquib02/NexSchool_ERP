import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  ShoppingCart,
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Coffee,
  Leaf,
  CreditCard,
  Printer,
  X,
  AlertCircle,
} from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import canteenService from '../../services/canteenService.js';
import studentService from '../../services/studentService.js';

export const CanteenPage = () => {
  const [activeTab, setActiveTab] = useState('pos');
  const [loading, setLoading] = useState(false);

  // Data states
  const [menuItems, setMenuItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);

  // POS Order Cart
  const [cart, setCart] = useState([]);
  const [customerType, setCustomerType] = useState('Student');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Search & Category Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);

  // Forms
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Meals / Lunch',
    price: 5.0,
    costPrice: 2.5,
    quantityInStock: 50,
    isVegetarian: true,
    allergens: '',
    isAvailable: true,
  });

  const [banner, setBanner] = useState({ type: '', text: '' });
  const showBanner = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner({ type: '', text: '' }), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [iRes, tRes, sRes] = await Promise.all([
        canteenService.getItems(),
        canteenService.getTransactions(),
        studentService.getStudents({ limit: 100 }),
      ]);
      if (iRes.data?.data) setMenuItems(iRes.data.data);
      if (tRes.data?.data) setTransactions(tRes.data.data);
      if (sRes.data?.data?.students) setStudents(sRes.data.data.students);
    } catch (err) {
      console.error(err);
      showBanner('error', 'Failed to load cafeteria data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cart operations
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.itemId === item._id);
      if (existing) {
        return prev.map((line) =>
          line.itemId === item._id
            ? { ...line, quantity: line.quantity + 1, subtotal: (line.quantity + 1) * line.unitPrice }
            : line
        );
      } else {
        return [
          ...prev,
          {
            itemId: item._id,
            name: item.name,
            unitPrice: item.price,
            quantity: 1,
            subtotal: item.price,
          },
        ];
      }
    });
  };

  const updateCartQuantity = (itemId, change) => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.itemId === itemId) {
            const newQty = line.quantity + change;
            return newQty > 0 ? { ...line, quantity: newQty, subtotal: newQty * line.unitPrice } : null;
          }
          return line;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((line) => line.itemId !== itemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCheckoutOrder = async () => {
    if (cart.length === 0) return;
    try {
      setLoading(true);
      const payload = {
        customerType,
        studentId: customerType === 'Student' && selectedStudentId ? selectedStudentId : undefined,
        items: cart,
        paymentMethod,
        paymentStatus: 'Paid',
      };

      const res = await canteenService.createTransaction(payload);
      setReceiptModalOrder(res.data.data);
      setCart([]);
      showBanner('success', 'Order processed successfully');
      loadData();
    } catch (err) {
      console.error(err);
      showBanner('error', err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...itemForm,
        allergens: itemForm.allergens ? itemForm.allergens.split(',').map((a) => a.trim()) : [],
      };
      await canteenService.createItem(payload);
      showBanner('success', 'Menu item added successfully');
      setIsItemModalOpen(false);
      setItemForm({
        name: '',
        category: 'Meals / Lunch',
        price: 5.0,
        costPrice: 2.5,
        quantityInStock: 50,
        isVegetarian: true,
        allergens: '',
        isAvailable: true,
      });
      loadData();
    } catch (err) {
      console.error(err);
      showBanner('error', err.response?.data?.message || 'Error creating menu item');
    } finally {
      setLoading(false);
    }
  };

  // Metrics
  const totalRevenue = transactions
    .filter((t) => t.paymentStatus === 'Paid')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const vegCount = menuItems.filter((i) => i.isVegetarian).length;

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
            <UtensilsCrossed className="w-7 h-7 text-indigo-600" />
            Canteen & Cafeteria
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Menu catalog, point-of-sale fast order billing, dietary filters, and meal card records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsItemModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Orders</p>
            <h3 className="text-2xl font-bold text-slate-900">{transactions.length}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Menu Items</p>
            <h3 className="text-2xl font-bold text-slate-900">{menuItems.length}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Vegetarian Items</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {vegCount} / {menuItems.length}
            </h3>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'pos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Point of Sale (POS)
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'menu'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Food Catalog ({menuItems.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'transactions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Sales Ledger ({transactions.length})
        </button>
      </div>

      {/* TAB 1: POS REGISTER INTERFACE */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Items Grid (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search dishes..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'Breakfast', 'Meals / Lunch', 'Snacks', 'Beverages', 'Bakery'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        categoryFilter === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {menuItems
                  .filter((i) => categoryFilter === 'All' || i.category === categoryFilter)
                  .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()))
                  .map((item) => (
                    <div
                      key={item._id}
                      className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-sm text-slate-900">{item.name}</span>
                          {item.isVegetarian ? (
                            <span className="w-4 h-4 rounded border border-emerald-600 flex items-center justify-center shrink-0">
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded border border-rose-600 flex items-center justify-center shrink-0">
                              <span className="w-2 h-2 rounded-full bg-rose-600" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{item.category}</p>
                        {item.allergens?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.allergens.map((a, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 text-[10px] bg-amber-50 text-amber-700 rounded font-medium"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-base font-extrabold text-slate-900">
                          ${item.price.toFixed(2)}
                        </span>
                        <Button size="sm" variant="primary" onClick={() => addToCart(item)}>
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          {/* POS Cart Summary (1 Column) */}
          <div className="space-y-4">
            <Card className="p-5 flex flex-col h-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-indigo-600" /> Current Order
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Customer Selector */}
              <div className="py-3 border-b border-slate-100 space-y-2">
                <div className="flex gap-4 text-xs font-semibold text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="customerType"
                      value="Student"
                      checked={customerType === 'Student'}
                      onChange={(e) => setCustomerType(e.target.value)}
                    />
                    Student
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="customerType"
                      value="Staff"
                      checked={customerType === 'Staff'}
                      onChange={(e) => setCustomerType(e.target.value)}
                    />
                    Staff
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="customerType"
                      value="Walk-in / Guest"
                      checked={customerType === 'Walk-in / Guest'}
                      onChange={(e) => setCustomerType(e.target.value)}
                    />
                    Walk-in
                  </label>
                </div>

                {customerType === 'Student' && (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  >
                    <option value="">Select Student (Optional / Guest)</option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.firstName} {s.lastName} ({s.admissionNumber})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5 max-h-72">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Cart is empty. Click + Add on items to build an order.
                  </div>
                ) : (
                  cart.map((line) => (
                    <div
                      key={line.itemId}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs"
                    >
                      <div className="flex-1 truncate pr-2">
                        <p className="font-semibold text-slate-900 truncate">{line.name}</p>
                        <p className="text-slate-500 text-[11px]">${line.unitPrice.toFixed(2)} ea</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                          <button
                            onClick={() => updateCartQuantity(line.itemId, -1)}
                            className="p-1 text-slate-500 hover:text-slate-800"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-bold text-slate-800">{line.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(line.itemId, 1)}
                            className="p-1 text-slate-500 hover:text-slate-800"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-extrabold text-slate-900 w-12 text-right">
                          ${line.subtotal.toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(line.itemId)}
                          className="text-rose-500 hover:text-rose-700 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Footer & Checkout */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Payment Method</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="px-2 py-1 text-xs border border-slate-200 rounded-lg font-semibold text-slate-800"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Meal Card / RFID">Meal Card / RFID</option>
                    <option value="UPI">UPI Payment</option>
                    <option value="Staff Credit Account">Staff Account</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-base font-extrabold text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-xl text-indigo-600">${cartTotal.toFixed(2)}</span>
                </div>

                <Button
                  variant="primary"
                  className="w-full justify-center py-2.5"
                  disabled={cart.length === 0 || loading}
                  onClick={handleCheckoutOrder}
                >
                  <Receipt className="w-4 h-4 mr-1.5" />
                  Complete Order (${cartTotal.toFixed(2)})
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: MENU CATALOG */}
      {activeTab === 'menu' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900">Food Menu & Nutritional Catalog</h3>
            <Button variant="primary" size="sm" onClick={() => setIsItemModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Dish
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Code & Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Selling Price</th>
                  <th className="px-4 py-3">Dietary</th>
                  <th className="px-4 py-3">Allergens</th>
                  <th className="px-4 py-3">Stock Available</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {menuItems.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-indigo-600 block">
                        {item.itemCode}
                      </span>
                      <span className="font-semibold text-slate-900">{item.name}</span>
                    </td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-900">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      {item.isVegetarian ? (
                        <Badge variant="success">Vegetarian</Badge>
                      ) : (
                        <Badge variant="danger">Non-Veg</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {item.allergens?.length > 0 ? (
                        <span className="text-amber-700 font-medium">{item.allergens.join(', ')}</span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.quantityInStock} units
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={item.isAvailable ? 'primary' : 'danger'}>
                        {item.isAvailable ? 'Available' : 'Sold Out'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: TRANSACTIONS / SALES LEDGER */}
      {activeTab === 'transactions' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900">Cafeteria Sales & Order Receipts</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items Summary</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600">
                      {t.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {t.studentId
                          ? `${t.studentId.firstName} ${t.studentId.lastName}`
                          : t.employeeId
                          ? `${t.employeeId.firstName} ${t.employeeId.lastName}`
                          : 'Walk-in Guest'}
                      </p>
                      <span className="text-xs text-slate-400">{t.customerType}</span>
                    </td>
                    <td className="px-4 py-3 text-xs max-w-xs truncate">
                      {t.items?.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-700">
                      {t.paymentMethod}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-slate-900">
                      ${t.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReceiptModalOrder(t)}
                      >
                        Print
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL: ADD FOOD ITEM */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title="Add Food Menu Item"
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Item Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Grilled Chicken Wrap"
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              >
                {['Breakfast', 'Meals / Lunch', 'Snacks', 'Beverages', 'Bakery', 'Fruit / Healthy', 'Packaged'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Selling Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Stock Quantity</label>
              <input
                type="number"
                min={0}
                value={itemForm.quantityInStock}
                onChange={(e) => setItemForm({ ...itemForm, quantityInStock: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cost Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={itemForm.costPrice}
                onChange={(e) => setItemForm({ ...itemForm, costPrice: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Allergens (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Gluten, Dairy, Peanuts"
              value={itemForm.allergens}
              onChange={(e) => setItemForm({ ...itemForm, allergens: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={itemForm.isVegetarian}
                onChange={(e) => setItemForm({ ...itemForm, isVegetarian: e.target.checked })}
              />
              Vegetarian Item
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={itemForm.isAvailable}
                onChange={(e) => setItemForm({ ...itemForm, isAvailable: e.target.checked })}
              />
              Available for Order
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsItemModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              Save Menu Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: PRINTABLE RECEIPT */}
      {receiptModalOrder && (
        <Modal
          isOpen={Boolean(receiptModalOrder)}
          onClose={() => setReceiptModalOrder(null)}
          title="Order Receipt Snapshot"
        >
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs space-y-3">
            <div className="text-center border-b border-dashed border-slate-300 pb-3 font-sans">
              <h3 className="font-bold text-base text-slate-900">NexSchool Cafeteria</h3>
              <p className="text-xs text-slate-500">Campus Food & Beverage Services</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Order #{receiptModalOrder.orderNumber} • {new Date(receiptModalOrder.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
              {receiptModalOrder.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-slate-700">
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Amount:</span>
                <span>${receiptModalOrder.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Payment Method:</span>
                <span>{receiptModalOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Status:</span>
                <span className="text-emerald-600 font-bold">PAID</span>
              </div>
            </div>

            <div className="pt-3 border-t border-dashed border-slate-300 flex justify-end gap-2 font-sans">
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print
              </Button>
              <Button size="sm" variant="primary" onClick={() => setReceiptModalOrder(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CanteenPage;
