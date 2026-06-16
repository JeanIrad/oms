const cds = require('@sap/cds');
const {
  onlyAdmin,
  createOrders,
  confirmOrders,
  cancelOrders,
  isAuthenticated,
  handleDeleteOrderItem,
} = require('../helpers');

module.exports = class OmsService extends cds.ApplicationService {
  async init() {
    const { Products, Orders, OrderItems, Customers } = this.entities;

    this.before(['CREATE', 'UPDATE', 'DELETE'], 'Products', onlyAdmin);

    this.before('CREATE', 'Orders', createOrders);

    this.on('confirm', 'Orders', confirmOrders);
    this.before('DELETE', 'Orders', onlyAdmin);

    this.on('cancel', 'Orders', cancelOrders);

    this.before('READ', 'OrderSummary', isAuthenticated);
    this.before('DELETE', 'OrderItems', handleDeleteOrderItem);

    await super.init();
  }
};
