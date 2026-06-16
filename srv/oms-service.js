const cds = require('@sap/cds');
const {
  onlyAdmin,
  handleBeforeCreateOrders,
  confirmOrders,
  cancelOrders,
  isAuthenticated,
  handleDeleteOrderItem,
  handleAfterReadProducts,
  handleAfterReadOrders,
  handleAfterReadCustomers,
  handleAfterCreateOrders,
} = require('../helpers');

module.exports = class OmsService extends cds.ApplicationService {
  async init() {
    const { Products, Orders, OrderItems, Customers } = this.entities;

    this.before(['CREATE', 'UPDATE', 'DELETE'], 'Products', onlyAdmin);
    this.before('READ', 'OrderSummary', isAuthenticated);
    this.before('DELETE', 'OrderItems', handleDeleteOrderItem);
    this.before('CREATE', 'Orders', handleBeforeCreateOrders);
    this.before('DELETE', 'Orders', onlyAdmin);

    this.on('CREATE', 'Orders', async (req, next) => {
      console.log('ON CREATE ORDER STARTS');
      const results = await next();
      console.log('ON CREATE ORDER RESULTS>>', results);
      return results;
    });
    this.on('confirm', 'Orders', confirmOrders);
    this.on('cancel', 'Orders', cancelOrders);

    this.after('READ', 'Products', handleAfterReadProducts);
    this.after('READ', 'Orders', handleAfterReadOrders);
    this.after('READ', 'Customers', handleAfterReadCustomers);

    this.after('CREATE', 'Orders', handleAfterCreateOrders);

    await super.init();
  }
};
