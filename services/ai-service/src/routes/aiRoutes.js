const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken, enforceTenantIsolation } = require('@stockpilot/common');

// All AI Copilot endpoints are protected & tenant-isolated
router.use(authenticateToken);
router.use(enforceTenantIsolation);

router.post('/chat', aiController.chat);
router.get('/suggested-prompts', aiController.getSuggestedPrompts);

module.exports = router;
