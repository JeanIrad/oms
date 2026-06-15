const cds = require('@sap/cds');

module.exports = class OmsService extends cds.ApplicationService {
  async init() {
    const { Products, Orders, OrderItems, Customers } = this.entities;

    this.before('CREATE', 'Orders', async (req) => {
      const order = req.data;
      const items = order.items;
      const { id: userId } = req.user;
      console.log('DB ENV>>>>', cds.env.requires?.db);
      console.log('REQUEST USER<<<<<', req.user);
      req.data.customer_ID = userId;
      if (!items || items.length === 0) {
        return req.reject(400, 'An order must contain at least one item.');
      }

      let total = 0;
      const transaction = cds.transaction(req);
      const customer = await transaction.run(
        SELECT.one.from(Customers).where({ ID: userId }),
      );

      // if (!customer) return req.reject(404, 'Customer not found!');
      for (const item of items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0)
          return req.reject(400, 'Please provide quantity for each product!');
        const product = await transaction.run(
          SELECT.one(Products).where({
            ID: item.product_ID,
          }),
        );

        if (!product) {
          return req.reject(404, `Product  not found.`);
        }

        if (product.stock < item.quantity) {
          return req.reject(
            409,
            `Insufficient stock for "${product.name}". ` +
              `Requested: ${item.quantity}, available: ${product.stock}.`,
          );
        }
        await transaction.run(
          UPDATE('oms.Products')
            .set({ stock: product.stock - item.quantity })
            .where({ ID: item.product_ID }),
        );
        item.unitPrice = product.price;
        item.lineTotal = parseFloat((item.quantity * product.price).toFixed(2));
        total += item.lineTotal;
      }
      console.log('PARSING UNDEFINED>>>>');

      order.totalPrice = parseFloat(total.toFixed(2));
      // order.createdBy = customer.name;
      // order.modifiedBy = customer.name;
    });

    this.on('confirm', 'Orders', async (req) => {
      const { ID } = req.params[0];
      console.log('PARAMS>>>', req.params);
      const transaction = cds.tx(req);
      const order = await transaction.run(SELECT.one(Orders).where({ ID }));

      if (!order) return req.reject(404, 'Order not found.');
      if (order.status !== 'PENDING') {
        return req.reject(
          409,
          `Cannot confirm an order in status ${order.status}.`,
        );
      }

      await UPDATE(Orders).set({ status: 'CONFIRMED' }).where({ ID });
      return SELECT.one(Orders).where({ ID });
    });
    this.before('DELETE', 'Orders', async (req) => {
      req.reject(401);
    });

    this.on('cancel', 'Orders', async (req) => {
      const { ID } = req.params[0];
      console.log('REQUEST USER', req.user);
      const { ID: customerId } = req.user;
      // if (!customerId) return req.reject(401);
      const customer = await SELECT.one(Customers).where({ ID: customerId });
      // if (!customer) return req.reject(404, 'Customer not found!');

      const order = await SELECT.one(Orders).where({ ID });
      if (!order) return req.reject(404, 'Order not found.');
      if (order.customer_ID !== customerId)
        return req.reject(400, 'You cannot cancel this order!');
      if (['SHIPPED', 'CANCELLED'].includes(order.status)) {
        return req.reject(
          409,
          `Cannot cancel an order in status "${order.status}".`,
        );
      }

      const items = await SELECT(OrderItems).where({ order_ID: ID });
      for (const item of items) {
        await UPDATE(Products)
          .set({ stock: { '+=': item.quantity } })
          .where({ ID: item.product_ID });
      }

      await UPDATE(Orders).set({ status: 'CANCELLED' }).where({ ID });
      return SELECT.one(Orders).where({ ID });
    });

    this.before('READ', 'OrderSummary', async (req) => {
      if (!req.user.id) return req.reject(401);
    });

    await super.init();
  }
};
