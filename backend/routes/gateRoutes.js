const express = require('express');
const router = express.Router();
const { getGateStatus, openGate, closeGate } = require('../controllers/gateController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ESP32 polls this — no auth (LAN only)
router.get('/status', getGateStatus);

// Triggered after full OTP success — no auth (device on LAN)
router.post('/open', openGate);

// Admin manual close
router.post('/close', protect, adminOnly, closeGate);

module.exports = router;
