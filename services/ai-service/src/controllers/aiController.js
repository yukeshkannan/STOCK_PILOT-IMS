const aiCopilotService = require('../services/aiCopilotService');

exports.chat = async (req, res) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId || req.headers['x-tenant-id'];
    const userId = req.user?.userId || req.user?.id;
    const userName = req.user?.name || req.user?.firstName || 'User';
    const companyName = req.user?.companyName || 'StockPilot Workspace';

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required for AI Copilot context.'
      });
    }

    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.'
      });
    }

    const result = await aiCopilotService.processChat({
      tenantId,
      userId,
      userName,
      companyName,
      message,
      history
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[AI Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI chat request.',
      error: error.message
    });
  }
};

exports.getSuggestedPrompts = async (req, res) => {
  try {
    const role = req.user?.role || 'ADMIN';
    const prompts = aiCopilotService.getSuggestedPrompts(role);
    return res.status(200).json({
      success: true,
      data: prompts
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch suggested prompts.'
    });
  }
};
