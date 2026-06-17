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
  handleUploadProductImage,
  handleBeforeDeleteProduct,
  handleAfterReadOrderSummary,
  handleBeforeUpdateOrders,
  shipOrders,
} = require('../helpers');

module.exports = class OmsService extends cds.ApplicationService {
  async init() {
    this.before(['CREATE', 'UPDATE'], 'Products', onlyAdmin);
    this.before('READ', 'OrderSummary', isAuthenticated);
    this.before('DELETE', 'OrderItems', handleDeleteOrderItem);
    this.before('CREATE', 'Orders', handleBeforeCreateOrders);
    this.before('DELETE', 'Orders', onlyAdmin);
    this.before('UPDATE', 'Orders', handleBeforeUpdateOrders);
    this.before('DELETE', 'Products', handleBeforeDeleteProduct);

    this.on('confirm', 'Orders', confirmOrders);
    this.on('cancel', 'Orders', cancelOrders);
    this.on('uploadImage', handleUploadProductImage);
    this.on('ship', 'Orders', shipOrders);

    this.after('READ', 'Products', handleAfterReadProducts);
    this.after('READ', 'Orders', handleAfterReadOrders);
    this.after('READ', 'Customers', handleAfterReadCustomers);
    this.after('READ', 'OrderSummary', handleAfterReadOrderSummary);
    this.after('CREATE', 'Orders', handleAfterCreateOrders);

    await super.init();
  }
};
