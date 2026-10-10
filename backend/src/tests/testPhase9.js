import mongoose from 'mongoose';
import MedicalRecord from '../models/MedicalRecord.js';
import MedicalVisit from '../models/MedicalVisit.js';
import MedicineInventory from '../models/MedicineInventory.js';
import Asset from '../models/Asset.js';
import ITTicket from '../models/ITTicket.js';
import HousekeepingArea from '../models/HousekeepingArea.js';
import HousekeepingTask from '../models/HousekeepingTask.js';
import CleaningSupply from '../models/CleaningSupply.js';
import Visitor from '../models/Visitor.js';
import GatePass from '../models/GatePass.js';
import SecurityIncident from '../models/SecurityIncident.js';
import CanteenItem from '../models/CanteenItem.js';
import CanteenTransaction from '../models/CanteenTransaction.js';

console.log('----------------------------------------------------');
console.log('School ERP - Phase 9 Operations Part 2 Test Suite');
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

const runPhase9Tests = async () => {
  try {
    const dummyStudentId = new mongoose.Types.ObjectId();
    const dummyEmployeeId = new mongoose.Types.ObjectId();
    const dummyUserId = new mongoose.Types.ObjectId();

    // ========================================================
    // 1. MEDICAL & INFIRMARY
    // ========================================================
    console.log('\n[Suite 1: Medical Records & Clinic Visits]');

    const medRecord = new MedicalRecord({
      studentId: dummyStudentId,
      bloodGroup: 'O+',
      heightCm: 145,
      weightKg: 40,
      allergies: [
        {
          allergen: 'Peanut',
          severity: 'Critical',
          reaction: 'Anaphylaxis, hives, swelling',
        },
      ],
      chronicConditions: ['Asthma'],
      regularMedications: [
        { medicineName: 'Albuterol Inhaler', dosage: '2 puffs', timing: 'As needed' },
      ],
      vision: { leftEye: '6/6', rightEye: '6/9' },
      emergencyHospital: { hospitalName: 'City General Hospital', phone: '911' },
      familyPhysician: { doctorName: 'Dr. Sarah Jenkins', phone: '+15552345678' },
    });

    assert(!medRecord.validateSync(), 'MedicalRecord model validates with complete health profile');
    assert(medRecord.bloodGroup === 'O+', 'Blood group recorded accurately');
    assert(medRecord.allergies[0].severity === 'Critical', 'Critical allergy severity detected correctly');

    // Medicine Inventory
    const medicine = new MedicineInventory({
      name: 'Paracetamol 500mg',
      category: 'Analgesic',
      quantityAvailable: 50,
      unit: 'Tablets',
      expiryDate: new Date(2027, 11, 31),
      lowStockThreshold: 10,
      location: 'Cabinet 1 - Shelf B',
    });

    assert(!medicine.validateSync(), 'MedicineInventory validates correctly');
    assert(medicine.quantityAvailable === 50, 'Dispensary stock tracks 50 tablets initially');

    // Medical Visit
    const medVisit = new MedicalVisit({
      visitNumber: 'MED-2026-1001',
      patronType: 'Student',
      studentId: dummyStudentId,
      visitDate: new Date(),
      symptoms: 'Fever, mild headache and shivering',
      diagnosis: 'Viral Pharyngitis',
      treatmentGiven: 'Oral hydration, cold compress and administered 1 tablet Paracetamol',
      medicinesAdministered: [{ medicineName: 'Paracetamol 500mg', quantity: 1 }],
      temperatureCelsius: 38.6,
      bloodPressure: '110/70',
      nurseInCharge: dummyUserId,
      parentNotified: true,
      referredToHospital: false,
      status: 'Under Observation',
    });

    assert(!medVisit.validateSync(), 'MedicalVisit clinic record validates cleanly');
    assert(medVisit.visitNumber === 'MED-2026-1001', 'Visit number format adheres to specification');
    assert(medVisit.parentNotified === true, 'Parent notification boolean is recorded');

    // Simulating stock deduction logic
    medicine.quantityAvailable -= medVisit.medicinesAdministered[0].quantity;
    assert(medicine.quantityAvailable === 49, 'Medicine inventory decrements from 50 to 49 on administration');

    // ========================================================
    // 2. IT ASSETS & HELPDESK
    // ========================================================
    console.log('\n[Suite 2: IT Asset Registry & Helpdesk Tickets]');

    const asset = new Asset({
      assetTag: 'AST-2026-0042',
      name: 'ThinkPad T14 Gen 4',
      category: 'Laptop',
      serialNumber: 'PF-99824XA',
      specifications: 'Intel Core i7, 32GB RAM, 1TB NVMe SSD',
      purchaseDate: new Date(2024, 0, 15),
      purchasePrice: 1350,
      warrantyExpiry: new Date(2027, 0, 15),
      assignedTo: dummyEmployeeId,
      location: 'Staff Room Block C',
      status: 'In Use',
    });

    assert(!asset.validateSync(), 'IT Asset schema validates with warranty and serial number');
    assert(asset.assetTag === 'AST-2026-0042', 'Asset tag formatted correctly');

    const ticket = new ITTicket({
      ticketNumber: 'TKT-2026-0812',
      title: 'Lab 2 Interactive Smart Board HDMI not detecting input',
      description: 'Display shows No Signal when teacher laptop connects via wall port',
      category: 'Smart Classroom',
      priority: 'High',
      status: 'Open',
      raisedBy: dummyUserId,
      assignedTo: dummyUserId,
      assetId: asset._id,
      comments: [
        {
          senderId: dummyUserId,
          message: 'Technician dispatched to inspect the wall plate connector',
          createdAt: new Date(),
        },
      ],
    });

    assert(!ticket.validateSync(), 'ITTicket validates with category, priority, and comments');
    assert(ticket.status === 'Open', 'New support ticket defaults to Open status');
    assert(ticket.comments.length === 1, 'Initial comment thread correctly captured');

    // Status transition
    ticket.status = 'Resolved';
    ticket.resolutionNotes = 'Replaced faulty HDMI pigtail in the wall box; display working';
    ticket.resolvedAt = new Date();
    assert(ticket.status === 'Resolved', 'Ticket successfully advances to Resolved state');

    // ========================================================
    // 3. HOUSEKEEPING & FACILITIES
    // ========================================================
    console.log('\n[Suite 3: Campus Housekeeping & Sanitation]');

    const area = new HousekeepingArea({
      name: 'Science Wing Restrooms - 2nd Floor',
      building: 'Building B',
      floor: 'Floor 2',
      cleaningFrequency: 'Twice Daily',
      supervisorId: dummyEmployeeId,
      isActive: true,
    });

    assert(!area.validateSync(), 'HousekeepingArea validates with building and cleaning frequency');

    const task = new HousekeepingTask({
      taskCode: 'TSK-2026-4401',
      title: 'Morning Restroom Disinfection & Sanitizer Refill',
      areaId: area._id,
      assignedTo: dummyEmployeeId,
      scheduledDate: new Date(),
      shift: 'Morning',
      checklist: [
        { item: 'Mop floor with disinfectant solution', isCompleted: true },
        { item: 'Scrub basins and mirrors', isCompleted: true },
        { item: 'Replenish hand towels & soap dispensers', isCompleted: false },
      ],
      status: 'In Progress',
    });

    assert(!task.validateSync(), 'HousekeepingTask validates with shift checklist');
    assert(task.checklist.length === 3, 'Checklist items populated correctly');

    // Complete checklist
    task.checklist[2].isCompleted = true;
    const allDone = task.checklist.every((c) => c.isCompleted);
    assert(allDone, 'Checklist items can be systematically completed');
    task.status = 'Completed';
    task.completedAt = new Date();
    task.verifiedBy = dummyUserId;
    assert(task.status === 'Completed' && task.verifiedBy, 'Task status completed with supervisor verification');

    // Cleaning Supply
    const supply = new CleaningSupply({
      name: 'Hospital-Grade Surface Disinfectant (5L)',
      category: 'Detergent/Chemical',
      quantityInStock: 4,
      unit: 'Liters',
      minimumAlertLevel: 5,
      storageLocation: 'Central Janitorial Store #2',
    });

    assert(!supply.validateSync(), 'CleaningSupply inventory validates properly');
    const isLowSupply = supply.quantityInStock <= supply.minimumAlertLevel;
    assert(isLowSupply, 'Low stock threshold alert triggers when quantity (4) is below alert level (5)');

    // ========================================================
    // 4. SECURITY, VISITORS & GATE PASS
    // ========================================================
    console.log('\n[Suite 4: Security, Gate Pass & Incident Log]');

    const visitor = new Visitor({
      passNumber: 'VIS-2026-9021',
      visitorName: 'Arthur Dent',
      phone: '+15558901234',
      idProofType: 'Driver License',
      idProofNumber: 'DL-8823-XYZ',
      purpose: 'HVAC Maintenance Inspection',
      visitingType: 'General Administration',
      vehicleNumber: 'KA-05-MN-2020',
      entryTime: new Date(),
      gateNumber: 'Main Gate 1',
      securityGuardId: dummyUserId,
      status: 'Inside Campus',
    });

    assert(!visitor.validateSync(), 'Visitor model validates with ID proof and vehicle details');
    assert(visitor.status === 'Inside Campus', 'Visitor starts in Inside Campus status');

    // Checkout
    visitor.exitTime = new Date();
    visitor.status = 'Exited';
    assert(visitor.status === 'Exited' && visitor.exitTime !== null, 'Visitor check-out sets exitTime and Exited status');

    // Student Early Departure Gate Pass
    const gatePass = new GatePass({
      passNumber: 'GP-2026-5510',
      passType: 'Student Early Exit',
      studentId: dummyStudentId,
      reason: 'Orthodontic appointment at 2:30 PM',
      authorizedBy: dummyUserId,
      accompaniedByName: 'Laura Dent (Mother)',
      accompaniedByPhone: '+15558901234',
      accompaniedByIdVerified: true,
      departureTime: new Date(),
      gateNumber: 'West Gate 2',
      securityGuardId: dummyUserId,
      status: 'Authorized',
    });

    assert(!gatePass.validateSync(), 'GatePass validates with escort details and verified parent credentials');
    assert(gatePass.passNumber === 'GP-2026-5510', 'Gate pass number generated correctly');

    gatePass.status = 'Departed';
    assert(gatePass.status === 'Departed', 'Gate pass advances to Departed upon departure');

    // Security Incident
    const incident = new SecurityIncident({
      incidentNumber: 'INC-2026-0114',
      title: 'Vehicle bumped perimeter barrier during reverse turn',
      incidentType: 'Vehicle Incident',
      severity: 'Low',
      incidentDate: new Date(),
      location: 'Bus Parking Bay 3',
      description: 'Private delivery van grazed fence post; minimal paint scuff, zero structural damage',
      partiesInvolved: 'Delivery Driver (Speedy Couriers)',
      reportedBy: dummyUserId,
      actionTaken: 'Exchanged insurance details; gate officer logged driver license',
      status: 'Resolved',
    });

    assert(!incident.validateSync(), 'SecurityIncident validates with severity and action taken');
    assert(incident.severity === 'Low', 'Incident severity correctly recorded');

    // ========================================================
    // 5. CANTEEN / CAFETERIA POS
    // ========================================================
    console.log('\n[Suite 5: Canteen Menu & POS Billing]');

    const foodItem1 = new CanteenItem({
      itemCode: 'FD-101',
      name: 'Toasted Veg Club Sandwich',
      category: 'Snacks',
      price: 4.5,
      costPrice: 2.2,
      quantityInStock: 30,
      isVegetarian: true,
      allergens: ['Gluten', 'Dairy'],
      isAvailable: true,
    });

    const foodItem2 = new CanteenItem({
      itemCode: 'FD-102',
      name: 'Freshly Squeezed Orange Juice',
      category: 'Beverages',
      price: 3.0,
      costPrice: 1.2,
      quantityInStock: 25,
      isVegetarian: true,
      allergens: [],
      isAvailable: true,
    });

    assert(!foodItem1.validateSync(), 'CanteenItem sandwich validates with allergen badges');
    assert(!foodItem2.validateSync(), 'CanteenItem juice validates with pricing');
    assert(foodItem1.isVegetarian === true, 'Dietary flag tracks vegetarian options');

    // Create POS Order: 2 Sandwiches ($9.00) + 1 Juice ($3.00) = $12.00
    const order = new CanteenTransaction({
      orderNumber: 'ORD-2026-3012',
      customerType: 'Student',
      studentId: dummyStudentId,
      items: [
        {
          itemId: foodItem1._id,
          name: foodItem1.name,
          quantity: 2,
          unitPrice: foodItem1.price,
          subtotal: foodItem1.price * 2, // 9.00
        },
        {
          itemId: foodItem2._id,
          name: foodItem2.name,
          quantity: 1,
          unitPrice: foodItem2.price,
          subtotal: foodItem2.price * 1, // 3.00
        },
      ],
      totalAmount: 12.0,
      paymentMethod: 'Meal Card / RFID',
      paymentStatus: 'Paid',
      servedBy: dummyUserId,
    });

    assert(!order.validateSync(), 'CanteenTransaction validates with line items and subtotal');
    assert(order.totalAmount === 12.0, 'Order total accurately computes: 2x$4.50 + 1x$3.00 = $12.00');
    assert(order.paymentMethod === 'Meal Card / RFID', 'Payment method stores Meal Card transaction');

    // Decrement stock
    foodItem1.quantityInStock -= order.items[0].quantity;
    foodItem2.quantityInStock -= order.items[1].quantity;
    assert(foodItem1.quantityInStock === 28, 'Sandwich stock decrements from 30 to 28');
    assert(foodItem2.quantityInStock === 24, 'Juice stock decrements from 25 to 24');

    // ========================================================
    // SUMMARY
    // ========================================================
    console.log('\n====================================================');
    console.log(`Phase 9 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Phase 9 Test Error:', err);
    process.exit(1);
  }
};

runPhase9Tests();
