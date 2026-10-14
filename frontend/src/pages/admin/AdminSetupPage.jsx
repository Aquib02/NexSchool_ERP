import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  School,
  Calendar,
  Layers,
  BookOpen,
  Building2,
  Bell,
  Plus,
  CheckCircle,
  Clock,
  Trash2,
  Users,
  Check,
  UserCheck,
  MapPin,
  Bookmark,
  FileText,
  Settings,
  ChevronRight,
  AlertCircle,
  Printer,
  Sparkles,
  X,
  Edit2,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import adminService from '../../services/adminService.js';
import { printElement } from '../../utils/printUtils.js';

export const AdminSetupPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'subjects' ? 'classes' : (searchParams.get('tab') || 'classes')
  );
  const [loading, setLoading] = useState(false);

  // State collections
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Legacy / Quick Modals
  const [modalType, setModalType] = useState(null); // 'section', 'subject', 'session', 'notice'

  // Standard simple forms
  const [sectionForm, setSectionForm] = useState({ name: '', classId: '', capacity: 40, roomNumber: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', classId: '', totalMarks: 100, passMarks: 40 });
  const [sessionForm, setSessionForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    status: 'completed',
  });
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', category: 'General', isPinned: false });

  // ==================== COMPREHENSIVE CLASS CONFIGURATION MODAL STATE ====================
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classModalTab, setClassModalTab] = useState('overview'); // 'overview' | 'sections' | 'subjects' | 'books'
  const [isSavingClass, setIsSavingClass] = useState(false);
  const [classLoadingDetails, setClassLoadingDetails] = useState(false);

  const initialClassConfig = {
    _id: null,
    name: '',
    code: '',
    numericOrder: 1,
    description: '',
    floorNumber: 'Ground Floor',
    building: 'Main Academic Block',
    roomNumber: '',
    classTeacherId: '',
    sections: [
      { name: 'A', capacity: 40, roomNumber: '', classTeacherId: '' }
    ],
    subjects: [
      { name: 'Mathematics', code: 'MTH', type: 'Core', totalMarks: 100, passMarks: 40, assignedTeacherId: '' },
      { name: 'Science', code: 'SCI', type: 'Core', totalMarks: 100, passMarks: 40, assignedTeacherId: '' },
      { name: 'English', code: 'ENG', type: 'Core', totalMarks: 100, passMarks: 40, assignedTeacherId: '' }
    ],
    books: [
      { title: '', subject: '', author: '', publisher: '', isbn: '', isRequired: true }
    ],
    deletedSectionIds: [],
    deletedSubjectIds: [],
  };

  const [comprehensiveForm, setComprehensiveForm] = useState(initialClassConfig);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab === 'subjects' ? 'classes' : tab);
    }
  }, [searchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessRes, clsRes, secRes, subRes, deptRes, notRes, teachRes] = await Promise.all([
        adminService.getSessions().catch(() => ({ data: [] })),
        adminService.getClasses().catch(() => ({ data: [] })),
        adminService.getSections().catch(() => ({ data: [] })),
        adminService.getSubjects().catch(() => ({ data: [] })),
        adminService.getDepartments().catch(() => ({ data: [] })),
        adminService.getNotices().catch(() => ({ data: [] })),
        adminService.getTeachers().catch(() => ({ data: [] })),
      ]);

      setSessions(sessRes.data || []);
      setClasses(clsRes.data || []);
      setSections(secRes.data || []);
      setSubjects(subRes.data || []);
      setDepartments(deptRes.data || []);
      setNotices(notRes.data || []);
      setTeachers(teachRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==================== COMPREHENSIVE CLASS OPEN / EDIT HANDLER ====================
  const handleOpenClassConfig = async (cls = null) => {
    setClassModalTab('overview');
    if (cls) {
      setIsClassModalOpen(true);
      setClassLoadingDetails(true);
      try {
        // Fast local population
        const clsSections = sections.filter((s) => (s.classId?._id || s.classId) === cls._id);
        const clsSubjects = subjects.filter((s) => (s.classId?._id || s.classId) === cls._id);

        setComprehensiveForm({
          _id: cls._id,
          name: cls.name || '',
          code: cls.code || '',
          numericOrder: cls.numericOrder || 1,
          description: cls.description || '',
          floorNumber: cls.floorNumber || '',
          building: cls.building || '',
          roomNumber: cls.roomNumber || '',
          classTeacherId: cls.classTeacherId?._id || cls.classTeacherId || '',
          sections: clsSections.map((s) => ({
            _id: s._id,
            name: s.name,
            capacity: s.capacity || 40,
            roomNumber: s.roomNumber || '',
            classTeacherId: s.classTeacherId?._id || s.classTeacherId || '',
          })),
          subjects: clsSubjects.map((sub) => ({
            _id: sub._id,
            name: sub.name,
            code: sub.code,
            type: sub.type || 'Core',
            totalMarks: sub.totalMarks || 100,
            passMarks: sub.passMarks || 40,
            assignedTeacherId: sub.assignedTeacherIds?.[0]?._id || sub.assignedTeacherIds?.[0] || '',
          })),
          books: Array.isArray(cls.books) && cls.books.length > 0 ? cls.books : [],
          deletedSectionIds: [],
          deletedSubjectIds: [],
        });

        // Fetch fresh populated comprehensive details from API
        const res = await adminService.getComprehensiveClass(cls._id);
        if (res?.data) {
          const { schoolClass, sections: freshSections, subjects: freshSubjects, books: freshBooks } = res.data;
          setComprehensiveForm((prev) => ({
            ...prev,
            name: schoolClass.name || prev.name,
            code: schoolClass.code || prev.code,
            numericOrder: schoolClass.numericOrder ?? prev.numericOrder,
            description: schoolClass.description || prev.description,
            floorNumber: schoolClass.floorNumber || prev.floorNumber,
            building: schoolClass.building || prev.building,
            roomNumber: schoolClass.roomNumber || prev.roomNumber,
            classTeacherId: schoolClass.classTeacherId?._id || schoolClass.classTeacherId || prev.classTeacherId,
            sections: freshSections && freshSections.length > 0
              ? freshSections.map((s) => ({
                  _id: s._id,
                  name: s.name,
                  capacity: s.capacity || 40,
                  roomNumber: s.roomNumber || '',
                  classTeacherId: s.classTeacherId?._id || s.classTeacherId || '',
                }))
              : prev.sections,
            subjects: freshSubjects && freshSubjects.length > 0
              ? freshSubjects.map((sub) => ({
                  _id: sub._id,
                  name: sub.name,
                  code: sub.code,
                  type: sub.type || 'Core',
                  totalMarks: sub.totalMarks || 100,
                  passMarks: sub.passMarks || 40,
                  assignedTeacherId: sub.assignedTeacherIds?.[0]?._id || sub.assignedTeacherIds?.[0] || '',
                }))
              : prev.subjects,
            books: Array.isArray(freshBooks) ? freshBooks : (Array.isArray(schoolClass.books) ? schoolClass.books : prev.books),
          }));
        }
      } catch (err) {
        console.warn('Could not fetch latest class details from server, using existing state:', err);
      } finally {
        setClassLoadingDetails(false);
      }
    } else {
      // Adding new class
      const nextOrder = classes.length > 0 ? Math.max(...classes.map((c) => Number(c.numericOrder) || 0)) + 1 : 1;
      setComprehensiveForm({
        _id: null,
        name: '',
        code: '',
        numericOrder: nextOrder,
        description: '',
        floorNumber: 'Ground Floor',
        building: 'Main Academic Block',
        roomNumber: '',
        classTeacherId: '',
        sections: [
          { name: 'A', capacity: 40, roomNumber: '', classTeacherId: '' }
        ],
        subjects: [
          { name: 'Mathematics', code: `MTH-${nextOrder}`, type: 'Core', totalMarks: 100, passMarks: 40, assignedTeacherId: '' },
          { name: 'Science', code: `SCI-${nextOrder}`, type: 'Core', totalMarks: 100, passMarks: 40, assignedTeacherId: '' },
          { name: 'English', code: `ENG-${nextOrder}`, type: 'Core', totalMarks: 100, passMarks: 40, assignedTeacherId: '' }
        ],
        books: [
          { title: '', subject: '', author: '', publisher: '', isbn: '', isRequired: true }
        ],
        deletedSectionIds: [],
        deletedSubjectIds: [],
      });
      setIsClassModalOpen(true);
    }
  };

  // ==================== SECTION ROW HANDLERS ====================
  const handleAddSectionRow = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const existingNames = comprehensiveForm.sections.map((s) => s.name?.toUpperCase());
    let nextLetter = 'A';
    for (let i = 0; i < alphabet.length; i++) {
      if (!existingNames.includes(alphabet[i])) {
        nextLetter = alphabet[i];
        break;
      }
    }
    setComprehensiveForm((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          name: nextLetter,
          capacity: 40,
          roomNumber: prev.roomNumber ? `${prev.roomNumber}-${nextLetter}` : '',
          classTeacherId: '',
        },
      ],
    }));
  };

  const handleRemoveSectionRow = (index) => {
    const target = comprehensiveForm.sections[index];
    setComprehensiveForm((prev) => {
      const updated = [...prev.sections];
      updated.splice(index, 1);
      const deletedIds = target?._id ? [...(prev.deletedSectionIds || []), target._id] : prev.deletedSectionIds;
      return {
        ...prev,
        sections: updated,
        deletedSectionIds: deletedIds,
      };
    });
  };

  const handleUpdateSectionRow = (index, field, value) => {
    setComprehensiveForm((prev) => {
      const updated = [...prev.sections];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, sections: updated };
    });
  };

  // ==================== SUBJECT ROW HANDLERS ====================
  const handleAddSubjectRow = () => {
    setComprehensiveForm((prev) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        {
          name: '',
          code: '',
          type: 'Core',
          totalMarks: 100,
          passMarks: 40,
          assignedTeacherId: '',
        },
      ],
    }));
  };

  const handleRemoveSubjectRow = (index) => {
    const target = comprehensiveForm.subjects[index];
    setComprehensiveForm((prev) => {
      const updated = [...prev.subjects];
      updated.splice(index, 1);
      const deletedIds = target?._id ? [...(prev.deletedSubjectIds || []), target._id] : prev.deletedSubjectIds;
      return {
        ...prev,
        subjects: updated,
        deletedSubjectIds: deletedIds,
      };
    });
  };

  const handleUpdateSubjectRow = (index, field, value) => {
    setComprehensiveForm((prev) => {
      const updated = [...prev.subjects];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, subjects: updated };
    });
  };

  // ==================== BOOK ROW HANDLERS ====================
  const handleAddBookRow = () => {
    setComprehensiveForm((prev) => ({
      ...prev,
      books: [
        ...prev.books,
        {
          title: '',
          subject: '',
          author: '',
          publisher: '',
          isbn: '',
          isRequired: true,
        },
      ],
    }));
  };

  const handleRemoveBookRow = (index) => {
    setComprehensiveForm((prev) => {
      const updated = [...prev.books];
      updated.splice(index, 1);
      return { ...prev, books: updated };
    });
  };

  const handleUpdateBookRow = (index, field, value) => {
    setComprehensiveForm((prev) => {
      const updated = [...prev.books];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, books: updated };
    });
  };

  const handlePrintBookList = () => {
    printElement('class-book-list-printable', `${comprehensiveForm.name || 'Class'}_Prescribed_Books_List`);
  };

  // ==================== EXCEL IMPORT / TEMPLATE EXPORT ====================
  const subjectFileInputRef = useRef(null);
  const bookFileInputRef = useRef(null);

  const handleDownloadSubjectTemplate = () => {
    const sampleData = [
      {
        'Subject Name': 'Mathematics',
        'Subject Code': comprehensiveForm.code ? `${comprehensiveForm.code}-MTH` : 'MTH-101',
        'Type': 'Core',
        'Total Marks': 100,
        'Pass Marks': 40,
        'Assigned Teacher': teachers[0] ? `${teachers[0].firstName} ${teachers[0].lastName}` : '',
      },
      {
        'Subject Name': 'Science',
        'Subject Code': comprehensiveForm.code ? `${comprehensiveForm.code}-SCI` : 'SCI-101',
        'Type': 'Core',
        'Total Marks': 100,
        'Pass Marks': 40,
        'Assigned Teacher': teachers[1] ? `${teachers[1].firstName} ${teachers[1].lastName}` : '',
      },
      {
        'Subject Name': 'English Literature',
        'Subject Code': comprehensiveForm.code ? `${comprehensiveForm.code}-ENG` : 'ENG-101',
        'Type': 'Language',
        'Total Marks': 100,
        'Pass Marks': 40,
        'Assigned Teacher': '',
      },
      {
        'Subject Name': 'Social Studies',
        'Subject Code': comprehensiveForm.code ? `${comprehensiveForm.code}-SST` : 'SST-101',
        'Type': 'Core',
        'Total Marks': 100,
        'Pass Marks': 40,
        'Assigned Teacher': '',
      },
      {
        'Subject Name': 'Information Technology',
        'Subject Code': comprehensiveForm.code ? `${comprehensiveForm.code}-IT` : 'IT-101',
        'Type': 'Practical',
        'Total Marks': 100,
        'Pass Marks': 40,
        'Assigned Teacher': '',
      },
      {
        'Subject Name': 'Hindi Language',
        'Subject Code': comprehensiveForm.code ? `${comprehensiveForm.code}-HIN` : 'HIN-101',
        'Type': 'Language',
        'Total Marks': 100,
        'Pass Marks': 40,
        'Assigned Teacher': '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Subjects');
    const fileName = `${(comprehensiveForm.name || 'Class').replace(/\s+/g, '_')}_Subjects_Template.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleImportSubjectExcel = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          alert('The uploaded Excel sheet contains no data rows.');
          return;
        }

        const importedSubjects = [];
        let skippedCount = 0;

        jsonRows.forEach((row, rowIdx) => {
          // Identify Subject Name
          const nameKey = Object.keys(row).find((k) =>
            /subject\s*name|subject_name|^name$|^subject$/i.test(k.trim())
          );
          const nameVal = nameKey ? String(row[nameKey]).trim() : '';

          if (!nameVal) {
            skippedCount++;
            return;
          }

          // Identify Subject Code
          const codeKey = Object.keys(row).find((k) =>
            /subject\s*code|subject_code|^code$/i.test(k.trim())
          );
          let codeVal = codeKey ? String(row[codeKey]).trim().toUpperCase() : '';
          if (!codeVal) {
            codeVal = `${nameVal.substring(0, 3).toUpperCase()}-${rowIdx + 1}`;
          }

          // Identify Type
          const typeKey = Object.keys(row).find((k) => /type|category/i.test(k.trim()));
          let typeVal = typeKey ? String(row[typeKey]).trim() : 'Core';
          const validTypes = ['Core', 'Elective', 'Practical', 'Language', 'Vocational'];
          const matchedType = validTypes.find((t) => t.toLowerCase() === typeVal.toLowerCase());
          typeVal = matchedType || 'Core';

          // Identify Total Marks
          const totalKey = Object.keys(row).find((k) =>
            /total\s*marks|max\s*marks|full\s*marks|^total$/i.test(k.trim())
          );
          const totalVal = totalKey && !isNaN(Number(row[totalKey])) ? Number(row[totalKey]) : 100;

          // Identify Pass Marks
          const passKey = Object.keys(row).find((k) =>
            /pass\s*marks|passing\s*marks|^pass$/i.test(k.trim())
          );
          const passVal = passKey && !isNaN(Number(row[passKey])) ? Number(row[passKey]) : 40;

          // Match Faculty / Teacher
          const teacherKey = Object.keys(row).find((k) =>
            /teacher|instructor|faculty/i.test(k.trim())
          );
          let assignedTeacherId = '';
          if (teacherKey && row[teacherKey]) {
            const searchStr = String(row[teacherKey]).trim().toLowerCase();
            const matchedTeacher = teachers.find((t) => {
              const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
              const empId = (t.employeeId || '').toLowerCase();
              return (
                fullName.includes(searchStr) ||
                searchStr.includes(t.firstName.toLowerCase()) ||
                (empId && empId === searchStr)
              );
            });
            if (matchedTeacher) {
              assignedTeacherId = matchedTeacher._id;
            }
          }

          importedSubjects.push({
            name: nameVal,
            code: codeVal,
            type: typeVal,
            totalMarks: totalVal,
            passMarks: passVal,
            assignedTeacherId,
          });
        });

        if (importedSubjects.length === 0) {
          alert('Could not find any valid subject rows. Please ensure your sheet has a "Subject Name" column.');
          return;
        }

        const shouldReplace =
          comprehensiveForm.subjects.length > 0 &&
          window.confirm(
            `Do you want to REPLACE existing subjects with the ${importedSubjects.length} subjects from this Excel file?\n\n• Click OK to REPLACE all.\n• Click Cancel to APPEND to existing subjects.`
          );

        setComprehensiveForm((prev) => {
          let updatedSubjects;
          let deletedIds = prev.deletedSubjectIds || [];

          if (shouldReplace) {
            const existingWithId = prev.subjects.filter((s) => s._id).map((s) => s._id);
            deletedIds = [...deletedIds, ...existingWithId];
            updatedSubjects = importedSubjects;
          } else {
            updatedSubjects = [...prev.subjects, ...importedSubjects];
          }

          return {
            ...prev,
            subjects: updatedSubjects,
            deletedSubjectIds: deletedIds,
          };
        });

        alert(`✅ Successfully imported ${importedSubjects.length} subject(s) from Excel!`);
      } catch (err) {
        console.error('Excel import error:', err);
        alert('Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv document.');
      } finally {
        e.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDownloadBookTemplate = () => {
    const sampleData = [
      {
        'Book Title': 'NCERT Mathematics Class 9',
        'Subject': 'Mathematics',
        'Author': 'NCERT Editorial Board',
        'Publisher': 'NCERT New Delhi',
        'ISBN': '978-81-7450-489-0',
        'Required': 'Yes',
      },
      {
        'Book Title': 'Science Textbook for Class IX',
        'Subject': 'Science',
        'Author': 'NCERT Science Group',
        'Publisher': 'NCERT New Delhi',
        'ISBN': '978-81-7450-490-6',
        'Required': 'Yes',
      },
      {
        'Book Title': 'Beehive - English Literature',
        'Subject': 'English',
        'Author': 'NCERT Language Group',
        'Publisher': 'NCERT',
        'ISBN': '978-81-7450-512-5',
        'Required': 'Yes',
      },
      {
        'Book Title': 'Secondary School Mathematics Reference',
        'Subject': 'Mathematics',
        'Author': 'R.S. Aggarwal',
        'Publisher': 'Bharati Bhawan',
        'ISBN': '',
        'Required': 'No',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Books');
    const fileName = `${(comprehensiveForm.name || 'Class').replace(/\s+/g, '_')}_Books_Template.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleImportBookExcel = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          alert('The uploaded Excel sheet contains no data rows.');
          return;
        }

        const importedBooks = [];
        jsonRows.forEach((row) => {
          const titleKey = Object.keys(row).find((k) =>
            /book\s*title|title|^book$/i.test(k.trim())
          );
          const titleVal = titleKey ? String(row[titleKey]).trim() : '';
          if (!titleVal) return;

          const subjectKey = Object.keys(row).find((k) => /subject/i.test(k.trim()));
          const subjectVal = subjectKey ? String(row[subjectKey]).trim() : '';

          const authorKey = Object.keys(row).find((k) => /author/i.test(k.trim()));
          const authorVal = authorKey ? String(row[authorKey]).trim() : '';

          const pubKey = Object.keys(row).find((k) => /publisher|edition/i.test(k.trim()));
          const pubVal = pubKey ? String(row[pubKey]).trim() : '';

          const isbnKey = Object.keys(row).find((k) => /isbn|code/i.test(k.trim()));
          const isbnVal = isbnKey ? String(row[isbnKey]).trim() : '';

          const reqKey = Object.keys(row).find((k) => /required|mandatory/i.test(k.trim()));
          let reqVal = true;
          if (reqKey && row[reqKey] !== '') {
            const strVal = String(row[reqKey]).toLowerCase().trim();
            reqVal = strVal === 'yes' || strVal === 'true' || strVal === '1' || strVal === 'mandatory';
          }

          importedBooks.push({
            title: titleVal,
            subject: subjectVal,
            author: authorVal,
            publisher: pubVal,
            isbn: isbnVal,
            isRequired: reqVal,
          });
        });

        if (importedBooks.length === 0) {
          alert('Could not find any valid book rows. Please ensure your sheet has a "Book Title" column.');
          return;
        }

        const shouldReplace =
          comprehensiveForm.books.length > 0 &&
          window.confirm(
            `Do you want to REPLACE existing books with the ${importedBooks.length} book(s) from this Excel file?\n\n• Click OK to REPLACE all.\n• Click Cancel to APPEND to existing books.`
          );

        setComprehensiveForm((prev) => ({
          ...prev,
          books: shouldReplace ? importedBooks : [...prev.books, ...importedBooks],
        }));

        alert(`✅ Successfully imported ${importedBooks.length} book(s) from Excel!`);
      } catch (err) {
        console.error('Books Excel import error:', err);
        alert('Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv document.');
      } finally {
        e.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // ==================== SAVE COMPREHENSIVE CLASS ====================
  const handleSaveComprehensiveClass = async (e) => {
    if (e) e.preventDefault();
    if (!comprehensiveForm.name?.trim()) {
      alert('Please enter a Class Name (e.g. Class 10 or Grade 1)');
      setClassModalTab('overview');
      return;
    }
    if (!comprehensiveForm.code?.trim()) {
      alert('Please enter a Class Code (e.g. C10 or G1)');
      setClassModalTab('overview');
      return;
    }

    setIsSavingClass(true);
    try {
      const payload = {
        ...comprehensiveForm,
        name: comprehensiveForm.name.trim(),
        code: comprehensiveForm.code.trim().toUpperCase(),
        numericOrder: Number(comprehensiveForm.numericOrder) || 1,
        floorNumber: comprehensiveForm.floorNumber?.trim() || '',
        building: comprehensiveForm.building?.trim() || '',
        roomNumber: comprehensiveForm.roomNumber?.trim() || '',
        classTeacherId: comprehensiveForm.classTeacherId || null,
        sections: comprehensiveForm.sections
          .filter((s) => s.name?.trim())
          .map((s) => ({
            ...s,
            name: s.name.trim().toUpperCase(),
            capacity: Number(s.capacity) || 40,
            classTeacherId: s.classTeacherId || null,
            roomNumber: s.roomNumber?.trim() || '',
          })),
        subjects: comprehensiveForm.subjects
          .filter((sub) => sub.name?.trim() && sub.code?.trim())
          .map((sub) => ({
            ...sub,
            name: sub.name.trim(),
            code: sub.code.trim().toUpperCase(),
            type: sub.type || 'Core',
            totalMarks: Number(sub.totalMarks) || 100,
            passMarks: Number(sub.passMarks) || 40,
            assignedTeacherId: sub.assignedTeacherId || null,
          })),
        books: comprehensiveForm.books
          .filter((b) => b.title?.trim())
          .map((b) => ({
            ...b,
            title: b.title.trim(),
            subject: b.subject?.trim() || '',
            author: b.author?.trim() || '',
            publisher: b.publisher?.trim() || '',
            isbn: b.isbn?.trim() || '',
            isRequired: !!b.isRequired,
          })),
      };

      if (comprehensiveForm._id) {
        await adminService.updateClass(comprehensiveForm._id, payload);
      } else {
        await adminService.createClass(payload);
      }

      setIsClassModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to save class configuration');
    } finally {
      setIsSavingClass(false);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!classId) return;
    if (
      !confirm(
        'Are you sure you want to delete this class? This will also remove its associated sections and subjects. This cannot be undone.'
      )
    ) {
      return;
    }
    try {
      await adminService.deleteClass(classId);
      setIsClassModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete class');
    }
  };

  // Quick action handlers
  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      await adminService.createSection(sectionForm);
      setModalType(null);
      setSectionForm({ name: '', classId: '', capacity: 40, roomNumber: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create section');
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await adminService.createSubject(subjectForm);
      setModalType(null);
      setSubjectForm({ name: '', code: '', classId: '', totalMarks: 100, passMarks: 40 });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create subject');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      try {
        await adminService.deleteSubject(id);
        loadData();
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Failed to delete subject');
      }
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    try {
      await adminService.createNotice(noticeForm);
      setModalType(null);
      setNoticeForm({ title: '', content: '', category: 'General', isPinned: false });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to publish notice');
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await adminService.createSession(sessionForm);
      setModalType(null);
      setSessionForm({
        name: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        status: 'completed',
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create session');
    }
  };

  const handleSetCurrentSession = async (sess) => {
    try {
      await adminService.updateSession(sess._id, { isCurrent: true, status: 'active' });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to set active session');
    }
  };

  const handleDeleteNotice = async (id) => {
    if (confirm('Are you sure you want to delete this notice?')) {
      await adminService.deleteNotice(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">School Administration & Setup</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure classes, sections, curriculum subjects, books, academic sessions, and institutional circulars.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'classes', label: 'Classes & Sections', icon: Layers },
          { id: 'sessions', label: 'Academic Sessions', icon: Calendar },
          { id: 'departments', label: 'Departments', icon: Building2 },
          { id: 'notices', label: 'Notices & Circulars', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading setup data..." />
      ) : (
        <>
          {/* TAB 1: CLASSES & SECTIONS */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Classes & Assigned Sections</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any class card to configure its sections, subjects, textbooks, class teacher, and campus floor.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" icon={Plus} onClick={() => handleOpenClassConfig(null)}>
                    Add Class
                  </Button>
                  <Button variant="outline" size="sm" icon={Plus} onClick={() => setModalType('section')}>
                    Add Section
                  </Button>
                </div>
              </div>

              {classes.length === 0 ? (
                <EmptyState
                  title="No classes created yet"
                  description="Begin setting up the school by adding grades/classes with all curriculum details."
                  actionText="Add First Class"
                  onAction={() => handleOpenClassConfig(null)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {classes.map((cls) => {
                    const classSections = sections.filter(
                      (s) => (s.classId?._id || s.classId) === cls._id
                    );
                    const classSubjects = subjects.filter(
                      (s) => (s.classId?._id || s.classId) === cls._id
                    );
                    const teacher = teachers.find(
                      (t) => t._id === (cls.classTeacherId?._id || cls.classTeacherId)
                    );
                    const teacherName = teacher
                      ? `${teacher.firstName} ${teacher.lastName}`
                      : cls.classTeacherId?.firstName
                      ? `${cls.classTeacherId.firstName} ${cls.classTeacherId.lastName}`
                      : null;

                    return (
                      <Card
                        key={cls._id}
                        onClick={() => handleOpenClassConfig(cls)}
                        className="cursor-pointer border border-slate-200 hover:border-indigo-400 hover:shadow-xl group transition-all duration-200 transform hover:-translate-y-1 relative overflow-hidden bg-white flex flex-col justify-between"
                      >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 opacity-75 group-hover:opacity-100 transition-opacity" />

                        <div>
                          {/* Top Row: Code, Order, Settings Button */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                  {cls.code}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Order #{cls.numericOrder}
                                </span>
                              </div>
                              <h4 className="text-base font-bold text-slate-900 mt-2 group-hover:text-indigo-600 transition-colors">
                                {cls.name}
                              </h4>
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                {cls.description || 'General curriculum standard'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenClassConfig(cls);
                              }}
                              className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors shrink-0"
                              title="Configure Class & All Details"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Class Coordinator / Teacher */}
                          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2.5 text-xs">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Class Coordinator</p>
                              <p className="font-semibold text-slate-800 truncate">
                                {teacherName || <span className="text-slate-400 italic font-normal">Not Assigned</span>}
                              </p>
                            </div>
                          </div>

                          {/* Floor & Building Location */}
                          <div className="mt-2.5 flex items-center gap-2.5 text-xs text-slate-600">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] shrink-0">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Campus Floor / Wing</p>
                              <p className="font-medium text-slate-700 truncate">
                                {cls.floorNumber || 'Floor Unspecified'}
                                {cls.building ? ` • ${cls.building}` : ''}
                                {cls.roomNumber ? ` (${cls.roomNumber})` : ''}
                              </p>
                            </div>
                          </div>

                          {/* KPI Chips */}
                          <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
                            <div className="bg-slate-50/80 rounded-lg p-1.5 border border-slate-100">
                              <p className="text-[10px] text-slate-400">Sections</p>
                              <p className="text-xs font-bold text-slate-800">{classSections.length}</p>
                            </div>
                            <div className="bg-slate-50/80 rounded-lg p-1.5 border border-slate-100">
                              <p className="text-[10px] text-slate-400">Subjects</p>
                              <p className="text-xs font-bold text-slate-800">{classSubjects.length}</p>
                            </div>
                            <div className="bg-slate-50/80 rounded-lg p-1.5 border border-slate-100">
                              <p className="text-[10px] text-slate-400">Books</p>
                              <p className="text-xs font-bold text-slate-800">{cls.books?.length || 0}</p>
                            </div>
                          </div>

                          {/* Sections Chips Preview */}
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs font-semibold text-slate-600 mb-1.5">Assigned Sections:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {classSections.length > 0 ? (
                                classSections.map((sec) => (
                                  <span
                                    key={sec._id}
                                    className="px-2 py-0.5 rounded-md bg-indigo-50/70 border border-indigo-100/70 text-[11px] font-semibold text-indigo-700 flex items-center gap-1"
                                  >
                                    Sec {sec.name}
                                    {sec.roomNumber && <span className="text-[9px] text-indigo-400 font-normal">({sec.roomNumber})</span>}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400 italic">No sections created</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Click Prompt Bar */}
                        <div className="mt-4 -mx-6 -mb-6 px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold group-hover:bg-indigo-50/60 transition-colors">
                          <span className="flex items-center gap-1.5">
                            <Settings className="w-3.5 h-3.5" />
                            Click to Configure Full Class Setup
                          </span>
                          <span className="text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all">&rarr;</span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}


          {/* TAB 3: ACADEMIC SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Academic Sessions & Past Years</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage historical academic sessions (e.g. 2023-2024, 2024-2025) and active school operating years.
                  </p>
                </div>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalType('session')}>
                  Add Academic Session
                </Button>
              </div>

              {sessions.length === 0 ? (
                <EmptyState
                  title="No academic sessions configured"
                  description="Add your first academic session or register past academic years."
                  actionText="Add Academic Session"
                  onAction={() => setModalType('session')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessions.map((sess) => (
                    <Card
                      key={sess._id}
                      className={`p-5 space-y-3 ${
                        sess.isCurrent ? 'border-indigo-400 bg-indigo-50/20 ring-2 ring-indigo-500/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold text-slate-900">{sess.name}</h4>
                            <Badge
                              variant={
                                sess.status === 'active' || sess.isCurrent
                                  ? 'success'
                                  : sess.status === 'completed'
                                  ? 'neutral'
                                  : 'warning'
                              }
                            >
                              {sess.status === 'completed'
                                ? 'Completed'
                                : sess.isCurrent || sess.status === 'active'
                                ? 'Active'
                                : 'Upcoming'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(sess.startDate).toLocaleDateString()} — {new Date(sess.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        {sess.isCurrent && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" /> Current
                          </span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          {sess.isCurrent ? 'Live Operational Session' : 'Historical / Past Session'}
                        </span>
                        {!sess.isCurrent && (
                          <button
                            onClick={() => handleSetCurrentSession(sess)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Set as Current
                          </button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DEPARTMENTS */}
          {activeTab === 'departments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800">Operational Departments</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <Card key={dept._id}>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {dept.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 mt-2">{dept.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{dept.description || 'Departmental unit'}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: NOTICES */}
          {activeTab === 'notices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800">Circulars & Announcements</h3>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalType('notice')}>
                  Publish Notice
                </Button>
              </div>

              {notices.length === 0 ? (
                <EmptyState
                  title="No notices published"
                  description="Publish school events, exam dates, or administrative memos."
                  actionText="Publish Notice"
                  onAction={() => setModalType('notice')}
                />
              ) : (
                <div className="space-y-3">
                  {notices.map((n) => (
                    <div
                      key={n._id}
                      className="p-5 bg-white rounded-2xl border border-slate-200 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {n.isPinned && <Badge variant="warning">Pinned</Badge>}
                          <Badge variant="primary">{n.category}</Badge>
                          <span className="text-xs text-slate-400">
                            {new Date(n.publishDate).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{n.title}</h4>
                        <p className="text-xs text-slate-600 max-w-2xl whitespace-pre-line">{n.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteNotice(n._id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* ================= COMPREHENSIVE CLASS MANAGEMENT MODAL ================== */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        maxWidth="max-w-4xl"
        title={
          comprehensiveForm._id
            ? `Configure Class: ${comprehensiveForm.name || 'Setup'}`
            : 'Create New Class with Complete Setup'
        }
        subtitle="Manage sections count, curriculum subjects, textbooks, class coordinator, and campus floor in one place."
      >
        {classLoadingDetails ? (
          <div className="py-12">
            <LoadingSpinner text="Loading comprehensive class parameters..." />
          </div>
        ) : (
          <form onSubmit={handleSaveComprehensiveClass} className="space-y-5">
            {/* Modal Internal Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 -mt-2 pb-px overflow-x-auto">
              {[
                { id: 'overview', label: '1. Class & Location', icon: Building2 },
                { id: 'sections', label: `2. Sections (${comprehensiveForm.sections.length})`, icon: Layers },
                { id: 'subjects', label: `3. Subjects (${comprehensiveForm.subjects.length})`, icon: BookOpen },
                { id: 'books', label: `4. Prescribed Books (${comprehensiveForm.books.length})`, icon: Bookmark },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = classModalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setClassModalTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50/60'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OVERVIEW & LOCATION */}
            {classModalTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Class Display Name *</label>
                    <input
                      type="text"
                      required
                      value={comprehensiveForm.name}
                      onChange={(e) => setComprehensiveForm({ ...comprehensiveForm, name: e.target.value })}
                      placeholder="e.g. Class 10 or Grade 1"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Class Code *</label>
                    <input
                      type="text"
                      required
                      value={comprehensiveForm.code}
                      onChange={(e) => setComprehensiveForm({ ...comprehensiveForm, code: e.target.value })}
                      placeholder="e.g. C10 or G1"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Numeric Sorting Order *</label>
                    <input
                      type="number"
                      required
                      value={comprehensiveForm.numericOrder}
                      onChange={(e) =>
                        setComprehensiveForm({ ...comprehensiveForm, numericOrder: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Main Class Coordinator / Head Teacher
                    </label>
                    <select
                      value={comprehensiveForm.classTeacherId}
                      onChange={(e) =>
                        setComprehensiveForm({ ...comprehensiveForm, classTeacherId: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Faculty Member...</option>
                      {teachers.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.firstName} {t.lastName} {t.employeeId ? `(${t.employeeId})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary Room / Office</label>
                    <input
                      type="text"
                      value={comprehensiveForm.roomNumber}
                      onChange={(e) =>
                        setComprehensiveForm({ ...comprehensiveForm, roomNumber: e.target.value })
                      }
                      placeholder="e.g. Room 204 or Secondary Wing Office"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Campus Floor Number</label>
                    <input
                      type="text"
                      list="floor-options"
                      value={comprehensiveForm.floorNumber}
                      onChange={(e) =>
                        setComprehensiveForm({ ...comprehensiveForm, floorNumber: e.target.value })
                      }
                      placeholder="e.g. Ground Floor, 1st Floor, 2nd Floor"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                    <datalist id="floor-options">
                      <option value="Ground Floor" />
                      <option value="1st Floor" />
                      <option value="2nd Floor" />
                      <option value="3rd Floor" />
                      <option value="4th Floor" />
                      <option value="Basement" />
                    </datalist>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Building Block / Wing</label>
                    <input
                      type="text"
                      list="building-options"
                      value={comprehensiveForm.building}
                      onChange={(e) =>
                        setComprehensiveForm({ ...comprehensiveForm, building: e.target.value })
                      }
                      placeholder="e.g. Main Academic Block, Senior Wing"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                    <datalist id="building-options">
                      <option value="Main Academic Block" />
                      <option value="Senior Wing" />
                      <option value="Junior Wing" />
                      <option value="Primary Block" />
                      <option value="Science Block" />
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description / Academic Notes</label>
                  <textarea
                    rows={2}
                    value={comprehensiveForm.description}
                    onChange={(e) =>
                      setComprehensiveForm({ ...comprehensiveForm, description: e.target.value })
                    }
                    placeholder="Enter curriculum focus, standard specifications, or special notes for this class..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: SECTIONS CONFIGURATION */}
            {classModalTab === 'sections' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">Class Sections ({comprehensiveForm.sections.length})</h4>
                    <p className="text-slate-500 text-[11px]">
                      Specify sections (e.g. A, B, C), individual student capacities, room allocations, and section teachers.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Plus}
                    onClick={handleAddSectionRow}
                  >
                    Add Another Section
                  </Button>
                </div>

                {comprehensiveForm.sections.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
                    <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold">No sections registered for this class.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;Add Another Section&quot; to create Section A.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
                    {comprehensiveForm.sections.map((sec, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                      >
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Section Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={sec.name}
                            onChange={(e) => handleUpdateSectionRow(idx, 'name', e.target.value)}
                            placeholder="e.g. A"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 text-center uppercase"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Capacity
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={sec.capacity}
                            onChange={(e) => handleUpdateSectionRow(idx, 'capacity', Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Room Number
                          </label>
                          <input
                            type="text"
                            value={sec.roomNumber}
                            onChange={(e) => handleUpdateSectionRow(idx, 'roomNumber', e.target.value)}
                            placeholder="e.g. Room 204-A"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Section Class Teacher
                          </label>
                          <select
                            value={sec.classTeacherId}
                            onChange={(e) => handleUpdateSectionRow(idx, 'classTeacherId', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                          >
                            <option value="">Select Section Teacher...</option>
                            {teachers.map((t) => (
                              <option key={t._id} value={t._id}>
                                {t.firstName} {t.lastName} {t.employeeId ? `(${t.employeeId})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveSectionRow(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Remove Section"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CURRICULUM SUBJECTS */}
            {classModalTab === 'subjects' && (
              <div className="space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/60">
                  <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Curriculum Subjects ({comprehensiveForm.subjects.length})
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Specify subjects manually or directly bulk import the entire subjects list via Excel/CSV spreadsheet.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={subjectFileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                      onChange={handleImportSubjectExcel}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={Download}
                      onClick={handleDownloadSubjectTemplate}
                      title="Download sample Excel template with columns"
                    >
                      Excel Template
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer shadow-2xs font-semibold"
                      icon={Upload}
                      onClick={() => subjectFileInputRef.current?.click()}
                      title="Import subjects list from Excel (.xlsx/.xls) or CSV sheet"
                    >
                      Import Excel Sheet
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      icon={Plus}
                      onClick={handleAddSubjectRow}
                    >
                      Add Subject
                    </Button>
                  </div>
                </div>

                {comprehensiveForm.subjects.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
                    <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold">No subjects allocated to this class.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;Add Subject&quot; to assign curriculum courses.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
                    {comprehensiveForm.subjects.map((sub, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                      >
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Subject Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={sub.name}
                            onChange={(e) => handleUpdateSubjectRow(idx, 'name', e.target.value)}
                            placeholder="e.g. Mathematics"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Code *
                          </label>
                          <input
                            type="text"
                            required
                            value={sub.code}
                            onChange={(e) => handleUpdateSubjectRow(idx, 'code', e.target.value)}
                            placeholder="e.g. MTH-10"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-semibold text-indigo-700 uppercase"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Type
                          </label>
                          <select
                            value={sub.type}
                            onChange={(e) => handleUpdateSubjectRow(idx, 'type', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                          >
                            <option value="Core">Core</option>
                            <option value="Elective">Elective</option>
                            <option value="Practical">Practical</option>
                            <option value="Language">Language</option>
                            <option value="Vocational">Vocational</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2 flex gap-1.5">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                              Max
                            </label>
                            <input
                              type="number"
                              value={sub.totalMarks}
                              onChange={(e) => handleUpdateSubjectRow(idx, 'totalMarks', Number(e.target.value))}
                              className="w-full px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                              Pass
                            </label>
                            <input
                              type="number"
                              value={sub.passMarks}
                              onChange={(e) => handleUpdateSubjectRow(idx, 'passMarks', Number(e.target.value))}
                              className="w-full px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center text-emerald-700 font-bold"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Instructor
                          </label>
                          <select
                            value={sub.assignedTeacherId}
                            onChange={(e) => handleUpdateSubjectRow(idx, 'assignedTeacherId', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                          >
                            <option value="">Select Instructor...</option>
                            {teachers.map((t) => (
                              <option key={t._id} value={t._id}>
                                {t.firstName} {t.lastName}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveSubjectRow(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Remove Subject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: PRESCRIBED BOOKS & SYLLABUS */}
            {classModalTab === 'books' && (
              <div className="space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/60">
                  <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Bookmark className="w-4 h-4 text-indigo-600" />
                      Prescribed Textbooks &amp; Materials ({comprehensiveForm.books.length})
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Official syllabus books for this class. Add manually, bulk import from Excel/CSV, or print for parents.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={bookFileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                      onChange={handleImportBookExcel}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={Download}
                      onClick={handleDownloadBookTemplate}
                      title="Download sample Books Excel template"
                    >
                      Excel Template
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer shadow-2xs font-semibold"
                      icon={Upload}
                      onClick={() => bookFileInputRef.current?.click()}
                      title="Import books from Excel (.xlsx/.xls) or CSV sheet"
                    >
                      Import Excel
                    </Button>
                    {comprehensiveForm.books.length > 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={Printer}
                        onClick={handlePrintBookList}
                      >
                        Print Book List
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      icon={Plus}
                      onClick={handleAddBookRow}
                    >
                      Add Book
                    </Button>
                  </div>
                </div>

                {comprehensiveForm.books.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
                    <Bookmark className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold">No prescribed books defined for this class yet.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Click &quot;Add Prescribed Book&quot; to register official textbooks, publishers, and ISBNs.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
                    {comprehensiveForm.books.map((b, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                      >
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Book Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={b.title}
                            onChange={(e) => handleUpdateBookRow(idx, 'title', e.target.value)}
                            placeholder="e.g. NCERT Mathematics Class 10"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Subject
                          </label>
                          <input
                            type="text"
                            value={b.subject}
                            onChange={(e) => handleUpdateBookRow(idx, 'subject', e.target.value)}
                            placeholder="e.g. Mathematics"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Author
                          </label>
                          <input
                            type="text"
                            value={b.author}
                            onChange={(e) => handleUpdateBookRow(idx, 'author', e.target.value)}
                            placeholder="e.g. NCERT / Editorial"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Publisher / ISBN
                          </label>
                          <input
                            type="text"
                            value={b.publisher}
                            onChange={(e) => handleUpdateBookRow(idx, 'publisher', e.target.value)}
                            placeholder="e.g. NCERT"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                          />
                        </div>

                        <div className="sm:col-span-1 text-center">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Required
                          </label>
                          <input
                            type="checkbox"
                            checked={b.isRequired}
                            onChange={(e) => handleUpdateBookRow(idx, 'isRequired', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-1 cursor-pointer"
                          />
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveBookRow(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Remove Book"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modal Bottom Action Controls */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                {comprehensiveForm._id && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    icon={Trash2}
                    onClick={() => handleDeleteClass(comprehensiveForm._id)}
                  >
                    Delete Class
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsClassModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={CheckCircle2}
                  disabled={isSavingClass}
                >
                  {isSavingClass ? 'Saving Changes...' : 'Save Class Setup'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* ================= HIDDEN PRINTABLE OFFICIAL BOOK LIST =================== */}
      {/* ========================================================================= */}
      <div id="class-book-list-printable" className="hidden p-8 bg-white text-slate-900 font-sans">
        <div className="border-b-2 border-indigo-900 pb-4 mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Delhi Public Senior Secondary School</h1>
            <p className="text-sm font-semibold text-indigo-800 mt-0.5">
              Official Prescribed Syllabus &amp; Textbooks Reference List
            </p>
            <p className="text-xs text-slate-500 mt-1">Affiliated with CBSE, New Delhi • Academic Directorate</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-900">
              {comprehensiveForm.name || 'Class Details'}
            </span>
            <p className="text-xs text-slate-500 mt-1">Class Code: {comprehensiveForm.code || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs mb-6">
          <div>
            <p className="text-slate-500 font-semibold uppercase text-[10px]">Academic Grade</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{comprehensiveForm.name}</p>
          </div>
          <div>
            <p className="text-slate-500 font-semibold uppercase text-[10px]">Campus Location</p>
            <p className="font-medium text-slate-800 mt-0.5">
              {comprehensiveForm.floorNumber || 'Ground Floor'} {comprehensiveForm.building ? `(${comprehensiveForm.building})` : ''}
            </p>
          </div>
          <div>
            <p className="text-slate-500 font-semibold uppercase text-[10px]">Active Sections</p>
            <p className="font-medium text-slate-800 mt-0.5">
              {comprehensiveForm.sections.map((s) => `Sec ${s.name}`).join(', ') || 'General'}
            </p>
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Prescribed Textbooks List</h3>
        <table className="w-full text-left border-collapse text-xs mb-8 border border-slate-200">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
              <th className="p-2.5 font-bold w-12 text-center">#</th>
              <th className="p-2.5 font-bold">Book Title</th>
              <th className="p-2.5 font-bold">Subject</th>
              <th className="p-2.5 font-bold">Author / Editorial</th>
              <th className="p-2.5 font-bold">Publisher / ISBN</th>
              <th className="p-2.5 font-bold text-center">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {comprehensiveForm.books && comprehensiveForm.books.length > 0 ? (
              comprehensiveForm.books.map((b, i) => (
                <tr key={i}>
                  <td className="p-2.5 text-center font-bold text-slate-500">{i + 1}</td>
                  <td className="p-2.5 font-bold text-slate-900">{b.title}</td>
                  <td className="p-2.5 font-medium text-slate-700">{b.subject || 'General'}</td>
                  <td className="p-2.5 text-slate-600">{b.author || 'Board Prescribed'}</td>
                  <td className="p-2.5 text-slate-600">{b.publisher || 'NCERT / National'}</td>
                  <td className="p-2.5 text-center font-semibold">
                    {b.isRequired ? (
                      <span className="text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-bold">Mandatory</span>
                    ) : (
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px]">Recommended</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-400 italic">No textbooks entered for this class.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 text-xs">
          <div>
            <p className="text-slate-400">Class Coordinator Signature:</p>
            <div className="mt-6 border-b border-slate-400 w-48" />
          </div>
          <div className="text-right">
            <p className="text-slate-400">Principal / Academic Director Seal &amp; Signature:</p>
            <div className="mt-6 border-b border-slate-400 w-48 ml-auto" />
          </div>
        </div>
      </div>

      {/* QUICK CREATE SECTION MODAL (Direct) */}
      <Modal isOpen={modalType === 'section'} onClose={() => setModalType(null)} title="Add Section to Class">
        <form onSubmit={handleCreateSection} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Select Class</label>
            <select
              required
              value={sectionForm.classId}
              onChange={(e) => setSectionForm({ ...sectionForm, classId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">Select a Class...</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Section Name</label>
            <input
              type="text"
              required
              value={sectionForm.name}
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
              placeholder="e.g. A"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Room Number</label>
            <input
              type="text"
              value={sectionForm.roomNumber}
              onChange={(e) => setSectionForm({ ...sectionForm, roomNumber: e.target.value })}
              placeholder="e.g. Room 102"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Section</Button>
          </div>
        </form>
      </Modal>

      {/* QUICK CREATE SUBJECT MODAL */}
      <Modal isOpen={modalType === 'subject'} onClose={() => setModalType(null)} title="Register Subject">
        <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Class</label>
            <select
              required
              value={subjectForm.classId}
              onChange={(e) => setSubjectForm({ ...subjectForm, classId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">Select Class...</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Subject Name</label>
            <input
              type="text"
              required
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              placeholder="e.g. Physics"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Subject Code</label>
            <input
              type="text"
              required
              value={subjectForm.code}
              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
              placeholder="e.g. PHY-10"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1">Total Marks</label>
              <input
                type="number"
                value={subjectForm.totalMarks}
                onChange={(e) => setSubjectForm({ ...subjectForm, totalMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Pass Marks</label>
              <input
                type="number"
                value={subjectForm.passMarks}
                onChange={(e) => setSubjectForm({ ...subjectForm, passMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Subject</Button>
          </div>
        </form>
      </Modal>

      {/* CREATE ACADEMIC SESSION MODAL */}
      <Modal isOpen={modalType === 'session'} onClose={() => setModalType(null)} title="Add Academic Session / Year">
        <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Academic Year Name *</label>
            <input
              type="text"
              required
              value={sessionForm.name}
              onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
              placeholder="e.g. 2024-2025 or 2023-2024"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">Format: YYYY-YYYY (e.g., 2024-2025 for past records)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={sessionForm.startDate}
                onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={sessionForm.endDate}
                onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Session Lifecycle Status</label>
            <select
              value={sessionForm.status || 'completed'}
              onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            >
              <option value="completed">Completed (Past academic years like 2023-24, 2024-25)</option>
              <option value="active">Active (Current ongoing academic year)</option>
              <option value="upcoming">Upcoming (Future planned academic year)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="isCurrentSession"
              checked={sessionForm.isCurrent}
              onChange={(e) => setSessionForm({ ...sessionForm, isCurrent: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isCurrentSession" className="text-xs text-slate-700 font-medium">
              Set as current active session for school operations
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Academic Session</Button>
          </div>
        </form>
      </Modal>

      {/* CREATE NOTICE MODAL */}
      <Modal isOpen={modalType === 'notice'} onClose={() => setModalType(null)} title="Publish School Circular">
        <form onSubmit={handleCreateNotice} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Title</label>
            <input
              type="text"
              required
              value={noticeForm.title}
              onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
              placeholder="e.g. Upcoming Sports Meet Schedule"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Content</label>
            <textarea
              required
              rows={4}
              value={noticeForm.content}
              onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
              placeholder="Write circular announcement details here..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pinCheck"
              checked={noticeForm.isPinned}
              onChange={(e) => setNoticeForm({ ...noticeForm, isPinned: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="pinCheck" className="font-semibold text-slate-700">
              Pin notice to top of board
            </label>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" variant="primary">Publish Now</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminSetupPage;
