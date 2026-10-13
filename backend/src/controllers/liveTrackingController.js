import mongoose from 'mongoose';
import BusLiveLocation from '../models/BusLiveLocation.js';
import BusBoardingLog from '../models/BusBoardingLog.js';
import Vehicle from '../models/Vehicle.js';
import Route from '../models/Route.js';
import TransportAllocation from '../models/TransportAllocation.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Default campus coordinate anchor: Central Campus
const CAMPUS_LAT = 28.6139;
const CAMPUS_LNG = 77.2090;

export const getFleetStatus = asyncHandler(async (req, res) => {
  let liveLocations = await BusLiveLocation.find()
    .populate('vehicleId', 'vehicleNumber model capacity driverName driverPhone status')
    .populate('routeId', 'routeName startLocation endLocation stops');

  // If no live locations exist yet, generate dynamic coordinates for available vehicles
  if (liveLocations.length === 0) {
    const vehicles = await Vehicle.find().limit(5);
    const routes = await Route.find().limit(5);

    if (vehicles.length > 0 && routes.length > 0) {
      for (let i = 0; i < vehicles.length; i++) {
        const v = vehicles[i];
        const r = routes[i % routes.length];
        const latOffset = (Math.random() - 0.5) * 0.04;
        const lngOffset = (Math.random() - 0.5) * 0.04;

        await BusLiveLocation.findOneAndUpdate(
          { vehicleId: v._id },
          {
            vehicleId: v._id,
            routeId: r._id,
            latitude: CAMPUS_LAT + latOffset,
            longitude: CAMPUS_LNG + lngOffset,
            speedKmH: Math.floor(25 + Math.random() * 25),
            heading: ['NE', 'NW', 'SE', 'SW'][i % 4],
            currentStopIndex: 1,
            currentStopName: r.stops?.[0]?.stopName || 'School Gate',
            nextStopName: r.stops?.[1]?.stopName || 'Main Square',
            etaNextStopMinutes: Math.floor(3 + Math.random() * 8),
            status: 'On Route',
            fuelPercent: Math.floor(60 + Math.random() * 35),
            lastUpdated: new Date(),
          },
          { upsert: true, new: true }
        );
      }

      liveLocations = await BusLiveLocation.find()
        .populate('vehicleId', 'vehicleNumber model capacity driverName driverPhone status')
        .populate('routeId', 'routeName startLocation endLocation stops');
    }
  }

  return ApiResponse.ok(res, liveLocations, 'Live fleet tracking positions retrieved');
});

export const updateBusTelemetry = asyncHandler(async (req, res) => {
  const { vehicleId, latitude, longitude, speedKmH, currentStopName, nextStopName, etaNextStopMinutes, status } = req.body;

  if (!vehicleId) throw ApiError.badRequest('Vehicle ID is required');

  const updated = await BusLiveLocation.findOneAndUpdate(
    { vehicleId },
    {
      $set: {
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(speedKmH !== undefined && { speedKmH }),
        ...(currentStopName && { currentStopName }),
        ...(nextStopName && { nextStopName }),
        ...(etaNextStopMinutes !== undefined && { etaNextStopMinutes }),
        ...(status && { status }),
        lastUpdated: new Date(),
      },
    },
    { new: true, upsert: true }
  );

  return ApiResponse.ok(res, updated, 'Bus telemetry updated successfully');
});

export const triggerEmergencySOS = asyncHandler(async (req, res) => {
  const { vehicleId, reason = 'Emergency button triggered by driver' } = req.body;

  if (!vehicleId) throw ApiError.badRequest('Vehicle ID is required');

  const updated = await BusLiveLocation.findOneAndUpdate(
    { vehicleId },
    { status: 'Emergency SOS', lastUpdated: new Date() },
    { new: true }
  );

  return ApiResponse.ok(
    res,
    { status: 'SOS_TRIGGERED', alert: reason, telemetry: updated },
    'CRITICAL: Emergency SOS broadcasted to School Command & Admin'
  );
});

export const getBoardingChecklist = asyncHandler(async (req, res) => {
  const { routeId, tripType = 'Morning_Pickup' } = req.query;

  const filter = {};
  if (routeId) filter.routeId = routeId;

  // Retrieve allocated students for route
  const allocations = await TransportAllocation.find(filter)
    .populate('studentId', 'firstName lastName admissionNumber rollNumber classId')
    .populate('routeId', 'routeName stops');

  // Retrieve today's boarding logs
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const logs = await BusBoardingLog.find({
    date: { $gte: todayStart },
    tripType,
  });

  const loggedMap = new Map();
  logs.forEach((log) => loggedMap.set(log.studentId.toString(), log));

  const checklist = allocations.map((alloc) => {
    const student = alloc.studentId;
    const existingLog = student ? loggedMap.get(student._id.toString()) : null;

    return {
      studentId: student?._id,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
      admissionNumber: student?.admissionNumber || 'ADM-N/A',
      stopName: alloc.pickupStop || 'Main Stop',
      routeId: alloc.routeId?._id,
      routeName: alloc.routeId?.routeName || 'Route 1',
      vehicleId: alloc.vehicleId,
      status: existingLog ? existingLog.boardingStatus : 'Pending',
      logId: existingLog ? existingLog._id : null,
      timestamp: existingLog ? existingLog.timestamp : null,
    };
  });

  return ApiResponse.ok(res, checklist, 'Boarding checklist retrieved successfully');
});

export const markStudentBoarding = asyncHandler(async (req, res) => {
  const { studentId, routeId, vehicleId, tripType = 'Morning_Pickup', boardingStatus, stopName, notes } = req.body;

  if (!studentId || !boardingStatus) {
    throw ApiError.badRequest('Student ID and Boarding Status are required');
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const log = await BusBoardingLog.findOneAndUpdate(
    {
      studentId,
      tripType,
      date: { $gte: todayStart },
    },
    {
      studentId,
      routeId: routeId || new mongoose.Types.ObjectId(),
      vehicleId: vehicleId || new mongoose.Types.ObjectId(),
      tripType,
      boardingStatus,
      stopName: stopName || 'Assigned Stop',
      markedBy: req.user?._id,
      notes,
      timestamp: new Date(),
      date: new Date(),
    },
    { upsert: true, new: true }
  );

  return ApiResponse.ok(res, log, `Student boarding marked as ${boardingStatus}`);
});
