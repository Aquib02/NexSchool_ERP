import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import Route from '../models/Route.js';
import TransportAllocation from '../models/TransportAllocation.js';
import Student from '../models/Student.js';
import AcademicSession from '../models/AcademicSession.js';

// Helper to resolve session
const resolveSession = async (sessionId) => {
  if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
    const found = await AcademicSession.findById(sessionId);
    if (found) return found._id;
  }
  let active = await AcademicSession.findOne({ isCurrent: true });
  if (!active) active = await AcademicSession.findOne().sort({ createdAt: -1 });
  if (!active) {
    const year = new Date().getFullYear();
    active = await AcademicSession.create({
      name: `${year}-${year + 1}`,
      startDate: new Date(year, 3, 1),
      endDate: new Date(year + 1, 2, 31),
      isCurrent: true,
      status: 'active',
    });
  }
  return active._id;
};

// ==========================================
// 1. VEHICLE FLEET MANAGEMENT
// ==========================================

export const createVehicle = async (req, res, next) => {
  try {
    const {
      vehicleNumber,
      model,
      seatingCapacity,
      driver,
      conductor,
      insuranceExpiry,
      fitnessExpiry,
    } = req.body;

    if (!vehicleNumber || !model || !seatingCapacity || !driver?.name || !driver?.phone) {
      return res.status(400).json({
        success: false,
        message: 'vehicleNumber, model, seatingCapacity, driver.name, and driver.phone are required',
      });
    }

    const vehicle = await Vehicle.create({
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      model: model.trim(),
      seatingCapacity: Number(seatingCapacity),
      driver: {
        name: driver.name.trim(),
        phone: driver.phone.trim(),
        licenseNumber: driver.licenseNumber?.trim() || '',
      },
      conductor: conductor || {},
      insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
      fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry) : null,
      status: 'Active',
    });

    res.status(201).json({
      success: true,
      data: vehicle,
      message: `Vehicle ${vehicle.vehicleNumber} registered into fleet successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const getVehicles = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { 'driver.name': { $regex: search, $options: 'i' } },
      ];
    }

    const vehicles = await Vehicle.find(filter).sort({ vehicleNumber: 1 });

    // Calculate occupied seats for each vehicle
    const vehiclesWithOccupancy = await Promise.all(
      vehicles.map(async (v) => {
        const allocatedSeats = await TransportAllocation.countDocuments({
          vehicleId: v._id,
          status: 'Active',
        });
        return {
          ...v.toObject(),
          allocatedSeats,
          availableSeats: Math.max(0, v.seatingCapacity - allocatedSeats),
        };
      })
    );

    res.status(200).json({
      success: true,
      count: vehiclesWithOccupancy.length,
      data: vehiclesWithOccupancy,
    });
  } catch (error) {
    next(error);
  }
};

export const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(id, updates, { new: true });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.status(200).json({
      success: true,
      data: vehicle,
      message: 'Vehicle information updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. ROUTE & STOPS MANAGEMENT
// ==========================================

export const createRoute = async (req, res, next) => {
  try {
    const { routeName, vehicleId, startLocation, endLocation, stops = [] } = req.body;

    if (!routeName || !startLocation || !endLocation) {
      return res.status(400).json({
        success: false,
        message: 'routeName, startLocation, and endLocation are required',
      });
    }

    const route = await Route.create({
      routeName: routeName.trim(),
      vehicleId: vehicleId || null,
      startLocation: startLocation.trim(),
      endLocation: endLocation.trim(),
      stops,
      isActive: true,
    });

    const populated = await Route.findById(route._id).populate('vehicleId', 'vehicleNumber model seatingCapacity');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Transport route configured successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getRoutes = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { routeName: { $regex: search, $options: 'i' } },
        { startLocation: { $regex: search, $options: 'i' } },
        { endLocation: { $regex: search, $options: 'i' } },
        { 'stops.stopName': { $regex: search, $options: 'i' } },
      ];
    }

    const routes = await Route.find(filter)
      .populate('vehicleId', 'vehicleNumber model seatingCapacity driver')
      .sort({ routeName: 1 });

    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { routeName, vehicleId, startLocation, endLocation, stops, isActive } = req.body;

    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    if (routeName) route.routeName = routeName.trim();
    if (vehicleId !== undefined) route.vehicleId = vehicleId || null;
    if (startLocation) route.startLocation = startLocation.trim();
    if (endLocation) route.endLocation = endLocation.trim();
    if (Array.isArray(stops)) route.stops = stops;
    if (isActive !== undefined) route.isActive = isActive;

    await route.save();

    const populated = await Route.findById(route._id).populate('vehicleId', 'vehicleNumber model seatingCapacity');

    res.status(200).json({
      success: true,
      data: populated,
      message: 'Route updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. STUDENT TRANSPORT SEAT ALLOCATIONS
// ==========================================

export const allocateTransport = async (req, res, next) => {
  try {
    const {
      studentId,
      academicSessionId,
      routeId,
      vehicleId,
      stopName,
      pickupTime,
      dropTime,
      monthlyCharge,
    } = req.body;

    if (!studentId || !routeId || !vehicleId || !stopName) {
      return res.status(400).json({
        success: false,
        message: 'studentId, routeId, vehicleId, and stopName are required',
      });
    }

    const session = await resolveSession(academicSessionId);

    // 1. Check vehicle seating capacity constraint
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const currentActiveCount = await TransportAllocation.countDocuments({
      vehicleId: vehicle._id,
      status: 'Active',
    });

    if (currentActiveCount >= vehicle.seatingCapacity) {
      return res.status(400).json({
        success: false,
        message: `Vehicle ${vehicle.vehicleNumber} has reached its maximum seating capacity (${vehicle.seatingCapacity} seats).`,
      });
    }

    // 2. Prevent duplicate active allocation for student
    const existing = await TransportAllocation.findOne({
      studentId,
      academicSessionId: session,
      status: 'Active',
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This student already has an active transport seat allocation for this academic session',
      });
    }

    // 3. Create allocation
    const allocation = await TransportAllocation.create({
      studentId,
      academicSessionId: session,
      routeId,
      vehicleId,
      stopName: stopName.trim(),
      pickupTime: pickupTime || '07:30 AM',
      dropTime: dropTime || '03:30 PM',
      monthlyCharge: Number(monthlyCharge) || 0,
      status: 'Active',
    });

    const populated = await TransportAllocation.findById(allocation._id)
      .populate('studentId', 'firstName lastName admissionNumber currentClass classId')
      .populate('routeId', 'routeName startLocation endLocation')
      .populate('vehicleId', 'vehicleNumber model driver');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Transport seat allocated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getTransportAllocations = async (req, res, next) => {
  try {
    const { routeId, vehicleId, studentId, status, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (routeId) filter.routeId = routeId;
    if (vehicleId) filter.vehicleId = vehicleId;
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [allocations, total] = await Promise.all([
      TransportAllocation.find(filter)
        .populate({
          path: 'studentId',
          select: 'firstName lastName admissionNumber currentClass currentSection classId sectionId phone parents',
          populate: [
            { path: 'classId', select: 'name' },
            { path: 'currentClass', select: 'name' },
          ],
        })
        .populate('routeId', 'routeName startLocation endLocation')
        .populate('vehicleId', 'vehicleNumber model driver conductor')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      TransportAllocation.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: allocations.length,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
      data: allocations,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAllocationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Active', 'Suspended', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const allocation = await TransportAllocation.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Transport allocation not found' });
    }

    res.status(200).json({
      success: true,
      data: allocation,
      message: `Transport allocation status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};
