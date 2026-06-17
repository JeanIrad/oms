const cds = require('@sap/cds');
const { deleteImage, uploadStream } = require('./cloudinary');

const { Customers, Products, Orders, OrderItems } = cds.entities;

exports.onlyAdmin = async function (req) {
  if (!req.user?.is('admin')) return req.reject(403);
  req.notify('Product created successfully!');
};

exports.handleBeforeCreateOrders = async function (req) {
  console.log('CDS ENTITIES>>>', cds.entities);
  const order = req.data;
  const items = order.items;
  const { id: userId } = req.user;
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
  console.log('Ordersummary reading.....');
  if (!req.user?.id) return req.reject(401);
  const orders = await SELECT.from(Orders);
  console.log('Orders retrieved>>', orders);
  if (!Array.isArray(orders) || !orders) return req.error('No order found yet');
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
  console.log('ORDERS>>>', orders);
  const list = Array.isArray(orders) ? orders : [orders];
  list.forEach((o) => {
    o.statusCriticality =
      o.status === 'CONFIRMED'
        ? 3
        : o.status === 'PENDING'
          ? 5
          : o.status === 'SHIPPED'
            ? 3
            : o.status === 'CANCELLED'
              ? 1
              : 0;
  });
};
exports.handleAfterReadCustomers = (customers) => {
  const list = Array.isArray(customers) ? customers : [customers];
  list.forEach((c) => {
    c.statusCriticality = c.status === 'Active' ? 3 : 1;
  });
};

exports.handleAfterCreateOrders = async (orders) => {
  console.log('After creating orders>>', orders);
  const ods = await SELECT.from(Orders);
  console.log('ORDERS RETRIEVED FROM DB>>', ods);
};

exports.handleUploadProductImage = async function (req) {
  console.log('REQUEST DATA>>>>', req.data);
  if (!req.user?.is('admin')) return req.reject(403, 'Admin access required.');
  const { ID } = req.params[0];

  const tx = cds.tx(req);
  const product = await tx.run(SELECT.one('oms.Products').where({ ID }));

  if (!product) return req.reject(404, `Product ${productId} not found.`);
  if (product.imagePublicId) {
    await deleteImage(product.imagePublicId);
  }

  const slug = `product_${ID}`.toLowerCase();

  try {
    const { imageUrl, imagePublicId } = await uploadStream(req.data, slug);
    console.log('imageUrl>>>', imageUrl);
    await tx.run(
      UPDATE('oms.Products').set({ imageUrl, imagePublicId }).where({ ID }),
    );
  } catch (err) {
    req.reject(502, `Image upload failed ${err.message}`);
  }
};

exports.handleImageRead = async (req) => {
  const { ID } = req.params[0];
  const product = await SELECT.one('oms.Products').where({ ID });

  if (!product?.imageUrl) {
    return req.reject(404, 'No image found for this product.');
  }

  // Redirect the OData media GET to the Cloudinary CDN URL
  req.res.redirect(302, product.imageUrl);
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
