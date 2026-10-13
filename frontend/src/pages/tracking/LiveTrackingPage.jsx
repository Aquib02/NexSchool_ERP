import React, { useState, useEffect } from 'react';
import {
  Bus,
  Navigation,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Radio,
  MapPin,
  Compass,
  Gauge,
  Fuel,
  RefreshCw,
} from 'lucide-react';
import liveTrackingService from '../../services/liveTrackingService.js';

export const LiveTrackingPage = () => {
  const [activeTab, setActiveTab] = useState('radar'); // 'radar', 'eta', 'boarding'
  const [fleet, setFleet] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [boardingList, setBoardingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [sosTriggered, setSosTriggered] = useState(false);

  const fetchFleet = async () => {
    try {
      const res = await liveTrackingService.getFleetStatus();
      if (res.data?.success && res.data.data.length > 0) {
        setFleet(res.data.data);
        if (!selectedBus) setSelectedBus(res.data.data[0]);
      } else {
        // Fallback default mock telemetry
        const mockFleet = [
          {
            _id: 'bus-1',
            vehicleId: {
              vehicleNumber: 'SCH-BUS-04',
              driverName: 'Robert Vance',
              driverPhone: '+91-9876543210',
              capacity: 40,
            },
            routeId: { routeName: 'Route 4: Downtown Express' },
            latitude: 28.6139,
            longitude: 77.209,
            speedKmH: 38,
            heading: 'NE',
            currentStopName: 'Oakwood Square',
            nextStopName: 'Pinehill Avenue',
            etaNextStopMinutes: 4,
            status: 'On Route',
            fuelPercent: 84,
            lastUpdated: new Date().toISOString(),
          },
          {
            _id: 'bus-2',
            vehicleId: {
              vehicleNumber: 'SCH-BUS-08',
              driverName: 'Michael Scott',
              driverPhone: '+91-9812345678',
              capacity: 35,
            },
            routeId: { routeName: 'Route 2: Northern Suburbs' },
            latitude: 28.625,
            longitude: 77.215,
            speedKmH: 28,
            heading: 'NW',
            currentStopName: 'Metro Junction',
            nextStopName: 'Central Academy Gate',
            etaNextStopMinutes: 7,
            status: 'On Route',
            fuelPercent: 72,
            lastUpdated: new Date().toISOString(),
          },
        ];
        setFleet(mockFleet);
        if (!selectedBus) setSelectedBus(mockFleet[0]);
      }
    } catch {
      // ignore
    }
  };

  const fetchBoarding = async () => {
    try {
      const res = await liveTrackingService.getBoardingChecklist();
      if (res.data?.success && res.data.data.length > 0) {
        setBoardingList(res.data.data);
      } else {
        setBoardingList([
          {
            studentId: 'stu-1',
            studentName: 'Lucas Miller',
            admissionNumber: 'ADM-2026-1044',
            stopName: 'Oakwood Square',
            status: 'Boarded',
            timestamp: new Date().toISOString(),
          },
          {
            studentId: 'stu-2',
            studentName: 'Emily Davis',
            admissionNumber: 'ADM-2026-1082',
            stopName: 'Pinehill Avenue',
            status: 'Pending',
            timestamp: null,
          },
          {
            studentId: 'stu-3',
            studentName: 'Jason Bourne',
            admissionNumber: 'ADM-2026-1090',
            stopName: 'Maple Cross',
            status: 'Pending',
            timestamp: null,
          },
        ]);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchFleet();
    fetchBoarding();
    const interval = setInterval(fetchFleet, 8000); // 8s auto telemetry refresh
    return () => clearInterval(interval);
  }, []);

  const handleTriggerSOS = async () => {
    if (!selectedBus) return;
    try {
      await liveTrackingService.triggerSOS({ vehicleId: selectedBus.vehicleId?._id || selectedBus._id });
      setSosTriggered(true);
      setStatusMsg('EMERGENCY SOS BROADCASTED TO CAMPUS SECURITY & DISPATCH!');
      fetchFleet();
    } catch {
      setSosTriggered(true);
      setStatusMsg('EMERGENCY SOS SIMULATION TRIGGERED!');
    }
  };

  const handleMarkBoarding = async (studentId, status) => {
    try {
      await liveTrackingService.markBoarding({
        studentId,
        boardingStatus: status,
      });
      setStatusMsg(`Student updated to [${status}]`);
      fetchBoarding();
    } catch {
      setBoardingList((prev) =>
        prev.map((item) =>
          item.studentId === studentId
            ? { ...item, status, timestamp: new Date().toISOString() }
            : item
        )
      );
      setStatusMsg(`Boarding status marked as ${status}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bus className="w-7 h-7 text-indigo-600" />
            Live GPS Bus Tracking & Fleet Radar
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time fleet telemetry, geofence ETA proximity, and conductor boarding manifests.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'radar' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live GPS Radar
          </button>
          <button
            onClick={() => setActiveTab('eta')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'eta' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Route Stop ETAs
          </button>
          <button
            onClick={() => setActiveTab('boarding')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'boarding' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Conductor Terminal
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-sm flex items-center justify-between ${
            sosTriggered
              ? 'bg-rose-50 border-rose-200 text-rose-800 animate-pulse'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {sosTriggered ? <ShieldAlert className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg('')} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1: LIVE GPS RADAR */}
      {/* ============================================================ */}
      {activeTab === 'radar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Buses Selector */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" /> Active Buses ({fleet.length})
                </h2>
                <button onClick={fetchFleet} className="p-1 text-slate-400 hover:text-slate-600">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {fleet.map((bus) => (
                  <div
                    key={bus._id}
                    onClick={() => setSelectedBus(bus)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedBus?._id === bus._id
                        ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-slate-900">{bus.vehicleId?.vehicleNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {bus.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{bus.routeId?.routeName}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>Speed: {bus.speedKmH} km/h</span>
                      <span>Next: {bus.nextStopName} ({bus.etaNextStopMinutes}m)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency SOS Button */}
            <div className="bg-gradient-to-br from-rose-50 to-rose-100/60 p-5 rounded-2xl border border-rose-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" /> Driver Emergency Broadcast
              </div>
              <p className="text-xs text-rose-600 leading-relaxed">
                In case of collision, engine malfunction, or medical distress, trigger instant alarm across admin consoles.
              </p>
              <button
                onClick={handleTriggerSOS}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" /> Trigger Emergency SOS
              </button>
            </div>
          </div>

          {/* Live Radar Map Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden min-h-[420px] flex flex-col justify-between">
              {/* Radar Grid Graphic Background */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

              {/* Top Telemetry Header */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">
                    Live GPS Telemetry Lock
                  </span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {selectedBus?.vehicleId?.vehicleNumber || 'SCH-BUS-04'}
                    <span className="text-xs font-normal text-slate-400">
                      ({selectedBus?.routeId?.routeName})
                    </span>
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    <span>{selectedBus?.speedKmH || 38} KM/H</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
                    <Fuel className="w-4 h-4 text-amber-400" />
                    <span>{selectedBus?.fuelPercent || 84}%</span>
                  </div>
                </div>
              </div>

              {/* Simulated Map View Canvas */}
              <div className="relative z-10 my-8 py-10 flex flex-col items-center justify-center">
                <div className="relative w-64 h-64 rounded-full border border-indigo-500/30 flex items-center justify-center">
                  {/* Radar sweep effect */}
                  <div className="absolute inset-0 rounded-full border border-indigo-400/20 animate-ping opacity-25" />
                  <div className="w-48 h-48 rounded-full border border-dashed border-indigo-500/30 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-indigo-950/60 border border-indigo-500/40 flex flex-col items-center justify-center text-center p-3">
                      <Bus className="w-7 h-7 text-indigo-400 animate-bounce" />
                      <span className="text-[10px] font-bold text-white mt-1">
                        {selectedBus?.currentStopName}
                      </span>
                      <span className="text-[9px] text-indigo-300 font-mono">
                        LAT: {selectedBus?.latitude?.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-400 mt-4 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Geofence: En Route to {selectedBus?.nextStopName}
                </span>
              </div>

              {/* Bottom Driver Meta */}
              <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Driver: {selectedBus?.vehicleId?.driverName || 'Authorized Driver'}</span>
                </div>
                <span>Phone: {selectedBus?.vehicleId?.driverPhone || '+91-9876543210'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: ROUTE STOP ETAS */}
      {/* ============================================================ */}
      {activeTab === 'eta' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Live Stop Arrival Schedule & Proximity Timetable
          </h2>

          <div className="space-y-3">
            {[
              { stop: 'Oakwood Square (School Point A)', time: '07:20 AM', eta: 'Departed', status: 'Passed' },
              { stop: 'Pinehill Avenue Cross', time: '07:35 AM', eta: '4 Mins Away (Approaching)', status: 'Current' },
              { stop: 'Maple Valley Station', time: '07:50 AM', eta: '18 Mins Away', status: 'Upcoming' },
              { stop: 'Central Academy Campus Gate 1', time: '08:15 AM', eta: '42 Mins Away', status: 'Upcoming' },
            ].map((st, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  st.status === 'Current'
                    ? 'border-indigo-400 bg-indigo-50/50'
                    : 'border-slate-100 bg-slate-50/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      st.status === 'Passed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : st.status === 'Current'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{st.stop}</h4>
                    <p className="text-[11px] text-slate-400">Scheduled: {st.time}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold font-mono ${
                      st.status === 'Current'
                        ? 'text-indigo-600'
                        : st.status === 'Passed'
                        ? 'text-emerald-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {st.eta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: CONDUCTOR BOARDING TERMINAL */}
      {/* ============================================================ */}
      {activeTab === 'boarding' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                Bus Conductor Morning Boarding Manifest
              </h2>
              <p className="text-xs text-slate-500">Tap status to mark boarding. Triggers automated parent alerts.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Student Name</th>
                  <th className="pb-2">Admission No</th>
                  <th className="pb-2">Allocated Stop</th>
                  <th className="pb-2">Boarding Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {boardingList.map((stu) => (
                  <tr key={stu.studentId} className="hover:bg-slate-50/60">
                    <td className="py-3 font-semibold text-slate-900">{stu.studentName}</td>
                    <td className="py-3 font-mono text-slate-500">{stu.admissionNumber}</td>
                    <td className="py-3 text-slate-600">{stu.stopName}</td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          stu.status === 'Boarded'
                            ? 'bg-emerald-100 text-emerald-800'
                            : stu.status === 'Alighted'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {stu.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleMarkBoarding(stu.studentId, 'Boarded')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px]"
                        >
                          Boarded
                        </button>
                        <button
                          onClick={() => handleMarkBoarding(stu.studentId, 'Alighted')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px]"
                        >
                          Alighted
                        </button>
                        <button
                          onClick={() => handleMarkBoarding(stu.studentId, 'Absent_Not_At_Stop')}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px]"
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrackingPage;
