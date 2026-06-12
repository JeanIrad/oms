const cds = require('@sap/cds');

module.exports = class OmsService extends cds.ApplicationService {
  async init() {
    const { Products, Orders, OrderItems } = this.entities;

    this.before('CREATE', 'Orders', async (req) => {
      const order = req.data;
      const items = order.items;

      if (!items || items.length === 0) {
        return req.reject(400, 'An order must contain at least one item.');
      }

      let total = 0;

      for (const item of items) {
        const product = await SELECT.one(Products).where({
          ID: item.product_ID,
        });

        if (!product) {
          return req.reject(404, `Product ${item.product_ID} not found.`);
        }

        if (product.stock < item.quantity) {
          return req.reject(
            409,
            `Insufficient stock for "${product.name}". ` +
              `Requested: ${item.quantity}, available: ${product.stock}.`,
          );
        }

        item.unitPrice = product.price;
        item.lineTotal = parseFloat((item.quantity * product.price).toFixed(2));
        total += item.lineTotal;
      }

      order.totalPrice = parseFloat(total.toFixed(2));
    });

    this.after('CREATE', 'Orders', async (order) => {
      const items = await SELECT(OrderItems).where({ order_ID: order.ID });

      for (const item of items) {
        await UPDATE(Products)
          .set({ stock: { '-=': item.quantity } })
          .where({ ID: item.product_ID });
      }
    });

    this.on('confirm', 'Orders', async (req) => {
      const { ID } = req.params[0];
      const order = await SELECT.one(Orders).where({ ID });

      if (!order) return req.reject(404, 'Order not found.');
      if (order.status !== 'Draft') {
        return req.reject(
          409,
          `Cannot confirm an order in status ${order.status}.`,
        );
      }

      await UPDATE(Orders).set({ status: 'Confirmed' }).where({ ID });
      return SELECT.one(Orders).where({ ID });
    });

    this.on('cancel', 'Orders', async (req) => {
      const { ID } = req.params[0];
      const order = await SELECT.one(Orders).where({ ID });

      if (!order) return req.reject(404, 'Order not found.');
      if (['Shipped', 'Cancelled'].includes(order.status)) {
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

      await UPDATE(Orders).set({ status: 'Cancelled' }).where({ ID });
      return SELECT.one(Orders).where({ ID });
    });

    await super.init();
  }
};
