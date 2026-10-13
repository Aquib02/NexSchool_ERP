import fs from 'fs';
import path from 'path';

/**
 * Clean valid PDF-1.4 binary generator using native Node.js buffers.
 * Supports multi-line formatted text with title, subtitles, sections, and metadata.
 */
export function generatePdfBuffer(docTitle, sections = []) {
  const lines = [];

  // Title
  lines.push({ text: docTitle, font: '/F2', size: 16, dy: -28 });
  lines.push({ text: 'NexSchool Enterprise Education Platform | Academic Session 2025-2026', font: '/F1', size: 9, dy: -14 });
  lines.push({ text: '-----------------------------------------------------------------------------------------------------------------', font: '/F1', size: 9, dy: -14 });

  for (const sec of sections) {
    if (sec.header) {
      lines.push({ text: '', font: '/F1', size: 9, dy: -10 });
      lines.push({ text: sec.header, font: '/F2', size: 12, dy: -16 });
    }
    if (Array.isArray(sec.paragraphs)) {
      for (const p of sec.paragraphs) {
        lines.push({ text: p, font: '/F1', size: 10, dy: -14 });
      }
    }
  }

  // Footer
  lines.push({ text: '', font: '/F1', size: 9, dy: -20 });
  lines.push({ text: `Generated electronically via NexSchool ERP Teacher Portal on ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}`, font: '/F1', size: 8, dy: -12 });
  lines.push({ text: 'Document Verification Hash: SEC-DOC-' + Math.random().toString(36).substring(2, 10).toUpperCase(), font: '/F1', size: 8, dy: -10 });

  // Build stream content
  const streamCommands = ['BT', '50 740 Td'];
  for (const item of lines) {
    const safeText = item.text.replace(/[()\\]/g, '\\$&');
    streamCommands.push(`${item.font} ${item.size} Tf`);
    streamCommands.push(`0 ${item.dy} Td`);
    streamCommands.push(`(${safeText}) Tj`);
  }
  streamCommands.push('ET');

  const content = streamCommands.join('\n');
  const streamLen = Buffer.byteLength(content, 'utf8');

  let pdf = '%PDF-1.4\n';
  const offsets = [];

  const addObj = (str) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += str + '\n';
  };

  addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  addObj('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  addObj(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj'
  );
  addObj(`4 0 obj\n<< /Length ${streamLen} >>\nstream\n${content}\nendstream\nendobj`);
  addObj('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  addObj('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += 'xref\n0 7\n0000000000 65535 f \n';
  for (let i = 0; i < 6; i++) {
    pdf += offsets[i].toString().padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}

export function createDummyDatasetFiles() {
  const dirs = [
    path.resolve(process.cwd(), '../frontend/public/documents'),
    path.resolve(process.cwd(), './uploads/documents'),
    path.resolve(process.cwd(), 'uploads/documents'),
  ];

  for (const d of dirs) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  }

  // 1. Homework Assignment Worksheet
  const hwPdf = generatePdfBuffer('GRADE 10 MATHEMATICS - HOMEWORK WORKSHEET', [
    {
      header: '1. Course & Assignment Metadata',
      paragraphs: [
        'Course: Mathematics (Core) | Course Code: MTH-101 | Academic Year: 2025-2026',
        'Faculty / Instructor: Sarah Jenkins (Senior Mathematics Faculty)',
        'Target Class: Grade 10 - Section A | Total Marks: 50 | Due Date: October 25, 2026',
        'Topic: Unit 4 - Quadratic Equations, Polynomial Discriminants & Graph Vertex Analysis',
      ],
    },
    {
      header: '2. General Instructions for Students',
      paragraphs: [
        '- Answer all questions in neat handwriting with complete step-by-step mathematical proofs.',
        '- Identify the roots using factoring where possible, or use the quadratic formula x = (-b +/- sqrt(D))/(2a).',
        '- Upload your completed homework as a PDF via the Student LMS Portal before 11:59 PM.',
      ],
    },
    {
      header: '3. Section A: Algebraic Derivations (20 Marks)',
      paragraphs: [
        'Q1. Solve for x: 3x^2 - 14x + 8 = 0. State whether the roots are rational, irrational, or complex.',
        'Q2. Find the discriminant D = b^2 - 4ac for the equation 2x^2 - 6x + 5 = 0 and interpret the nature of roots.',
        'Q3. If alpha and beta are roots of x^2 - 7x + 12 = 0, evaluate alpha^2 + beta^2 and 1/alpha + 1/beta.',
      ],
    },
    {
      header: '4. Section B: Real-World Modeling Problems (30 Marks)',
      paragraphs: [
        'Q4. A model rocket is fired vertically with initial height h(t) = -5t^2 + 40t + 10 meters.',
        '    (a) Find the maximum height reached by the rocket using the vertex formula.',
        '    (b) Determine the exact time in seconds when the projectile impacts the ground.',
        'Q5. The length of a rectangular sports lawn exceeds its width by 6 meters. If its area is 216 sq meters,',
        '    find the dimensions of the perimeter.',
      ],
    },
  ]);

  // 2. Class Master Timetable PDF
  const ttPdf = generatePdfBuffer('GRADE 10 - SECTION A MASTER WEEKLY TIMETABLE', [
    {
      header: '1. Class Roster & Department Information',
      paragraphs: [
        'Class: Grade 10 - Section A | Academic Session: 2025-2026',
        'Class Teacher & Academic Mentor: Sarah Jenkins',
        'Homeroom: Academic Wing Room 204 | Bell Schedule: 08:30 AM to 02:30 PM',
      ],
    },
    {
      header: '2. Daily Schedule Structure (Monday through Friday)',
      paragraphs: [
        'Period 1 (08:30 AM - 09:15 AM): Mathematics (Core MTH-101) - Teacher: Sarah Jenkins [Room 204]',
        'Period 2 (09:15 AM - 10:00 AM): General Science (Physics/Chemistry SCI-101) - Science Faculty [Room 204]',
        'Period 3 (10:00 AM - 10:45 AM): English Literature (ENG-101) - Humanities Faculty [Room 204]',
        'Period 4 (10:45 AM - 11:15 AM): Recess & Nutritional Break [Cafeteria / Courtyard]',
        'Period 5 (11:15 AM - 12:00 PM): Mathematics Problem Solving & Lab - Teacher: Sarah Jenkins [Math Lab 1]',
        'Period 6 (12:00 PM - 12:45 PM): Science Practical / Physics Lab - Science Faculty [Physics Lab]',
        'Period 7 (12:45 PM - 01:30 PM): Social Studies & World History [Room 204]',
        'Period 8 (01:30 PM - 02:15 PM): Computer Science & Robotics [ICT Lab A]',
        'Dismissal (02:15 PM - 02:30 PM): Homeroom Mentorship, Attendance & Bus Boarding',
      ],
    },
    {
      header: '3. Laboratory & Safety Regulations',
      paragraphs: [
        '- Students must report to Math Lab 1 and Physics Lab 5 minutes prior to period commencement.',
        '- Closed-toe shoes and safety goggles mandatory during all science laboratory sessions.',
      ],
    },
  ]);

  // 3. Study Material / Syllabus Lab Manual PDF
  const labPdf = generatePdfBuffer('GRADE 10 GENERAL SCIENCE - PHYSICS LABORATORY MANUAL', [
    {
      header: '1. Resource Overview & Safety Protocols',
      paragraphs: [
        'Subject: General Science (Physics Mechanics Module) | Resource Type: Syllabus Lab Manual',
        'Published by: Sarah Jenkins, Senior Academic Faculty | Academic Session: 2025-2026',
        'Syllabus Coverage: Dynamics, Kinematics, Friction, and Free Body Force Analysis',
      ],
    },
    {
      header: '2. Experiment 1: Verification of Newton Second Law (F = ma)',
      paragraphs: [
        'Apparatus: Low-friction air track, glider, hanging weight carrier, photogates, digital timer.',
        'Theory: Newton second law states that net force equals mass multiplied by acceleration.',
        'Procedure: Vary hanging mass m_h while keeping total system mass constant. Measure acceleration',
        'using dual infrared photogates across 0.50m and 1.00m distance markers.',
        'Analysis: Plot Net Force vs Acceleration. The slope represents experimental system mass.',
      ],
    },
    {
      header: '3. Experiment 2: Measurement of Friction Coefficients on an Inclined Plane',
      paragraphs: [
        'Apparatus: Adjustable wooden inclined track, protractor, friction block, spring balance.',
        'Theory: Static friction coefficient mu_s = tan(theta_c), where theta_c is the angle of impending motion.',
        'Calculations: Record 5 trials of critical slipping angle. Compute mean angle and standard error.',
      ],
    },
  ]);

  // 4. Student Solution Submission PDF
  const subPdf = generatePdfBuffer('STUDENT ASSIGNMENT SUBMISSION - PHYSICS LAB REPORT', [
    {
      header: '1. Student Identification & Submission Details',
      paragraphs: [
        'Student Name: Mohammad Khan | Admission Number: ADM-2026-0003 | Roll Number: 3',
        'Class: Grade 10 - Section A | Submitted To: Sarah Jenkins (Faculty of Science)',
        'Assignment: Newton Laws & Dynamics Problem Set | Date of Submission: October 12, 2026',
      ],
    },
    {
      header: '2. Solution to Question 1: Net Force & Acceleration',
      paragraphs: [
        'Given: Mass m = 5.0 kg, Applied Force F_app = 35.0 N, Frictional Resistance f_k = 14.0 N.',
        'Formula: F_net = F_app - f_k = 35.0 N - 14.0 N = 21.0 N.',
        'Acceleration: a = F_net / m = 21.0 N / 5.0 kg = 4.20 m/s^2 along horizontal direction.',
        'Status: Verified with dimensional analysis [M][L][T]^-2 / [M] = [L][T]^-2.',
      ],
    },
    {
      header: '3. Solution to Question 2: Incline Force Resolution',
      paragraphs: [
        'Given: 10.0 kg crate on 30 degree frictionless slope. Gravitational acceleration g = 9.80 m/s^2.',
        'Parallel component: F_parallel = m * g * sin(30 deg) = 10.0 * 9.80 * 0.50 = 49.0 N.',
        'Perpendicular normal force: F_N = m * g * cos(30 deg) = 10.0 * 9.80 * 0.866 = 84.87 N.',
        'Conclusion: Acceleration down the incline a = g * sin(30 deg) = 4.90 m/s^2 independent of mass.',
      ],
    },
  ]);

  const files = [
    { name: 'Grade10_Mathematics_Polynomials_Worksheet.pdf', buffer: hwPdf },
    { name: 'Grade10_Academic_Master_Timetable.pdf', buffer: ttPdf },
    { name: 'Grade10_Science_Physics_Lab_Manual.pdf', buffer: labPdf },
    { name: 'Mohammad_Khan_Physics_Assignment_Submission.pdf', buffer: subPdf },
  ];

  for (const f of files) {
    for (const d of dirs) {
      const filePath = path.join(d, f.name);
      fs.writeFileSync(filePath, f.buffer);
    }
    console.log(`[DatasetPDF] ✓ Generated "${f.name}" (${(f.buffer.length / 1024).toFixed(1)} KB)`);
  }
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('generateDummyPdfs.js')) {
  createDummyDatasetFiles();
}

export default createDummyDatasetFiles;
