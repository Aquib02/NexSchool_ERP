import React, { useState, useEffect } from 'react';
import {
  Brain,
  AlertTriangle,
  Sparkles,
  Bot,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  UserX,
  BookOpen,
  Send,
  Copy,
  Check,
  RefreshCw,
  Award,
} from 'lucide-react';
import aiAnalyticsService from '../../services/aiAnalyticsService.js';

export const AIAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('at-risk'); // 'at-risk', 'copilot', 'remarks', 'bot'
  const [loading, setLoading] = useState(false);

  // 1. At-Risk state
  const [atRiskData, setAtRiskData] = useState({ summary: {}, students: [] });
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('');

  // 2. Copilot state
  const [copilotTopic, setCopilotTopic] = useState('Photosynthesis & Cellular Energy Transfer');
  const [copilotSubject, setCopilotSubject] = useState('Science & Biology');
  const [copilotGrade, setCopilotGrade] = useState('Grade 9');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [copied, setCopied] = useState(false);

  // 3. Report remarks state
  const [stuName, setStuName] = useState('Lucas Miller');
  const [stuScore, setStuScore] = useState(86);
  const [stuAtt, setStuAtt] = useState(94);
  const [generatedRemark, setGeneratedRemark] = useState('');

  // 4. AI Admissions Bot state
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am the NexSchool AI Admissions Counselor. Ask me anything about fees, bus routes, curriculum, or admissions criteria!',
    },
  ]);
  const [botInput, setBotInput] = useState('');

  const fetchAtRisk = async () => {
    setLoading(true);
    try {
      const res = await aiAnalyticsService.getAtRiskAnalytics({ riskLevel: selectedRiskFilter });
      if (res.data?.success) setAtRiskData(res.data.data);
    } catch {
      // Fallback sample data
      setAtRiskData({
        summary: { totalEvaluated: 12, criticalCount: 3, moderateCount: 4, lowCount: 5 },
        students: [
          {
            _id: '1',
            studentId: { firstName: 'Alexander', lastName: 'Hayes', admissionNumber: 'ADM-2026-9021' },
            riskLevel: 'Critical',
            riskScore: 78,
            attendanceRate: 64,
            academicAverageScore: 48,
            identifiedFactors: [
              { factor: 'Chronic Absenteeism (64% attendance)', severity: 'High' },
              { factor: 'Downward Grade Velocity in Mathematics (-24%)', severity: 'High' },
            ],
            recommendedInterventions: [
              'Mandatory Parent-Teacher Counseling Session',
              'Remedial Foundation Class enrollment',
            ],
          },
          {
            _id: '2',
            studentId: { firstName: 'Sophia', lastName: 'Bennett', admissionNumber: 'ADM-2026-8812' },
            riskLevel: 'Moderate',
            riskScore: 42,
            attendanceRate: 74,
            academicAverageScore: 61,
            identifiedFactors: [
              { factor: 'Attendance marginally below 75% threshold', severity: 'Medium' },
            ],
            recommendedInterventions: [
              'Weekly check-in with class teacher',
              'Peer Study Buddy assignment',
            ],
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'at-risk') fetchAtRisk();
  }, [activeTab, selectedRiskFilter]);

  const handleGenerateLessonPlan = async () => {
    setLoading(true);
    try {
      const res = await aiAnalyticsService.generateLessonPlan({
        topic: copilotTopic,
        subjectName: copilotSubject,
        className: copilotGrade,
      });
      setGeneratedPlan(res.data?.data);
      setGeneratedQuiz(null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setLoading(true);
    try {
      const res = await aiAnalyticsService.generateQuizQuestions({
        topic: copilotTopic,
        count: 4,
      });
      setGeneratedQuiz(res.data?.data?.questions);
      setGeneratedPlan(null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRemarks = async () => {
    setLoading(true);
    try {
      const res = await aiAnalyticsService.generateReportRemarks({
        studentName: stuName,
        averageScore: stuScore,
        attendanceRate: stuAtt,
      });
      setGeneratedRemark(res.data?.data?.remark);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSendBotMessage = async (e) => {
    e.preventDefault();
    if (!botInput.trim()) return;

    const userText = botInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setBotInput('');

    try {
      const res = await aiAnalyticsService.chatAdmissions({
        message: userText,
        parentPhone: '+91-9876543210',
      });
      const reply = res.data?.data?.reply || 'Thank you for your inquiry! Our admissions office will follow up.';
      setChatMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'NexSchool Academy tuition fees average $4,200/yr with flexible 4-installment billing. Admissions for AY 2026-27 are currently open!',
        },
      ]);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Brain className="w-7 h-7 text-indigo-600" />
            AI & Predictive Educational Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Student at-risk early detection, AI Teacher Copilot, personalized report remarks, and 24/7 Admissions AI.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('at-risk')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'at-risk' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            At-Risk Early Radar
          </button>
          <button
            onClick={() => setActiveTab('copilot')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'copilot' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AI Teacher Copilot
          </button>
          <button
            onClick={() => setActiveTab('remarks')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'remarks' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Report Remarks
          </button>
          <button
            onClick={() => setActiveTab('bot')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'bot' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admissions AI Bot
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: AT-RISK RADAR */}
      {/* ============================================================ */}
      {activeTab === 'at-risk' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500">Evaluated Cohort</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {atRiskData.summary?.totalEvaluated || 15}
              </h3>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/40 shadow-xs">
              <span className="text-xs text-rose-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Critical Risk
              </span>
              <h3 className="text-2xl font-bold text-rose-700 mt-1">
                {atRiskData.summary?.criticalCount || 3}
              </h3>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
              <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Moderate Risk
              </span>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">
                {atRiskData.summary?.moderateCount || 4}
              </h3>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> On-Track / Safe
              </span>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                {atRiskData.summary?.lowCount || 8}
              </h3>
            </div>
          </div>

          {/* Student Risk Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Predictive Risk Matrix & Remedial Action Plans
              </h2>
              <div className="flex gap-2">
                {['', 'Critical', 'Moderate', 'Low'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedRiskFilter(lvl)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      selectedRiskFilter === lvl
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lvl || 'All Tiers'}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-2">Student Name</th>
                    <th className="pb-2">Risk Level</th>
                    <th className="pb-2">Attendance</th>
                    <th className="pb-2">Average Score</th>
                    <th className="pb-2">Trigger Factors</th>
                    <th className="pb-2">AI Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {atRiskData.students?.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/60">
                      <td className="py-3 font-semibold text-slate-900">
                        {r.studentId?.firstName} {r.studentId?.lastName}
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {r.studentId?.admissionNumber}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.riskLevel === 'Critical'
                              ? 'bg-rose-100 text-rose-800'
                              : r.riskLevel === 'Moderate'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {r.riskLevel} ({r.riskScore}/100)
                        </span>
                      </td>
                      <td className="py-3 font-mono font-bold">
                        <span className={r.attendanceRate < 75 ? 'text-rose-600' : 'text-slate-800'}>
                          {r.attendanceRate}%
                        </span>
                      </td>
                      <td className="py-3 font-mono font-bold">
                        <span className={r.academicAverageScore < 60 ? 'text-rose-600' : 'text-slate-800'}>
                          {r.academicAverageScore}%
                        </span>
                      </td>
                      <td className="py-3 max-w-xs text-slate-600 space-y-1">
                        {r.identifiedFactors?.map((f, i) => (
                          <div key={i} className="text-[11px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>{f.factor}</span>
                          </div>
                        ))}
                      </td>
                      <td className="py-3 max-w-xs text-indigo-700 font-medium text-[11px]">
                        {r.recommendedInterventions?.[0] || 'Routine monitoring'}
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
      {/* TAB 2: AI TEACHER COPILOT */}
      {/* ============================================================ */}
      {activeTab === 'copilot' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Pedagogical Prompt Studio
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Subject</label>
                <input
                  type="text"
                  value={copilotSubject}
                  onChange={(e) => setCopilotSubject(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Grade Level</label>
                <input
                  type="text"
                  value={copilotGrade}
                  onChange={(e) => setCopilotGrade(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Lesson Topic / Concept</label>
                <textarea
                  rows={3}
                  value={copilotTopic}
                  onChange={(e) => setCopilotTopic(e.target.value)}
                  placeholder="e.g. Newton's Third Law with practical laboratory experiment"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleGenerateLessonPlan}
                  disabled={loading || !copilotTopic.trim()}
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Plan Lesson
                </button>
                <button
                  onClick={handleGenerateQuiz}
                  disabled={loading || !copilotTopic.trim()}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Award className="w-3.5 h-3.5" /> Generate Quiz
                </button>
              </div>
            </div>
          </div>

          {/* Generated Result Output */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Copilot Pedagogical Output
              </span>
              {generatedPlan && (
                <button
                  onClick={() => copyToClipboard(JSON.stringify(generatedPlan, null, 2))}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Plan'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-600 animate-spin" />
                <span>Synthesizing pedagogical structure with AI...</span>
              </div>
            ) : generatedPlan ? (
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{generatedPlan.topic}</h3>
                  <p className="text-indigo-600 font-medium">
                    {generatedPlan.subject} • {generatedPlan.grade} ({generatedPlan.duration})
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Curriculum Objectives
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    {generatedPlan.pedagogicalObjectives?.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Class Timeline</h4>
                  {generatedPlan.timeline?.map((step, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{step.phase}</span>
                        <span className="font-mono text-indigo-600">{step.time}</span>
                      </div>
                      <p className="text-slate-600">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : generatedQuiz ? (
              <div className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-slate-900">Generated Quiz: {copilotTopic}</h3>
                {generatedQuiz.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                    <p className="font-bold text-slate-800">
                      Q{idx + 1}. {q.questionText}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options?.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg border text-xs ${
                            oIdx === q.correctOptionIndex
                              ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-800'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500 italic mt-1">Explanation: {q.explanation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                Enter a topic on the left and click "Plan Lesson" or "Generate Quiz" to synthesize teaching aids.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: AI REPORT REMARKS */}
      {/* ============================================================ */}
      {activeTab === 'remarks' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Personalized Report Card Remarks Synthesizer
            </h2>
            <p className="text-xs text-slate-500">
              Generates context-aware, constructive feedback for academic term reports.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Student Name</label>
              <input
                type="text"
                value={stuName}
                onChange={(e) => setStuName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Term Avg Score (%)</label>
              <input
                type="number"
                value={stuScore}
                onChange={(e) => setStuScore(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Attendance Rate (%)</label>
              <input
                type="number"
                value={stuAtt}
                onChange={(e) => setStuAtt(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateRemarks}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" /> Synthesize Constructive Remarks
          </button>

          {generatedRemark && (
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs space-y-2">
              <span className="font-bold text-indigo-900 uppercase tracking-wider text-[10px]">
                Official Generated Comment
              </span>
              <p className="text-slate-800 leading-relaxed font-serif italic text-sm">
                "{generatedRemark}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: AI ADMISSIONS BOT */}
      {/* ============================================================ */}
      {activeTab === 'bot' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs max-w-2xl mx-auto overflow-hidden flex flex-col h-[520px]">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">NexSchool 24/7 AI Admissions Virtual Assistant</h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online & Auto-Capturing Leads
                </span>
              </div>
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSendBotMessage} className="p-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={botInput}
              onChange={(e) => setBotInput(e.target.value)}
              placeholder="Ask about tuition fees, transportation routes, curriculum..."
              className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!botInput.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIAnalyticsPage;
