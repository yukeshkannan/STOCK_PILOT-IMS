require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');
const { initDatabase, eventBus, EVENTS } = require('@stockpilot/common');
const financeService = require('./src/services/financeService');

const PORT = process.env.PORT || 5008;

async function startServer() {
  try {
    await initDatabase(sequelize, process.env.DB_NAME || 'finance_db');
    await eventBus.connect();

    // Event Consumer: Auto-create payment entry when sale is created
    await eventBus.subscribe('finance-sales-queue', EVENTS.SALE_CREATED, async (data) => {
      try {
        if (data.paidAmount > 0) {
          await financeService.createPayment(data.tenantId, {
            type: 'RECEIPT',
            referenceType: 'SALE',
            referenceId: data.invoiceNumber,
            partyName: data.customerName || 'Customer',
            paymentMethod: data.paymentMethod || 'CASH',
            amount: data.paidAmount,
            notes: `Auto receipt from Invoice #${data.invoiceNumber}`,
            createdBy: 'System'
          });
          console.log(`[Finance Service] Recorded payment for Sale #${data.invoiceNumber}`);
        }
      } catch (err) {
        console.error('[Finance Service] Error handling SALE_CREATED:', err.message);
      }
    });

    app.listen(PORT, () => {
      console.log(`💰 Payments, Expenses & Reporting Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Finance Service:', error);
    process.exit(1);
  }
}

startServer();
