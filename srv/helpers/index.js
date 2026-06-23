const cds = require('@sap/cds');
const { deleteImage } = require('./cloudinary');

const { Customers, Products, Orders, OrderItems } = cds.entities;

const statusCriticalityHelper = (rows) => {
  const list = Array.isArray(rows) ? rows : [rows];
  list.forEach((r) => {
    r.statusCriticality =
      r.status === 'CONFIRMED'
        ? 3
        : r.status === 'PENDING'
          ? 5
          : r.status === 'SHIPPED'
            ? 3
            : r.status === 'CANCELLED'
              ? 1
              : 0;
  });
};

exports.onlyAdmin = async function (req) {
  console.log('UPDATING...', req.params);
  if (!req.user?.is('admin')) return req.reject(403);
  req.notify('Product created successfully!');
};

exports.handleBeforeCreateOrders = async function (req) {
  const order = req.data;
  const items = order?.items;
  const { id: userId } = req.user;
  if (order.cancellationReason.trim().length > 0)
    req.error(400, 'Provide cancel reason only when cancelling order');
  if (!items || items.length === 0) {
    return req.reject(400, 'An order must contain at least one item.');
  }
  console.log('ON CREATE STARTS');
  let total = 0;
  const transaction = cds.transaction(req);
  const customer = await transaction.run(
    SELECT.one.from(Customers).where({ ID: order?.customer_ID }),
  );
  // req.data.customer_ID = userId;

  if (!customer) return req.reject(400, 'Customer not found!');
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0)
      return req.reject(400, 'Please provide quantity for each product!');
    const product = await transaction.run(
      SELECT.one(Products).where({
        ID: item.product_ID,
      }),
    );

    if (!product || product.stock <= 0) {
      return req.reject(
        404,
        `Product ${product?.name ?? 'NO PRODUCT'} not in stock`,
      );
    }

    if (product.stock < item.quantity) {
      return req.reject(
        409,
        `Insufficient stock for "${product.name}". ` +
          `Requested: ${item.quantity}, available: ${product.stock}.`,
      );
    }
    await transaction.run(
      UPDATE(Products)
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
  return req.notify('Order created successfully');
};

exports.confirmOrders = async function (req) {
  console.log('CONFIRMING ORDERS....');
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
  return await SELECT.one(Orders).where({ ID });
};

exports.cancelOrders = async (req) => {
  console.log('CANCELLING ORDER...');
  const { ID } = req.params[0];
  const { reason } = req.data;
  if (!reason || reason.trim().length === 0) {
    return req.reject(400, 'A cancellation reason is required.');
  }
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

  await UPDATE(Orders)
    .set({ status: 'CANCELLED', cancellationReason: reason.trim() })
    .where({ ID });
  return SELECT.one(Orders).where({ ID });
};

exports.isAuthenticated = async (req) => {
  if (!req.user?.id) return req.reject(401);
};

exports.handleDeleteOrderItem = async (req) => {
  if (!req.user.is('admin')) return req.reject(403);
};

exports.handleAfterReadProducts = (products) => {
  const list = Array.isArray(products) ? products : [products];
  list.forEach((p) => {
    // Stock criticality — red below 10, orange below 50, green otherwise
    p.stockCriticality = p.stock <= 0 ? 1 : p.stock <= 10 ? 2 : 3;

    // Status criticality
    p.statusCriticality =
      p.status === 'Active' ? 3 : p.status === 'Inactive' ? 1 : 0;
  });
};

exports.handleAfterReadOrders = (orders) => {
  console.log('orders', orders);
  statusCriticalityHelper(orders);
};
exports.handleAfterReadCustomers = (customers) => {
  const list = Array.isArray(customers) ? customers : [customers];
  list.forEach((c) => {
    c.statusCriticality = c.status === 'Active' ? 3 : 1;
  });
};

exports.handleAfterCreateOrders = async (orders) => {
  const ods = await SELECT.from(Orders);
  console.log('ORDERS RETRIEVED FROM DB>>', ods);
};

exports.handleUploadProductImage = async function (req) {
  console.log('REQUEST DATA>>>>', req.data);
  if (!req.user?.is('admin')) return req.reject(403, 'Admin access required.');
  const { productId, imageData, fileName } = req.data;

  if (!productId) return req.reject(400, 'productId is required.');
  if (!imageData) return req.reject(400, 'imageData is required.');

  if (!imageData.startsWith('data:image/')) {
    return req.reject(
      400,
      'imageData must be a base64 data URI (data:image/...).',
    );
  }
  const tx = cds.tx(req);
  const product = await tx.run(
    SELECT.one('oms.Products').where({ ID: productId }),
  );

  if (!product) return req.reject(404, `Product ${productId} not found.`);
  if (product.imagePublicId) {
    await deleteImage(product.imagePublicId);
  }

  const slug = (fileName || productId)
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();

  const { imageUrl, imagePublicId } = await uploadImage(imageData, slug);

  await tx.run(
    UPDATE('oms.Products')
      .set({ imageUrl, imagePublicId })
      .where({ ID: productId }),
  );

  return { imageUrl, imagePublicId };
};

exports.handleBeforeDeleteProduct = async (req) => {
  if (!req.user?.is('admin')) return req.reject(403, 'Admin access required.');

  const { ID } = req.params[0];
  const tx = cds.tx(req);
  const product = await tx.run(SELECT.one('oms.Products').where({ ID }));

  if (product?.imagePublicId) {
    await deleteImage(product.imagePublicId);
  }
};

exports.handleAfterReadOrderSummary = (rows) => {
  console.log('READING ORDER SUMMARY', rows);
  statusCriticalityHelper(rows);
};

exports.handleBeforeUpdateOrders = async (req) => {
  const { ID } = req.params[0];

  const order = await SELECT.one(Orders).where({ ID });
  if (!order) return req.reject(404, 'Order not found!');
  if (['CANCELLED', 'SHIPPED'].includes(order.status.toUpperCase()))
    return req.reject(
      409,
      `Cannot update this order with status: ${order.status}.`,
    );
  console.log('CANCELL REASON>>>', order);
  if (order.cancellationReason?.trim()?.length > 0)
    req.reject(400, 'Provide reason only when cancelling this order ');
  return req.notify('Order updated successfully');
};

exports.shipOrders = async (req) => {
  if (!req.user.is('admin')) {
    return req.reject(403, 'Only admins can mark orders as shipped.');
  }

  const { ID } = req.params[0];
  const order = await SELECT.one('oms.Orders').where({ ID });

  if (!order) return req.reject(404, 'Order not found.');
  if (order.status !== 'CONFIRMED') {
    return req.reject(
      409,
      `Cannot ship an order in status "${order.status}". Order must be Confirmed first.`,
    );
  }

  await UPDATE('oms.Orders').set({ status: 'SHIPPED' }).where({ ID });
  return SELECT.one('oms.Orders').where({ ID });
};

exports.handleBeforeReadProducts = async function (req) {
  console.log('req params', req.params[0]);
};

exports.handleBeforeUpdateProduct = async function (req) {
  const path = req.path;
};

exports.handleBeforeReadCustomers = async function (req) {
  if (!req.user?.is('admin'))
    // const currentUser =  await SELECT.one(Customers).where({ createdBy: req.user?.id });
    return req.reject(403);

  // if (!req.user.is('admin') || !req.user.is('authenticated-user'))
  //   return req.reject(401);
  // if (!req.user.is('admin')) {
  //   const customer = await SELECT.one(Customers).where({
  //     createdBy: req.user?.id,
  //   });
  //   return customer ? customer : null;
  // }
  // if (req.user.is('admin')) {
  //   const users = await SELECT.from(Customers);
  //   return Array.isArray(users) && users.length > 0 ? users : null;
  // }
};

exports.handleBeforeCreateCustomers = async function (req) {
  const creator = req.user?.id;
  if (!req.user?.is('admin')) {
    const customers = await SELECT.from(Customers).where({
      createdBy: creator,
    });
    if (Array.isArray(customers) && customers.length > 0)
      req.reject(403, 'Only one customer you can create!');
  }
};

exports.handleBeforeReadOrders = async (req) => {
  console.log('<<REQUEST USER>', req.user);
};
