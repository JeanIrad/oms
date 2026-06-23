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
  handleBeforeReadProducts,
  handleBeforeReadCustomers,
  shipOrders,
  handleBeforeUpdateProduct,
  handleBeforeCreateCustomers,
  handleBeforeReadOrders,
} = require('./helpers');

module.exports = class OmsService extends cds.ApplicationService {
  async init() {
    this.before('CREATE', 'Products', onlyAdmin);
    this.before('UPDATE', 'Products', handleBeforeUpdateProduct);
    this.before('DELETE', 'Products', handleBeforeDeleteProduct);
    this.before('READ', 'Products', handleBeforeReadProducts);

    this.before('READ', 'OrderSummary', isAuthenticated);
    this.before('DELETE', 'OrderItems', handleDeleteOrderItem);
    this.before('CREATE', 'Orders', handleBeforeCreateOrders);
    this.before('DELETE', 'Orders', onlyAdmin);
    this.before('UPDATE', 'Orders', handleBeforeUpdateOrders);
    this.before('CREATE', 'Customers', handleBeforeCreateCustomers);
    this.before('READ', 'Customers', handleBeforeReadCustomers);
    this.before('READ', 'Orders', handleBeforeReadOrders);

    this.on('confirm', 'Orders', confirmOrders);
    this.on('cancel', 'Orders', cancelOrders);
    this.on('ship', 'Orders', shipOrders);
    this.on('uploadImage', handleUploadProductImage);

    this.after('READ', 'Products', handleAfterReadProducts);
    this.after('READ', 'Orders', handleAfterReadOrders);
    this.after('CREATE', 'Orders', handleAfterCreateOrders);
    this.after('READ', 'Customers', handleAfterReadCustomers);
    this.after('READ', 'OrderSummary', handleAfterReadOrderSummary);

    await super.init();
  }
};
