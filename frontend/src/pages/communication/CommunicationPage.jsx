import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Shield,
  Search,
  Sparkles,
  Bot,
  Plus,
} from 'lucide-react';
import communicationService from '../../services/communicationService.js';
import { useAuth } from '../../context/AuthContext.jsx';

export const CommunicationPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('messaging'); // 'messaging', 'ptm', 'chat'
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Messaging state
  const [logs, setLogs] = useState([]);
  const [channel, setChannel] = useState('WhatsApp');
  const [targetGroup, setTargetGroup] = useState('All_Parents');
  const [broadcastText, setBroadcastText] = useState('');

  // 2. PTM state
  const [ptmSlots, setPtmSlots] = useState([]);
  const [newPtmTitle, setNewPtmTitle] = useState('');
  const [newPtmDate, setNewPtmDate] = useState('2026-04-25');
  const [newPtmStart, setNewPtmStart] = useState('09:00 AM');
  const [newPtmEnd, setNewPtmEnd] = useState('12:00 PM');
  const [showPtmModal, setShowPtmModal] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);

  // 3. Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('GENERAL');
  const [chatInput, setChatInput] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await communicationService.getLogs();
      if (res.data?.success) setLogs(res.data.data);
    } catch {
      // fallback mock logs if DB is empty
      setLogs([
        {
          _id: '1',
          channel: 'WhatsApp',
          recipientName: 'David Miller (Parent)',
          recipientPhone: '+91-9876543210',
          triggerEvent: 'ATTENDANCE_ABSENT',
          messageBody: 'Dear Parent, Lucas Miller was marked ABSENT today (08:30 AM). Please contact class teacher.',
          status: 'Delivered',
          createdAt: new Date().toISOString(),
        },
        {
          _id: '2',
          channel: 'SMS',
          recipientName: 'Sarah Jenkins (Parent)',
          recipientPhone: '+91-9812345678',
          triggerEvent: 'FEE_REMINDER',
          messageBody: 'Gentle reminder: Q2 tuition fees are due on April 15. Pay online to avoid late fee.',
          status: 'Delivered',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    }
  };

  const fetchPTM = async () => {
    try {
      const res = await communicationService.getPTMSlots();
      if (res.data?.success) setPtmSlots(res.data.data);
    } catch {
      setPtmSlots([]);
    }
  };

  const fetchChat = async () => {
    try {
      const res = await communicationService.getChatMessages({ channel: selectedChannel });
      if (res.data?.success) setChatMessages(res.data.data);
    } catch {
      setChatMessages([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'messaging') fetchLogs();
    if (activeTab === 'ptm') fetchPTM();
    if (activeTab === 'chat') fetchChat();
  }, [activeTab, selectedChannel]);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await communicationService.sendBroadcast({
        channel,
        targetGroup,
        messageBody: broadcastText,
      });
      setSuccessMsg(`Broadcast dispatched successfully via ${channel} to ${targetGroup}!`);
      setBroadcastText('');
      fetchLogs();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to dispatch broadcast');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAlert = async (alertType) => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await communicationService.triggerAlert({
        alertType,
        studentName: alertType === 'ATTENDANCE_ABSENT' ? 'Lucas Miller' : 'Emily Davis',
        amountDue: '650',
      });
      setSuccessMsg(`Test alert [${alertType}] sent successfully to parent WhatsApp!`);
      fetchLogs();
    } catch {
      setErrorMsg('Error triggering test alert');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePTM = async (e) => {
    e.preventDefault();
    try {
      await communicationService.createPTMSlot({
        title: newPtmTitle,
        date: newPtmDate,
        startTime: newPtmStart,
        endTime: newPtmEnd,
        teacherName: user?.username || 'Class Teacher',
      });
      setShowPtmModal(false);
      setNewPtmTitle('');
      fetchPTM();
      setSuccessMsg('PTM Conference scheduled successfully');
    } catch (err) {
      setErrorMsg('Failed to schedule PTM');
    }
  };

  const handleBookSlot = async (slotId) => {
    try {
      await communicationService.bookPTMSlot(slotId, {
        parentName: user?.username || 'Guardian',
        studentName: 'My Student Ward',
        notes: bookingNotes || 'Discussion on academic progress',
      });
      setSelectedSlotForBooking(null);
      setBookingNotes('');
      fetchPTM();
      setSuccessMsg('Slot booked successfully!');
    } catch (err) {
      setErrorMsg('Booking failed');
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      await communicationService.sendChatMessage({
        channelName: selectedChannel,
        message: chatInput,
      });
      setChatInput('');
      fetchChat();
    } catch {
      setErrorMsg('Failed to send message');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
            Communication & PTM Hub
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Omnichannel messaging via WhatsApp, SMS, Parent-Teacher conferences, and real-time school chat.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('messaging')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'messaging' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            WhatsApp & SMS Hub
          </button>
          <button
            onClick={() => setActiveTab('ptm')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ptm' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PTM Scheduler
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'chat' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In-App Channels
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1: WHATSAPP & SMS HUB */}
      {/* ============================================================ */}
      {activeTab === 'messaging' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Broadcast Composer & Triggers */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                Quick Broadcast Composer
              </h2>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Dispatch Channel</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setChannel('WhatsApp')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        channel === 'WhatsApp'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" /> WhatsApp API
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel('SMS')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        channel === 'SMS'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> SMS Gateway
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Target Audience</label>
                  <select
                    value={targetGroup}
                    onChange={(e) => setTargetGroup(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="All_Parents">All Parents & Guardians</option>
                    <option value="Class_Section">Class 10-A Section Only</option>
                    <option value="Fee_Defaulters">Fee Overdue Defaulters</option>
                    <option value="Staff">All Faculty & Staff</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Message Body</label>
                  <textarea
                    rows={4}
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="Type official notification or circular announcement..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !broadcastText.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {loading ? 'Dispatching...' : `Broadcast via ${channel}`}
                </button>
              </form>
            </div>

            {/* Quick Simulation Triggers */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Automated Trigger Simulators
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Simulate instant automated webhook triggers for parent communications.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleTriggerAlert('ATTENDANCE_ABSENT')}
                  disabled={loading}
                  className="w-full py-2 px-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-medium text-left flex items-center justify-between"
                >
                  <span>Simulate Absent Alert</span>
                  <span className="text-[10px] font-mono bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                    WhatsApp
                  </span>
                </button>
                <button
                  onClick={() => handleTriggerAlert('FEE_REMINDER')}
                  disabled={loading}
                  className="w-full py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-medium text-left flex items-center justify-between"
                >
                  <span>Simulate Fee Due Alert</span>
                  <span className="text-[10px] font-mono bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded">
                    WhatsApp
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Dispatch Logs */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Live Communication Dispatch Ledger
              </h2>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                {logs.length} Recent Logs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-2">Channel</th>
                    <th className="pb-2">Recipient</th>
                    <th className="pb-2">Event</th>
                    <th className="pb-2">Message Content</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/60">
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.channel === 'WhatsApp'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {log.channel}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-slate-800">
                        {log.recipientName}
                        <span className="block text-[10px] text-slate-400 font-mono">{log.recipientPhone}</span>
                      </td>
                      <td className="py-3 text-slate-600">
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                          {log.triggerEvent}
                        </span>
                      </td>
                      <td className="py-3 max-w-xs truncate text-slate-600" title={log.messageBody}>
                        {log.messageBody}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> {log.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 text-[10px] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: PTM SCHEDULER */}
      {/* ============================================================ */}
      {activeTab === 'ptm' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Parent-Teacher Conference Sessions
            </h2>
            <button
              onClick={() => setShowPtmModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Schedule Conference
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ptmSlots.map((slot) => (
              <div key={slot._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{slot.title}</h3>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">Host: {slot.teacherName}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {slot.meetingMode}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date:</span>
                    <span className="font-medium text-slate-800">
                      {new Date(slot.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hours:</span>
                    <span className="font-medium text-slate-800">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Slot Length:</span>
                    <span className="font-medium text-slate-800">{slot.slotDurationMinutes} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bookings:</span>
                    <span className="font-semibold text-emerald-600">
                      {slot.bookings?.length || 0} / {slot.maxCapacity} booked
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedSlotForBooking(slot)}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                  >
                    Reserve 15-Min Slot
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Schedule Conference Modal */}
          {showPtmModal && (
            <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-slate-900 text-base">Schedule New PTM Conference</h3>
                <form onSubmit={handleCreatePTM} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Conference Title</label>
                    <input
                      type="text"
                      required
                      value={newPtmTitle}
                      onChange={(e) => setNewPtmTitle(e.target.value)}
                      placeholder="e.g. Mid-Term Academic Review"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={newPtmDate}
                      onChange={(e) => setNewPtmDate(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Start Time</label>
                      <input
                        type="text"
                        value={newPtmStart}
                        onChange={(e) => setNewPtmStart(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">End Time</label>
                      <input
                        type="text"
                        value={newPtmEnd}
                        onChange={(e) => setNewPtmEnd(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPtmModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                    >
                      Publish Schedule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Book Slot Modal */}
          {selectedSlotForBooking && (
            <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Reserve PTM Conference Slot</h3>
                <p className="text-xs text-slate-500">
                  Reserving session with {selectedSlotForBooking.teacherName} on{' '}
                  {new Date(selectedSlotForBooking.date).toLocaleDateString()}
                </p>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Agenda / Discussion Notes</label>
                  <textarea
                    rows={3}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="e.g. Discussing Mathematics homework performance"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedSlotForBooking(null)}
                    className="px-3 py-1.5 rounded-xl border text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleBookSlot(selectedSlotForBooking._id)}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                  >
                    Confirm Booking
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: IN-APP CHAT CHANNELS */}
      {/* ============================================================ */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 min-h-[500px]">
          {/* Channel List */}
          <div className="md:col-span-1 border-r border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Communication Channels</h3>
            <div className="space-y-1">
              {['GENERAL', 'FACULTY', 'CLASS-10A', 'PARENT-COUNCIL'].map((ch) => (
                <button
                  key={ch}
                  onClick={() => setSelectedChannel(ch)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    selectedChannel === ch ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>#{ch}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </button>
              ))}
            </div>
          </div>

          {/* Chat Feed */}
          <div className="md:col-span-3 flex flex-col justify-between p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">#{selectedChannel}</span>
              <span className="text-xs text-slate-400">Real-time Encrypted Channel</span>
            </div>

            {/* Messages */}
            <div className="flex-1 py-4 space-y-3 overflow-y-auto max-h-[360px]">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No messages in #{selectedChannel} yet. Be the first to start the conversation!
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg._id} className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{msg.senderName}</span>
                      <span className="text-[10px] text-indigo-500 uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-50">
                        {msg.senderRole}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-lg">
                      {msg.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSendChat} className="pt-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Post message to #${selectedChannel}...`}
                className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationPage;
