const cds = require('@sap/cds');

const { Customers, Products, Orders, OrderItems } = cds.entities;

exports.onlyAdmin = async function (req) {
  if (!req.user?.is('admin')) return req.reject(403);
};

exports.createOrders = async function (req) {
  const order = req.data;
  const items = order.items;
  const { id: userId } = req.user;
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

  order.totalPrice = parseFloat(total.toFixed(2));
  // order.createdBy = customer.name;
  // order.modifiedBy = customer.name;
};

exports.confirmOrders = async function (req) {
  const { ID } = req.params[0];
  if (!req.user.is('admin')) {
    return req.reject(403, 'Only admins can confirm orders.');
  }
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
};

exports.cancelOrders = async (req) => {
  const { ID } = req.params[0];
  const { id: customerId } = req.user;
  // if (!customerId) return req.reject(401);
  const customer = await SELECT.one(Customers).where({ ID: customerId });
  // if (!customer) return req.reject(404, 'Customer not found!');

  const order = await SELECT.one(Orders).where({ ID });

  console.log('CANCELLING ORDER>>>', order);
  if (!order) return req.reject(404, 'Order not found.');
  // if (
  //   order.customer_ID !== customerId ||
  //   !req.user?.is('admin') ||
  //   order.createdBy !== req.user?.id
  // )
  //   return req.reject(400, 'You cannot cancel this order!');
  if (['SHIPPED', 'CANCELLED'].includes(order.status?.toUpperCase())) {
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
};

exports.isAuthenticated = async (req) => {
  if (!req.user?.id) return req.reject(401);
};

exports.handleDeleteOrderItem = async (req) => {
  if (!req.user.is('admin')) return req.reject(403);
};
