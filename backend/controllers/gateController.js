const AccessLog = require('../models/AccessLog');
const Card = require('../models/Card');
const Employee = require('../models/Employee');

// Gate state stored in memory (could be persisted if needed)
let gateState = { isOpen: false, lastOpened: null, lastClosed: null };

// @route  GET /api/gate/status
// @access Public (ESP32 polls this)
const getGateStatus = (req, res) => {
  res.json({ success: true, gate: gateState });
};

// @route  POST /api/gate/open
// @access Public (triggered by Biometric match or Admin click)
const openGate = async (req, res, next) => {
  try {
    const { cardNumber, fingerprintId, message } = req.body;

    gateState.isOpen = true;
    gateState.lastOpened = new Date();

    let logData = {
      event: 'GATE_OPEN',
      step: 'BIOMETRIC',
      message: message || 'Biometric Access Granted',
      ipAddress: req.ip,
    };

    // If card number or finger ID provided, try to find the person
    if (cardNumber || fingerprintId) {
      const card = await Card.findOne({ 
        $or: [
          { cardNumber: cardNumber },
          { fingerprintId: fingerprintId }
        ]
      }).populate('employeeId');

      if (card && card.employeeId) {
        logData.cardNumber = card.cardNumber;
        logData.employeeName = card.employeeId.fullName;
        logData.employeeId = card.employeeId.employeeId;
        
        // Update access count
        card.accessCount = (card.accessCount || 0) + 1;
        card.lastAccess = new Date();
        await card.save();
      }
    }

    await AccessLog.create(logData);

    // Auto-close after 10 seconds (simulate)
    setTimeout(async () => {
      gateState.isOpen = false;
      gateState.lastClosed = new Date();
      await AccessLog.create({
        event: 'GATE_CLOSE',
        step: 'GATE',
        message: 'Gate auto-closed (System Security)',
      });
    }, 10000);

    res.json({ success: true, message: 'Access Granted – Gate Opening', gate: gateState });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/gate/close
// @access Private
const closeGate = async (req, res, next) => {
  try {
    gateState.isOpen = false;
    gateState.lastClosed = new Date();

    await AccessLog.create({
      event: 'GATE_CLOSE',
      step: 'GATE',
      message: 'Gate manually closed by Security Officer',
    });

    res.json({ success: true, message: 'Gate closed.', gate: gateState });
  } catch (error) {
    next(error);
  }
};

module.exports = { getGateStatus, openGate, closeGate };
