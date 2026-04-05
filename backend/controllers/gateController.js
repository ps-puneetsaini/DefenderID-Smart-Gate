const AccessLog = require('../models/AccessLog');

// Gate state stored in memory (could be persisted if needed)
let gateState = { isOpen: false, lastOpened: null, lastClosed: null };

// @route  GET /api/gate/status
// @access Public (ESP32 polls this)
const getGateStatus = (req, res) => {
  res.json({ success: true, gate: gateState });
};

// @route  POST /api/gate/open
// @access Public (triggered after OTP success)
const openGate = async (req, res, next) => {
  try {
    const { rfidUid, employeeName, employeeId, cardNumber } = req.body;

    gateState.isOpen = true;
    gateState.lastOpened = new Date();

    await AccessLog.create({
      cardNumber: cardNumber || null,
      rfidUid: rfidUid || null,
      employeeName: employeeName || 'Unknown',
      employeeId: employeeId || null,
      event: 'GATE_OPEN',
      step: 'GATE',
      message: 'Gate opened – Access Granted',
      ipAddress: req.ip,
    });

    // Auto-close after 10 seconds (simulate)
    setTimeout(async () => {
      gateState.isOpen = false;
      gateState.lastClosed = new Date();
      await AccessLog.create({
        event: 'GATE_CLOSE',
        step: 'GATE',
        message: 'Gate auto-closed after 10s',
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
      message: 'Gate manually closed by admin',
    });

    res.json({ success: true, message: 'Gate closed.', gate: gateState });
  } catch (error) {
    next(error);
  }
};

module.exports = { getGateStatus, openGate, closeGate };
