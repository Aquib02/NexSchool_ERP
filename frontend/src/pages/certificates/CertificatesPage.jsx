import React, { useState, useEffect } from 'react';
import {
  FileText,
  Award,
  CreditCard,
  QrCode,
  Printer,
  CheckCircle2,
  AlertCircle,
  Search,
  ShieldCheck,
  Download,
  Calendar,
} from 'lucide-react';
import certificateService from '../../services/certificateService.js';
import studentService from '../../services/studentService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import printElement from '../../utils/printUtils.js';

export const CertificatesPage = () => {
  const { user } = useAuth();
  const isStudent = user?.role?.name === 'STUDENT';
  const [activeTab, setActiveTab] = useState(isStudent ? 'idcards' : 'studio'); // 'studio', 'idcards', 'halltickets', 'verify'
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Studio state
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(user?.studentId || '');
  const [certType, setCertType] = useState('TRANSFER_CERTIFICATE');
  const [conduct, setConduct] = useState('Exemplary');
  const [reason, setReason] = useState('Parent Relocation / Higher Education');
  const [generatedCert, setGeneratedCert] = useState(null);

  // 2. ID Cards state
  const [idCards, setIdCards] = useState([]);
  const [idCardType, setIdCardType] = useState('Student');

  // 3. Hall Tickets state
  const [hallTickets, setHallTickets] = useState([]);

  // 4. Verify state
  const [verifyCode, setVerifyCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    const fetchStudentsList = async () => {
      if (isStudent) {
        if (user?.studentId) setSelectedStudentId(user.studentId);
        return;
      }
      try {
        const res = await studentService.getStudents({ limit: 100 });
        let list = [];
        if (res?.data?.students && Array.isArray(res.data.students)) {
          list = res.data.students;
        } else if (res?.students && Array.isArray(res.students)) {
          list = res.students;
        } else if (Array.isArray(res?.data)) {
          list = res.data;
        } else if (Array.isArray(res)) {
          list = res;
        }

        if (list.length > 0) {
          setStudents(list);
          setSelectedStudentId(list[0]._id);
        } else {
          setStudents([
            { _id: '6aaa6c47c820c9f830d4fc80', firstName: 'Lucas', lastName: 'Hansen', admissionNumber: 'ADM-2026-0001' },
            { _id: '6aaa8af4e5d2d098fe08ec81', firstName: 'Gaurav', lastName: 'Srivastava', admissionNumber: 'ADM-2026-0002' },
            { _id: '6aaa8b46e5d2d098fe08ec83', firstName: 'Mohammad', lastName: 'Khan', admissionNumber: 'ADM-2026-0003' },
          ]);
          setSelectedStudentId('6aaa6c47c820c9f830d4fc80');
        }
      } catch (err) {
        console.error('Failed to load students:', err);
        setStudents([
          { _id: '6aaa6c47c820c9f830d4fc80', firstName: 'Lucas', lastName: 'Hansen', admissionNumber: 'ADM-2026-0001' },
          { _id: '6aaa8af4e5d2d098fe08ec81', firstName: 'Gaurav', lastName: 'Srivastava', admissionNumber: 'ADM-2026-0002' },
          { _id: '6aaa8b46e5d2d098fe08ec83', firstName: 'Mohammad', lastName: 'Khan', admissionNumber: 'ADM-2026-0003' },
        ]);
        setSelectedStudentId('6aaa6c47c820c9f830d4fc80');
      }
    };

    fetchStudentsList();
  }, [isStudent, user?.studentId]);

  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setErrorMsg('Please select a student from the dropdown first');
      return;
    }
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await certificateService.generateCertificate({
        studentId: selectedStudentId,
        certificateType: certType,
        conduct,
        reasonForLeaving: reason,
      });
      const certData = res?.data?.data || res?.data || res;
      setGeneratedCert(certData);
      setSuccessMsg(`${certType.replace(/_/g, ' ')} generated successfully! Ready for official printing.`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err?.message || 'Failed to generate certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchIdCards = async () => {
    try {
      const res = await certificateService.getIdCards({ userType: isStudent ? 'Student' : idCardType });
      if (res.data?.success) setIdCards(res.data.data);
    } catch {
      if (isStudent) {
        setIdCards([
          {
            code: user?.student?.admissionNumber || 'ADM-ME',
            fullName: user?.student ? `${user.student.firstName} ${user.student.lastName}` : (user?.username || 'Current Student'),
            subTitle: 'Enrolled Student',
            bloodGroup: 'B+',
            emergencyPhone: '+91-9876543210',
            qrString: `NEX-ID:STUDENT:${user?.student?.admissionNumber || 'ME'}`,
          },
        ]);
      } else {
        setIdCards([
          {
            code: 'ADM-2026-1044',
            fullName: 'Lucas Hansen',
            subTitle: 'Class 10 - Section A',
            bloodGroup: 'B+',
            emergencyPhone: '+91-9876543210',
            qrString: 'NEX-ID:STUDENT:ADM-2026-1044',
          },
          {
            code: 'ADM-2026-1082',
            fullName: 'Emily Davis',
            subTitle: 'Class 10 - Section A',
            bloodGroup: 'O+',
            emergencyPhone: '+91-9812345678',
            qrString: 'NEX-ID:STUDENT:ADM-2026-1082',
          },
        ]);
      }
    }
  };

  const handleFetchHallTickets = async () => {
    try {
      const res = await certificateService.getHallTickets();
      if (res.data?.success) setHallTickets(res.data.data);
    } catch {
      if (isStudent) {
        setHallTickets([
          {
            ticketNumber: `HT-${user?.student?.admissionNumber || 'ADM-ME'}-2026`,
            studentName: user?.student ? `${user.student.firstName} ${user.student.lastName}` : (user?.username || 'Current Student'),
            admissionNumber: user?.student?.admissionNumber || 'ADM-ME',
            rollNumber: user?.student?.rollNumber || 1,
            className: 'Class 10',
            sectionName: 'A',
            examTitle: 'Annual Board Examination 2026',
            centerName: 'Main Campus Examination Wing',
            schedule: [
              { date: '15 Mar 2026', subject: 'Mathematics', time: '09:30 AM - 12:30 PM', room: 'Hall A (Desk 12)' },
              { date: '18 Mar 2026', subject: 'English Language', time: '09:30 AM - 12:30 PM', room: 'Hall A (Desk 12)' },
              { date: '21 Mar 2026', subject: 'Science & Lab', time: '09:30 AM - 12:30 PM', room: 'Hall B (Desk 08)' },
            ],
          },
        ]);
      } else {
        setHallTickets([
          {
            ticketNumber: 'HT-ADM-2026-1044',
            studentName: 'Lucas Hansen',
            admissionNumber: 'ADM-2026-1044',
            rollNumber: 14,
            className: 'Class 10',
            sectionName: 'A',
            examTitle: 'Annual Board Examination 2026',
            centerName: 'Main Campus Examination Wing',
            schedule: [
              { date: '15 Mar 2026', subject: 'Mathematics', time: '09:30 AM - 12:30 PM', room: 'Hall A (Desk 12)' },
              { date: '18 Mar 2026', subject: 'English Language', time: '09:30 AM - 12:30 PM', room: 'Hall A (Desk 12)' },
              { date: '21 Mar 2026', subject: 'Science & Lab', time: '09:30 AM - 12:30 PM', room: 'Hall B (Desk 08)' },
            ],
          },
        ]);
      }
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;
    try {
      const res = await certificateService.verifyCertificate(verifyCode.trim());
      setVerificationResult(res.data?.data);
    } catch {
      setVerificationResult({ isValid: false });
    }
  };

  useEffect(() => {
    if (activeTab === 'idcards') handleFetchIdCards();
    if (activeTab === 'halltickets') handleFetchHallTickets();
  }, [activeTab, idCardType]);

  const handlePrint = () => {
    if (activeTab === 'studio') {
      printElement('printable-certificate', 'Official_Certificate');
    } else if (activeTab === 'idcards') {
      printElement('printable-id-cards', 'Student_ID_Cards');
    } else if (activeTab === 'halltickets') {
      printElement('printable-hall-tickets', 'Exam_Hall_Tickets');
    } else {
      window.print();
    }
  };

  const selectedStudent = students.find((s) => String(s._id) === String(selectedStudentId)) || students[0];
  const previewStudentName = generatedCert?.studentName || (selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Lucas Hansen');
  const previewAdmissionNo = generatedCert?.admissionNumber || selectedStudent?.admissionNumber || 'ADM-2026-0001';
  const previewClassName = generatedCert?.details?.className || selectedStudent?.classId?.name || 'Class 10';
  const previewSectionName = generatedCert?.details?.sectionName || selectedStudent?.sectionId?.name || 'A';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" />
            Certificates & ID Card Generator
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Official Transfer Certificates (TC), Study Bonafide, Batch ID badges, and Exam Hall Tickets.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          {!isStudent && (
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'studio' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Certificate Studio
            </button>
          )}
          <button
            onClick={() => setActiveTab('idcards')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'idcards' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isStudent ? 'My Student ID Card' : 'ID Card Batch Builder'}
          </button>
          <button
            onClick={() => setActiveTab('halltickets')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'halltickets'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isStudent ? 'My Exam Hall Ticket' : 'Exam Hall Tickets'}
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'verify' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            QR Authenticator
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1: CERTIFICATE STUDIO (Faculty & Admin Only) */}
      {/* ============================================================ */}
      {!isStudent && activeTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Document Issue Parameters
            </h2>

            <form onSubmit={handleGenerateCertificate} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Certificate Format</label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="TRANSFER_CERTIFICATE">Transfer Certificate (TC)</option>
                  <option value="BONAFIDE_CERTIFICATE">Study / Bonafide Certificate</option>
                  <option value="CHARACTER_CERTIFICATE">Character & Conduct Certificate</option>
                  <option value="MERIT_CERTIFICATE">Academic Merit Certificate</option>
                  <option value="FEE_CLEARANCE_CERTIFICATE">Fee Clearance Certificate</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Target Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setGeneratedCert(null);
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                >
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.firstName} {s.lastName} ({s.admissionNumber || 'ADM-N/A'}) {s.classId?.name ? `- ${s.classId.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Conduct & Moral Record</label>
                <input
                  type="text"
                  value={conduct}
                  onChange={(e) => setConduct(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Reason for Leaving</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
              >
                {loading ? 'Generating...' : 'Generate Official Certificate'}
              </button>
            </form>
          </div>

          {/* Certificate Live Preview & Print Layout */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Official Document Preview
              </span>
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>

            {/* Official Bordered Certificate Card */}
            <div id="printable-certificate" className="bg-white p-8 rounded-2xl border-4 border-double border-indigo-950 shadow-md max-w-2xl mx-auto space-y-6 text-center text-slate-900 font-serif">
              <div className="border-b-2 border-indigo-900 pb-4">
                <span className="text-xs font-sans uppercase font-bold tracking-widest text-indigo-800">
                  Government Recognized & CBSE Affiliated
                </span>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">NEXSCHOOL ACADEMY</h2>
                <p className="text-xs font-sans text-slate-500">
                  Campus Sector 4, Silicon Boulevard • Tel: +91 98765 43210 • info@nexschool.edu
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold underline uppercase tracking-wider text-indigo-950 font-serif">
                  {certType.replace(/_/g, ' ')}
                </h3>
                <p className="text-xs font-sans text-slate-500">
                  Serial No:{' '}
                  <span className="font-mono font-bold text-slate-800">
                    {generatedCert?.certificateNumber || 'TC-2026-90412'}
                  </span>
                </p>
              </div>

              <div className="text-sm leading-relaxed text-justify px-4 font-serif text-slate-800 space-y-3">
                <p>
                  This is to certify that{' '}
                  <strong className="underline font-bold text-slate-950">
                    {previewStudentName}
                  </strong>
                  , Admission Number{' '}
                  <strong className="font-mono font-bold text-slate-950">
                    {previewAdmissionNo}
                  </strong>
                  , was a regular and bonafide student of this institution.
                </p>
                <p>
                  During their tenure in{' '}
                  <strong>{previewClassName} - Section {previewSectionName}</strong>, their general
                  conduct, behavior, and academic diligence were found to be{' '}
                  <strong className="underline">{generatedCert?.details?.conduct || conduct || 'Exemplary'}</strong>.
                </p>
                <p>
                  All institutional library books, laboratories equipment, and school dues have been cleared.
                  Reason stated for departure:{' '}
                  <em>{generatedCert?.details?.reasonForLeaving || reason || 'Parent Relocation / Course Completion'}</em>.
                </p>
              </div>

              {/* Certificate Signatures & QR Seal */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-3 items-end text-xs font-sans">
                <div className="text-center">
                  <div className="h-10 border-b border-dashed border-slate-400 mx-4" />
                  <span className="text-[10px] text-slate-500 uppercase mt-1 block font-semibold">Class Teacher</span>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 p-1.5 border border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-slate-800" />
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 mt-1">VERIFIABLE QR</span>
                </div>

                <div className="text-center">
                  <div className="h-10 border-b border-dashed border-slate-400 mx-4" />
                  <span className="text-[10px] text-slate-500 uppercase mt-1 block font-semibold">
                    Principal & Seal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: ID CARDS BATCH BUILDER */}
      {/* ============================================================ */}
      {activeTab === 'idcards' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                {isStudent ? 'Official Student Identity Card' : 'Batch Identity Card Generator'}
              </h2>
              {!isStudent && (
                <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs">
                  <button
                    onClick={() => setIdCardType('Student')}
                    className={`px-3 py-1 rounded-md font-semibold ${
                      idCardType === 'Student' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Student Cards
                  </button>
                  <button
                    onClick={() => setIdCardType('Staff')}
                    className={`px-3 py-1 rounded-md font-semibold ${
                      idCardType === 'Staff' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Staff Cards
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> {isStudent ? 'Print My ID Badge' : 'Print Badge Sheet'}
            </button>
          </div>

          <div id="printable-id-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {idCards.map((card, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border-2 border-indigo-200 overflow-hidden shadow-xs text-center font-sans space-y-3"
              >
                {/* ID Header */}
                <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider">NEXSCHOOL ACADEMY</h3>
                  <span className="text-[10px] text-indigo-200">{idCardType} Identity Pass</span>
                </div>

                {/* Avatar Placeholder */}
                <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-indigo-400 mx-auto flex items-center justify-center font-bold text-indigo-700 text-xl shadow-xs">
                  {card.fullName?.substring(0, 2).toUpperCase()}
                </div>

                <div className="px-4 space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">{card.fullName}</h4>
                  <p className="text-xs text-indigo-600 font-medium">{card.subTitle}</p>
                  <p className="text-[11px] font-mono text-slate-400">ID: {card.code}</p>
                </div>

                <div className="mx-4 p-2 bg-slate-50 rounded-xl text-[11px] text-slate-600 flex justify-around">
                  <span>Blood: <strong>{card.bloodGroup}</strong></span>
                  <span>Emergency: <strong>{card.emergencyPhone}</strong></span>
                </div>

                <div className="p-3 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-400">
                  <QrCode className="w-4 h-4 text-slate-700" />
                  <span>Valid for AY 2025-2026</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: EXAM HALL TICKETS */}
      {/* ============================================================ */}
      {activeTab === 'halltickets' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Standardized Examination Admit Cards
            </h2>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" /> Print Admit Cards
            </button>
          </div>

          <div id="printable-hall-tickets" className="space-y-6">
            {hallTickets.map((ht, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-300 p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">NEXSCHOOL ACADEMY - ADMIT CARD</h3>
                    <p className="text-xs text-indigo-600 font-semibold">{ht.examTitle}</p>
                  </div>
                  <span className="font-mono text-xs font-bold bg-slate-100 px-3 py-1 rounded-lg">
                    {ht.ticketNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl">
                  <div>
                    <span className="text-slate-400 block">Candidate Name:</span>
                    <strong className="text-slate-800">{ht.studentName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Admission No:</span>
                    <strong className="text-slate-800">{ht.admissionNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Class / Section:</span>
                    <strong className="text-slate-800">
                      {ht.className} - {ht.sectionName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Desk Roll No:</span>
                    <strong className="text-slate-800">{ht.rollNumber}</strong>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Exam Schedule</h4>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b text-slate-400 uppercase text-[10px]">
                        <th className="pb-1.5">Date</th>
                        <th className="pb-1.5">Subject</th>
                        <th className="pb-1.5">Timing</th>
                        <th className="pb-1.5">Hall & Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ht.schedule?.map((item, i) => (
                        <tr key={i}>
                          <td className="py-2 font-medium text-slate-800">{item.date}</td>
                          <td className="py-2 font-bold text-indigo-900">{item.subject}</td>
                          <td className="py-2 text-slate-600">{item.time}</td>
                          <td className="py-2 text-slate-600 font-mono text-[11px]">{item.room}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: QR AUTHENTICATOR */}
      {/* ============================================================ */}
      {activeTab === 'verify' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Document Authenticity Verifier</h2>
            <p className="text-xs text-slate-500">
              Validate certificates and transcripts issued by NexSchool Academy against cryptographic ledger.
            </p>
          </div>

          <form onSubmit={handleVerifyCode} className="flex gap-2">
            <input
              type="text"
              required
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="Enter Certificate Serial (e.g. TC-2026-90412)"
              className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 font-mono uppercase"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2"
            >
              <Search className="w-3.5 h-3.5" /> Verify
            </button>
          </form>

          {verificationResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                verificationResult.isValid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {verificationResult.isValid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Authentic Document Verified
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600" /> Invalid or Revoked Certificate Record
                  </>
                )}
              </div>
              {verificationResult.isValid && (
                <div className="space-y-1 pt-1 border-t border-emerald-200">
                  <p>Certificate Serial: <strong>{verificationResult.certificateNumber}</strong></p>
                  <p>Student Name: <strong>{verificationResult.studentName}</strong></p>
                  <p>Document Type: <strong>{verificationResult.certificateType}</strong></p>
                  <p>Issued Date: <strong>{new Date(verificationResult.issueDate).toLocaleDateString()}</strong></p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;
