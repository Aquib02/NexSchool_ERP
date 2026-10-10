import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import Notice from '../models/Notice.js';
import Notification from '../models/Notification.js';

console.log('----------------------------------------------------');
console.log('School ERP - Phase 10 Communication & Audit Trail Test Suite');
console.log('----------------------------------------------------');

let passed = 0;
let failed = 0;

const assert = (condition, title) => {
  if (condition) {
    console.log(`  ✓ PASS: ${title}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${title}`);
    failed++;
  }
};

const runPhase10Tests = async () => {
  try {
    const dummyUserId = new mongoose.Types.ObjectId();
    const dummyResourceId = new mongoose.Types.ObjectId();
    const dummyClassId = new mongoose.Types.ObjectId();

    // ========================================================
    // 1. CENTRAL SYSTEM AUDIT LOG TRAIL
    // ========================================================
    console.log('\n[Suite 1: Immutable Central System Audit Log]');

    const auditEntry = new AuditLog({
      actorId: dummyUserId,
      actorName: 'Alexander Vance',
      actorRole: 'SUPER_ADMIN',
      action: 'FEE_PAYMENT_COLLECTED',
      resource: 'StudentFee',
      resourceId: dummyResourceId,
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      diff: {
        before: { balanceAmount: 600, status: 'Unpaid' },
        after: { balanceAmount: 350, status: 'Partially Paid', paymentReceived: 250 },
      },
      status: 'SUCCESS',
    });

    assert(!auditEntry.validateSync(), 'AuditLog entry schema validates cleanly');
    assert(auditEntry.actorRole === 'SUPER_ADMIN', 'Actor role captured accurately');
    assert(auditEntry.action === 'FEE_PAYMENT_COLLECTED', 'Audit action type recorded correctly');
    assert(auditEntry.diff.after.balanceAmount === 350, 'State mutation diff preserved in audit trail');
    assert(auditEntry.ipAddress === '192.168.1.45', 'Client IP address recorded');

    // Immutability Guard Verification
    let blockedUpdate = false;
    try {
      const hooks = AuditLog.schema.s.hooks._pres.get('updateOne');
      const immutabilityHook = hooks?.find(
        (h) => !h.fn[Symbol.for('mongoose:built-in-middleware')]
      );
      if (immutabilityHook) {
        immutabilityHook.fn();
      }
    } catch (err) {
      if (err.message.includes('immutable')) {
        blockedUpdate = true;
      }
    }
    assert(blockedUpdate, 'Mongoose pre-hook strictly rejects updateOne modifications on AuditLog');

    // ========================================================
    // 2. NOTICES & CAMPUS CIRCULARS
    // ========================================================
    console.log('\n[Suite 2: Campus Notices & Bulletin Circulars]');

    const notice = new Notice({
      title: 'Annual Inter-School STEM Olympiad 2026',
      content: 'Registration is now open for students from Grade 6 through Grade 12. Teams must submit entries by Friday.',
      category: 'Academic',
      targetAudience: ['Students', 'Teachers'],
      targetClasses: [dummyClassId],
      publishDate: new Date(2026, 8, 1),
      expiryDate: new Date(2026, 8, 30),
      isPinned: true,
      authorId: dummyUserId,
      attachmentUrl: 'https://cdn.nexschool.edu/docs/stem-olympiad-guidelines.pdf',
    });

    assert(!notice.validateSync(), 'Notice circular validates cleanly with target audience and classes');
    assert(notice.isPinned === true, 'Notice pinned priority flag tracks correctly');
    assert(notice.targetAudience.includes('Students'), 'Target audience includes student body');

    // Emergency Notice
    const emergencyNotice = new Notice({
      title: 'Severe Weather Warning: Early Dismissal at 1:00 PM',
      content: 'Due to severe storm alerts, afternoon classes are suspended. School transport will depart early at 1:15 PM.',
      category: 'Emergency',
      targetAudience: ['All'],
      publishDate: new Date(),
      isPinned: true,
      authorId: dummyUserId,
    });

    assert(!emergencyNotice.validateSync(), 'Emergency broadcast notice validates cleanly');
    assert(emergencyNotice.category === 'Emergency', 'Emergency category properly applied');

    // Expiry verification
    const expiredNotice = new Notice({
      title: 'Book Fair Last Call',
      content: 'Final day for the library book fair.',
      category: 'Event',
      publishDate: new Date(2025, 0, 1),
      expiryDate: new Date(2025, 0, 5),
      authorId: dummyUserId,
    });
    const now = new Date();
    const isExpired = expiredNotice.expiryDate && new Date(expiredNotice.expiryDate) < now;
    assert(isExpired, 'Notice expiry calculation correctly identifies expired notices');

    // ========================================================
    // 3. IN-APP NOTIFICATIONS & BROADCASTS
    // ========================================================
    console.log('\n[Suite 3: Multi-Channel In-App Notifications]');

    const notification = new Notification({
      recipientType: 'Individual',
      recipientId: dummyUserId,
      title: 'Fee Invoice Due Reminder',
      message: 'Tuition invoice INV-2026-0042 is due within 5 days. Please settle balance to avoid late fee penalties.',
      category: 'Fee',
      actionUrl: '/finance',
      isRead: false,
      channelDelivery: [
        {
          channel: 'InApp',
          status: 'Delivered',
          deliveredAt: new Date(),
        },
      ],
    });

    assert(!notification.validateSync(), 'In-App notification validates with actionUrl and category');
    assert(notification.isRead === false, 'New notification defaults to unread state');

    // Read transition
    notification.isRead = true;
    notification.readAt = new Date();
    assert(notification.isRead === true && notification.readAt !== null, 'Notification marks as read with timestamp');

    // Broadcast Notification
    const broadcast = new Notification({
      recipientType: 'BroadcastAll',
      title: 'School Campus Closed on Monday for Maintenance',
      message: 'All academic operations will resume Tuesday as normal.',
      category: 'System',
      channelDelivery: [
        { channel: 'InApp', status: 'Delivered', deliveredAt: new Date() },
        { channel: 'Email', status: 'Sent', deliveredAt: new Date() },
      ],
    });

    assert(!broadcast.validateSync(), 'BroadcastAll notification validates with multi-channel delivery');
    assert(broadcast.channelDelivery.length === 2, 'Channel delivery tracks InApp and Email dispatches');

    // Summary
    console.log('\n====================================================');
    console.log(`Phase 10 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Phase 10 Test Error:', err);
    process.exit(1);
  }
};

runPhase10Tests();
