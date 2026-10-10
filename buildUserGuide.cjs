const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NexSchool ERP - Complete User & Operations Guide</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.55;
      font-size: 11pt;
      background: #ffffff;
    }

    /* Print Break Utilities */
    .page-break {
      page-break-before: always;
    }
    .avoid-break {
      page-break-inside: avoid;
    }

    /* Cover Page */
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px 40px 40px 40px;
      page-break-after: always;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
      color: #ffffff;
      border-radius: 12px;
    }

    .cover-top .badge {
      display: inline-block;
      background: rgba(99, 102, 241, 0.3);
      border: 1px solid rgba(165, 180, 252, 0.4);
      color: #c7d2fe;
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 10pt;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 24px;
    }

    .cover-title {
      font-size: 34pt;
      font-weight: 900;
      line-height: 1.15;
      margin-bottom: 16px;
      color: #ffffff;
    }

    .cover-subtitle {
      font-size: 15pt;
      color: #cbd5e1;
      font-weight: 400;
      line-height: 1.4;
      max-width: 600px;
    }

    .cover-meta {
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 24px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .cover-meta-item p:first-child {
      font-size: 9pt;
      text-transform: uppercase;
      color: #94a3b8;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .cover-meta-item p:last-child {
      font-size: 11pt;
      color: #f8fafc;
      font-weight: 700;
      margin-top: 4px;
    }

    /* Headings */
    h1 {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 28px;
      margin-bottom: 14px;
      border-bottom: 2.5px solid #4f46e5;
      padding-bottom: 6px;
    }

    h2 {
      font-size: 14pt;
      font-weight: 700;
      color: #1e1b4b;
      margin-top: 20px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h3 {
      font-size: 11.5pt;
      font-weight: 700;
      color: #334155;
      margin-top: 14px;
      margin-bottom: 6px;
    }

    p {
      margin-bottom: 10px;
      color: #334155;
      text-align: justify;
    }

    ul, ol {
      margin-left: 20px;
      margin-bottom: 12px;
      color: #334155;
    }

    li {
      margin-bottom: 5px;
    }

    /* Visual Callout Boxes */
    .callout {
      padding: 12px 16px;
      border-radius: 8px;
      margin: 14px 0;
      font-size: 10pt;
      border-left: 4px solid;
    }

    .callout-info {
      background: #eff6ff;
      border-color: #3b82f6;
      color: #1e3a8a;
    }

    .callout-tip {
      background: #f0fdf4;
      border-color: #22c55e;
      color: #14532d;
    }

    .callout-warning {
      background: #fffbeb;
      border-color: #f59e0b;
      color: #78350f;
    }

    .callout-title {
      font-weight: 800;
      margin-bottom: 3px;
      display: block;
      text-transform: uppercase;
      font-size: 8.5pt;
      letter-spacing: 0.05em;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9.5pt;
    }

    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px 10px;
      text-align: left;
    }

    th {
      background: #f8fafc;
      color: #0f172a;
      font-weight: 700;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    tr:nth-child(even) {
      background: #fbfcfe;
    }

    /* Badges & Tags */
    .tag {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 700;
      font-family: monospace;
    }
    .tag-blue { background: #e0e7ff; color: #3730a3; }
    .tag-green { background: #dcfce7; color: #166534; }
    .tag-amber { background: #fef3c7; color: #92400e; }
    .tag-red { background: #fee2e2; color: #991b1b; }

    /* Steps Cards */
    .step-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 10px;
      background: #ffffff;
    }

    .step-header {
      font-weight: 700;
      color: #4f46e5;
      font-size: 10.5pt;
      margin-bottom: 4px;
    }

    /* TOC */
    .toc-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px dotted #cbd5e1;
      font-size: 10pt;
    }

    .toc-item span:first-child {
      font-weight: 600;
      color: #1e293b;
    }

    .toc-item span:last-child {
      color: #64748b;
      font-weight: 500;
    }

    /* Footer / Header Rules in Print */
    .section-banner {
      background: #f1f5f9;
      border-left: 4px solid #4f46e5;
      padding: 10px 14px;
      margin: 18px 0 10px 0;
      border-radius: 0 6px 6px 0;
    }

    .section-banner h2 {
      margin: 0;
      font-size: 13pt;
      color: #1e1b4b;
    }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover-page">
    <div class="cover-top">
      <div class="badge">Official System Documentation • AY 2025-2026</div>
      <h1 class="cover-title">NexSchool ERP<br>Enterprise User Guide</h1>
      <p class="cover-subtitle">
        A complete, step-by-step operations manual for Administrators, Principals, Teachers, Accountants, Admission Officers, and School Clerks.
      </p>
    </div>

    <div class="cover-bottom">
      <div class="cover-meta">
        <div class="cover-meta-item">
          <p>System Version</p>
          <p>v2.4 Enterprise</p>
        </div>
        <div class="cover-meta-item">
          <p>Target Audience</p>
          <p>All School Staff & Roles</p>
        </div>
        <div class="cover-meta-item">
          <p>Effective Academic Year</p>
          <p>2025 – 2026</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== TABLE OF CONTENTS ==================== -->
  <div class="avoid-break">
    <h1>Table of Contents</h1>
    <p>This user guide is structured by module and role responsibility. Use this index to quickly locate setup procedures, daily operational tasks, or feature walkthroughs.</p>

    <div class="toc-container">
      <div class="toc-item"><span>1. System Overview, Login & Interface Navigation</span><span>Page 2</span></div>
      <div class="toc-item"><span>2. User Roles, Access Hierarchy & Permissions (RBAC)</span><span>Page 3</span></div>
      <div class="toc-item"><span>3. School Setup & Academic Configuration</span><span>Page 4</span></div>
      <div class="toc-item"><span>4. Student Lifecycle: Directory, Profiles & Bulk Import</span><span>Page 5</span></div>
      <div class="toc-item"><span>5. Ingesting Past Academic Years (2024-25, 2023-24)</span><span>Page 6</span></div>
      <div class="toc-item"><span>6. Academics, Class Timetable & Daily Homework</span><span>Page 7</span></div>
      <div class="toc-item"><span>7. Examinations, Grading System & Report Cards</span><span>Page 8</span></div>
      <div class="toc-item"><span>8. Accounts & Fees: Structures, Billing & Collection</span><span>Page 9</span></div>
      <div class="toc-item"><span>9. Staff & HR: Teacher Appointment, Attendance & Payroll</span><span>Page 10</span></div>
      <div class="toc-item"><span>10. Admissions & CRM: Inquiries & Enrollments</span><span>Page 11</span></div>
      <div class="toc-item"><span>11. School Operations: Library, Transport, Clinic & IT</span><span>Page 12</span></div>
      <div class="toc-item"><span>12. Campus Facilities: Security Gate, Canteen & Hygiene</span><span>Page 13</span></div>
      <div class="toc-item"><span>13. Student & Parent Self-Service Portals</span><span>Page 14</span></div>
      <div class="toc-item"><span>14. Campus Notices, Security Audit & Password Management</span><span>Page 15</span></div>
    </div>
  </div>

  <!-- ==================== SECTION 1 ==================== -->
  <div class="page-break">
    <h1>1. System Overview & Navigation</h1>
    <p>NexSchool ERP is an all-in-one School Management System built to unify every school operation—from admissions and classroom academics to financial accounting, transportation, and campus security.</p>

    <h2>1.1 Accessing the Application & Logging In</h2>
    <div class="step-box">
      <div class="step-header">Step 1: Open Application in Web Browser</div>
      <p>Navigate to your school's private ERP link (e.g. <code>http://localhost:5173</code> or your custom domain). The system supports Chrome, Edge, Safari, and Firefox across Windows, macOS, iPads, and Android tablets.</p>
    </div>
    <div class="step-box">
      <div class="step-header">Step 2: Enter Authorized Credentials</div>
      <p>Enter your assigned <strong>Username</strong> (e.g. <code>admin</code> or your staff ID) and confidential <strong>Password</strong>. Click <strong>Sign In</strong>. Upon verification, you will be redirected to your personalized role-based dashboard.</p>
    </div>

    <h2>1.2 Topbar Command Center & Key Features</h2>
    <ul>
      <li><strong>Global Command-K Search (Ctrl+K):</strong> Press <code>Ctrl+K</code> (or <code>Cmd+K</code> on Mac) from any page to activate real-time search across all students, staff, admission applicants, library books, and IT tickets.</li>
      <li><strong>Dynamic Academic Session Switcher:</strong> Located on the top-right (e.g. <code>AY: 2025-2026</code>). Click the dropdown to review available academic years or switch the system view.</li>
      <li><strong>Live Notifications:</strong> Click the bell icon to review instant alerts for fee overdue warnings, admission inquiries, or pending IT tickets.</li>
      <li><strong>User Profile & Password Menu:</strong> Click your avatar on the top right to access your profile or change your account password.</li>
    </ul>

    <div class="callout callout-tip">
      <span class="callout-title">Pro Tip</span>
      You can quickly navigate between modules without using the mouse by pressing <strong>Ctrl+K</strong> and typing keywords like <em>"fees"</em>, <em>"students"</em>, <em>"timetable"</em>, or <em>"bus"</em>.
    </div>
  </div>

  <!-- ==================== SECTION 2 ==================== -->
  <div class="page-break">
    <h1>2. User Roles, Access Hierarchy & Permissions (RBAC)</h1>
    <p>The ERP protects confidential school data using strict <strong>Role-Based Access Control (RBAC)</strong>. Users only see the sidebar links and actions authorized for their role.</p>

    <h2>2.1 The 16 Built-in System Roles</h2>
    <table>
      <thead>
        <tr>
          <th>Role Code</th>
          <th>Display Title</th>
          <th>Hierarchy</th>
          <th>Primary Responsibilities</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="tag tag-red">SUPER_ADMIN</span></td>
          <td>Super Administrator</td>
          <td>Level 0</td>
          <td>Global root access, school setup, DB management, role definition.</td>
        </tr>
        <tr>
          <td><span class="tag tag-blue">PRINCIPAL</span></td>
          <td>School Principal</td>
          <td>Level 1</td>
          <td>Executive academic oversight, staff reviews, report card approvals.</td>
        </tr>
        <tr>
          <td><span class="tag tag-blue">ADMINISTRATOR</span></td>
          <td>School Administrator</td>
          <td>Level 2</td>
          <td>Day-to-day operations, student enrollments, timetable scheduling.</td>
        </tr>
        <tr>
          <td><span class="tag tag-green">TEACHER</span></td>
          <td>Teacher / Faculty</td>
          <td>Level 5</td>
          <td>Class attendance, daily homework, exam marks entry, lesson plans.</td>
        </tr>
        <tr>
          <td><span class="tag tag-green">ACCOUNTANT</span></td>
          <td>Finance Manager</td>
          <td>Level 5</td>
          <td>Fee collection at counter, invoices, payment receipts, payroll.</td>
        </tr>
        <tr>
          <td><span class="tag tag-green">ADMISSION_OFFICER</span></td>
          <td>Admission Officer</td>
          <td>Level 5</td>
          <td>Lead inquiry intake, application processing, admission approval.</td>
        </tr>
        <tr>
          <td><span class="tag tag-amber">CLERK</span></td>
          <td>Office / Front Desk Clerk</td>
          <td>Level 6</td>
          <td>Student records, inquiries intake, fee billing, gate passes.</td>
        </tr>
        <tr>
          <td><span class="tag tag-amber">LIBRARIAN</span></td>
          <td>Head Librarian</td>
          <td>Level 5</td>
          <td>Book inventory, issue/return transactions, fine assessments.</td>
        </tr>
        <tr>
          <td><span class="tag tag-amber">TRANSPORT_MGR</span></td>
          <td>Transport Manager</td>
          <td>Level 5</td>
          <td>Bus fleet management, route stops, driver contact allocations.</td>
        </tr>
        <tr>
          <td><span class="tag tag-amber">NURSE</span></td>
          <td>School Nurse</td>
          <td>Level 5</td>
          <td>Student medical history, infirmary visits, first aid inventory.</td>
        </tr>
        <tr>
          <td><span class="tag tag-amber">SECURITY</span></td>
          <td>Security Guard</td>
          <td>Level 6</td>
          <td>Visitor badges, campus gate log, student early pickup passes.</td>
        </tr>
        <tr>
          <td><span class="tag tag-blue">PARENT</span></td>
          <td>Parent / Guardian</td>
          <td>Level 8</td>
          <td>Multi-child portal, view attendance, pay fees online, report cards.</td>
        </tr>
        <tr>
          <td><span class="tag tag-blue">STUDENT</span></td>
          <td>Enrolled Student</td>
          <td>Level 9</td>
          <td>Timetable periods, homework deadlines, attendance 75% alerts.</td>
        </tr>
      </tbody>
    </table>

    <h2>2.2 Managing Roles in the RBAC Console (<code>/rbac</code>)</h2>
    <p>Super Admins can open <strong>Roles & RBAC</strong> from the sidebar to:</p>
    <ul>
      <li><strong>Create Custom Roles:</strong> Define unique school roles (e.g. <em>Exam Controller</em> or <em>Lab Technician</em>).</li>
      <li><strong>Configure Granular Permissions:</strong> Turn on or off individual rights across 74 permissions (e.g. allow a clerk to view students but not delete them).</li>
      <li><strong>User Accounts Tab:</strong> Provision staff credentials, set initial passwords, and change assigned roles.</li>
    </ul>
  </div>

  <!-- ==================== SECTION 3 ==================== -->
  <div class="page-break">
    <h1>3. School Setup & Academic Configuration</h1>
    <p>Before enrolling students or scheduling classes, Administrators configure the institutional master data in <strong>School Setup</strong> (<code>/admin</code>).</p>

    <h2>3.1 Academic Sessions Management</h2>
    <p>The academic session dictates the active operating year. You can have multiple sessions in the database:</p>
    <ul>
      <li><strong>Active Current Session:</strong> Only one session can have <code>isCurrent: true</code> (e.g. <strong>2025–2026</strong>). All new admissions default here.</li>
      <li><strong>Completed Sessions:</strong> Archived past sessions (e.g. <strong>2024–2025</strong>, <strong>2023–2024</strong>) preserved for transcripts and historical auditing.</li>
      <li><strong>Upcoming Sessions:</strong> Future academic years opened early for advance admissions.</li>
    </ul>

    <h2>3.2 Step-by-Step Setup Hierarchy</h2>
    <div class="step-box">
      <div class="step-header">1. Create Classes & Grades (e.g. Nursery, Grade 1 to 12)</div>
      <p>Go to <strong>School Setup &rarr; Classes</strong> &rarr; Click <em>Add Class</em>. Enter Name (e.g. <code>Grade 10</code>) and numeric order.</p>
    </div>
    <div class="step-box">
      <div class="step-header">2. Create Class Sections (e.g. Section A, Section B)</div>
      <p>Go to <strong>School Setup &rarr; Sections</strong> &rarr; Link to the class, assign room number, and set student capacity (e.g. 40 seats).</p>
    </div>
    <div class="step-box">
      <div class="step-header">3. Define Curriculum Subjects</div>
      <p>Go to <strong>School Setup &rarr; Subjects</strong> &rarr; Enter Subject Name (e.g. <em>Mathematics, English, Physics</em>), subject code, and academic credits.</p>
    </div>
    <div class="step-box">
      <div class="step-header">4. Setup Departments & Designations</div>
      <p>Create organizational departments (<em>Academics, Administration, Accounts, Sports</em>) and designations (<em>Senior Teacher, Accountant, HOD</em>).</p>
    </div>
  </div>

  <!-- ==================== SECTION 4 & 5 ==================== -->
  <div class="page-break">
    <h1>4. Student Management & Ingesting Past Years</h1>
    <p>The <strong>Student Directory</strong> (<code>/students</code>) is the central repository of all student records, academic placements, and parent linkages.</p>

    <h2>4.1 Enrolling a Student (3-Step Wizard)</h2>
    <ol>
      <li><strong>Step 1: Personal Information:</strong> First Name, Last Name, Date of Birth, Gender, Blood Group, and Student Contact.</li>
      <li><strong>Step 2: Academic Placement:</strong> Select Academic Session (Current or Past), assign Class, Section, and unique Roll Number.</li>
      <li><strong>Step 3: Guardian Details:</strong> Enter Father and Mother contact info. The system automatically creates a linked Parent Profile.</li>
    </ol>

    <h2>4.2 Ingesting Past Academic Year Records (2024-25, 2023-24)</h2>
    <p>To store historical student data in your ERP for alumni tracking and compliance, use the <strong>Bulk Import CSV</strong> feature:</p>

    <div class="step-box">
      <div class="step-header">Step 1: Verify Past Session in School Setup</div>
      <p>Ensure the past session (e.g. <code>2024-2025</code>) is created in <strong>School Setup</strong> with status <code>Completed</code>.</p>
    </div>
    <div class="step-box">
      <div class="step-header">Step 2: Open Bulk Import in Student Directory</div>
      <p>Navigate to <strong>Student Directory</strong> &rarr; Click <strong>Bulk Import CSV</strong> button in the top action bar.</p>
    </div>
    <div class="step-box">
      <div class="step-header">Step 3: Choose Target Year & Paste CSV Rows</div>
      <p>Select Target Academic Year (<code>2024-2025</code>), Class, and Section. Paste your CSV rows with headers:</p>
      <pre style="background: #f1f5f9; padding: 8px; border-radius: 6px; font-size: 8pt; margin-top: 4px;">firstName,lastName,gender,dateOfBirth,rollNumber,phone,fatherName,motherName
Aarav,Sharma,Male,2010-04-12,1,9876543210,Rajesh Sharma,Sunita Sharma
Priya,Verma,Female,2010-08-20,2,9876543211,Manoj Verma,Kavita Verma</pre>
    </div>
    <div class="step-box">
      <div class="step-header">Step 4: Click Start Import</div>
      <p>The ERP automatically generates student IDs, admission numbers, links parent profiles, and tags records under 2024-2025.</p>
    </div>

    <h2>4.3 Filtering Students by Academic Year</h2>
    <p>In the Student Directory filter bar, select the <strong>Academic Year dropdown</strong> (e.g. choose <code>2024-2025</code>) to instantly isolate past student batches from current 2025-2026 students.</p>
  </div>

  <!-- ==================== SECTION 6 & 7 ==================== -->
  <div class="page-break">
    <h1>5. Academics, Timetable & Examinations</h1>

    <h2>5.1 Weekly Class Timetable (<code>/academics</code>)</h2>
    <p>The Timetable module schedules weekly periods across Monday through Saturday:</p>
    <ul>
      <li>Select the target Class & Section (e.g. Grade 10 - Section A).</li>
      <li>For each period (Period 1 to Period 8), assign the <strong>Subject</strong>, <strong>Faculty Teacher</strong>, <strong>Room Number</strong>, and <strong>Timing</strong>.</li>
      <li>The system automatically detects teacher scheduling conflicts (prevents double-booking a teacher at the same period).</li>
    </ul>

    <h2>5.2 Daily Homework & Assignment Workflow</h2>
    <ul>
      <li><strong>Creating Homework:</strong> Teachers click <em>Assign Homework</em>, select Class, Subject, Title, Instructions, and Submission Due Date.</li>
      <li><strong>Student View:</strong> Instantly appears in the Student and Parent Portals with pending countdown alerts.</li>
      <li><strong>Evaluation:</strong> Teachers review submissions and mark status as <em>Submitted, Graded,</em> or <em>Late</em>.</li>
    </ul>

    <h2>5.3 Examinations & Report Card Generation</h2>
    <div class="avoid-break">
      <table>
        <thead>
          <tr>
            <th>Workflow Stage</th>
            <th>Responsible Role</th>
            <th>Action Required</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Schedule Exam</strong></td>
            <td>Principal / Administrator</td>
            <td>Create Term Exam (e.g. <em>Mid-Term 2025</em>), dates, maximum marks.</td>
          </tr>
          <tr>
            <td><strong>2. Enter Marks</strong></td>
            <td>Subject Teachers</td>
            <td>Enter marks obtained by each student across subjects.</td>
          </tr>
          <tr>
            <td><strong>3. Compute GPA</strong></td>
            <td>System Automatic</td>
            <td>Calculates percentage, GPA, grade (A+, A, B, etc.), and class rank.</td>
          </tr>
          <tr>
            <td><strong>4. Publish Cards</strong></td>
            <td>Principal Approval</td>
            <td>Release report cards. Students and parents can download PDF report cards.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ==================== SECTION 8 ==================== -->
  <div class="page-break">
    <h1>6. Accounts, Fees & Financial Ledgers</h1>
    <p>The <strong>Accounts & Fees</strong> module (<code>/finance</code>) automates the school fee collection cycle and prevents revenue leakage.</p>

    <h2>6.1 Setting Up Fee Structures</h2>
    <p>Fee structures can be configured on an annual, term, or monthly basis:</p>
    <ul>
      <li><strong>Tuition Fee:</strong> Core educational fee customized by Grade level.</li>
      <li><strong>Transport Fee:</strong> Distance/route-based fee auto-linked to bus allocation.</li>
      <li><strong>Admission & Lab Fees:</strong> One-time onboarding charges.</li>
    </ul>

    <h2>6.2 Collecting Fees at the Counter (Accounts Clerk Walkthrough)</h2>
    <div class="step-box">
      <div class="step-header">Step 1: Locate Student Fee Ledger</div>
      <p>In <strong>Accounts & Fees &rarr; Student Fee Records</strong>, search for the student using Student ID, Admission No, or Name.</p>
    </div>
    <div class="step-box">
      <div class="step-header">Step 2: Select Invoice & Enter Payment Amount</div>
      <p>Click <strong>Collect Payment</strong> on the pending invoice. Enter amount paid, select payment mode (<em>Cash, Card, UPI, Cheque, Bank Transfer</em>), and enter transaction reference.</p>
    </div>
    <div class="step-box">
      <div class="step-header">Step 3: Generate Computerized Receipt</div>
      <p>Click <strong>Confirm & Generate Receipt</strong>. The system records the payment into the ledger, updates the balance, and provides an official printable receipt.</p>
    </div>

    <h2>6.3 Expense Logging & Daily Collections Report</h2>
    <p>Finance managers can record operational expenses (e.g. electricity, lab equipment, maintenance) and export daily collection summaries to CSV for bank reconciliations.</p>
  </div>

  <!-- ==================== SECTION 9 & 10 ==================== -->
  <div class="page-break">
    <h1>7. Staff & HR Management (<code>/staff</code>)</h1>
    <p>Manages the school's faculty and administrative staff throughout their employment lifecycle.</p>

    <h2>7.1 Staff Directory & Appointing New Teachers</h2>
    <ul>
      <li>Click <strong>Add Employee</strong> to record full biographical, contact, qualification, and salary details.</li>
      <li>Assign <strong>Department</strong> (e.g. <em>Science Department</em>) and <strong>Designation</strong> (e.g. <em>Senior Teacher</em>).</li>
      <li><strong>Provisioning Login Credentials:</strong> Go to <strong>Roles & RBAC &rarr; User Accounts</strong> and create a login account for the teacher with role <code>TEACHER</code>.</li>
    </ul>

    <h2>7.2 Staff Attendance & Leave Approvals</h2>
    <p>Staff clock in daily. When a teacher requests sick leave or casual leave, it appears on the Principal's dashboard for one-click approval or rejection.</p>

    <div class="section-banner">
      <h2>8. Admissions & Candidate CRM (<code>/admissions</code>)</h2>
    </div>
    <p>Automates the new student intake pipeline from initial inquiry to final enrollment:</p>
    <ol>
      <li><strong>Inquiry Intake:</strong> Register walk-in or telephone parent inquiries.</li>
      <li><strong>Application Review:</strong> Process candidate admission forms, entrance assessment scores, and past school transfer certificates (TC).</li>
      <li><strong>One-Click Student Conversion:</strong> Upon approval, click <em>"Convert to Enrolled Student"</em>. The system automatically creates their official student record and parent account!</li>
    </ol>
  </div>

  <!-- ==================== SECTION 11 & 12 ==================== -->
  <div class="page-break">
    <h1>9. Operations & Campus Logistics</h1>

    <h2>9.1 Library Management (<code>/library</code>)</h2>
    <ul>
      <li><strong>Catalog Management:</strong> Add books by Title, Author, ISBN, Publisher, and Category.</li>
      <li><strong>Issue / Return Circulation:</strong> Scan Student ID and Book barcode to issue loans. The system tracks due dates and calculates late return fines automatically.</li>
    </ul>

    <h2>9.2 Transport Logistics & Bus Fleet (<code>/transport</code>)</h2>
    <ul>
      <li><strong>Vehicles:</strong> Manage school buses, seating capacities, vehicle insurance, and GPS tracker tags.</li>
      <li><strong>Routes & Stops:</strong> Define morning/evening routes with precise pickup stops and designated pickup times.</li>
      <li><strong>Student Allocation:</strong> Assign students to specific routes and stops. The route details appear in their Student and Parent Portals.</li>
    </ul>

    <h2>9.3 Medical Room & Health Clinic (<code>/medical</code>)</h2>
    <ul>
      <li>Maintain confidential student health profiles, known allergies, blood groups, and chronic conditions.</li>
      <li>Log daily infirmary visits, symptoms treated, first aid provided, and track clinic medicine stock levels.</li>
    </ul>

    <h2>9.4 Campus Gate, Security & Visitor Management (<code>/security</code>)</h2>
    <ul>
      <li><strong>Visitor Passes:</strong> Issue computerized visitor entry badges with visitor photo, phone number, and purpose of visit.</li>
      <li><strong>Gate Passes:</strong> Log early student pick-up passes authorized by parents.</li>
      <li><strong>Incident Reporting:</strong> Maintain security incident logs and perimeter inspection checklists.</li>
    </ul>
  </div>

  <!-- ==================== SECTION 13 & 14 ==================== -->
  <div class="page-break">
    <h1>10. Student & Parent Portals & Security</h1>

    <h2>10.1 Student Self-Service Portal (<code>/portal/student</code>)</h2>
    <p>Provides students with a dedicated personal dashboard:</p>
    <ul>
      <li><strong>Today's Timetable:</strong> Real-time view of daily periods, subjects, teachers, and classroom numbers.</li>
      <li><strong>Pending Homework:</strong> Active assignments, homework instructions, and submission deadlines.</li>
      <li><strong>75% Attendance Rule Alert:</strong> Automatic warning banner if attendance drops below the 75% exam threshold.</li>
      <li><strong>Fee Balances:</strong> View tuition fees and invoice statuses.</li>
      <li><strong>Admin Live Simulation:</strong> Admins can inspect the portal in <em>Admin Preview Mode</em> with the <strong>Switch Student</strong> dropdown.</li>
    </ul>

    <h2>10.2 Parent Multi-Child Portal (<code>/portal/parent</code>)</h2>
    <ul>
      <li><strong>Sibling Switcher:</strong> Parents with multiple enrolled children can switch between children with one click.</li>
      <li><strong>Online Fee Payments:</strong> Review fee invoice breakdowns and simulate/pay fees online.</li>
      <li><strong>Report Cards & Attendance:</strong> Track daily attendance and exam progress.</li>
    </ul>

    <h2>10.3 Password Management & System Security</h2>
    <div class="step-box">
      <div class="step-header">Changing Your Password</div>
      <p>Click your user profile avatar in the topbar &rarr; Click <strong>Change Password</strong> &rarr; Enter your current password and your new secure password (minimum 6 characters).</p>
    </div>
    <div class="step-box">
      <div class="step-header">Audit Logs & Forensic Trail (<code>/audit-logs</code>)</div>
      <p>Super Admins and Principals can review timestamped logs of every login, student enrollment, fee collection, and role change for security audits.</p>
    </div>

    <div class="callout callout-info" style="margin-top: 24px;">
      <span class="callout-title">Support & Assistance</span>
      For technical assistance, system upgrades, or database backups, contact the School IT Helpdesk administrator or submit an internal ticket via <strong>IT Assets & Helpdesk (<code>/it</code>)</strong>.
    </div>
  </div>

</body>
</html>
`;

const htmlPath = path.resolve('d:/CRM/user_guide_temp.html');
const rootPdfPath = path.resolve('d:/CRM/NexSchool_ERP_User_Guide.pdf');
const publicPdfPath = path.resolve('d:/CRM/frontend/public/NexSchool_ERP_User_Guide.pdf');

fs.writeFileSync(htmlPath, htmlContent, 'utf8');

const chromePath = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
console.log('[Guide] Generating PDF via Google Chrome headless...');

try {
  execSync(`${chromePath} --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${rootPdfPath}" "${htmlPath}"`);
  console.log('[Guide] Primary PDF generated at:', rootPdfPath);

  // Copy to frontend/public for instant browser download
  fs.copyFileSync(rootPdfPath, publicPdfPath);
  console.log('[Guide] Web-downloadable PDF copied to:', publicPdfPath);

  // Clean up temp HTML
  if (fs.existsSync(htmlPath)) {
    fs.unlinkSync(htmlPath);
  }

  const stat = fs.statSync(rootPdfPath);
  console.log('[Guide] PDF Generation Complete! File size:', (stat.size / 1024).toFixed(1), 'KB');
} catch (err) {
  console.error('[Guide] Error generating PDF:', err);
  process.exit(1);
}
