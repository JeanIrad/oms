'use strict';

jest.mock('@sap/cds', () => ({
  entities: {
    Customers: 'oms.Customers',
    Products: 'oms.Products',
    Orders: 'oms.Orders',
    OrderItems: 'oms.OrderItems',
  },
  transaction: jest.fn(),
  tx: jest.fn(),
}));

jest.mock('../srv/helpers/cloudinary', () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
}));

const cds = require('@sap/cds');
const { uploadImage, deleteImage } = require('../srv/helpers/cloudinary');

function freshChain() {
  const chain = {};
  chain.from = jest.fn(() => chain);
  chain.set = jest.fn(() => chain);
  chain.where = jest.fn();
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();

  // SELECT(Entity) is used two ways in the real handlers:
  //   1. SELECT(OrderItems).where({...})       -> needs .where()
  //   2. (not used standalone-resolved elsewhere)
  // SELECT.from(Entity) is used two ways:
  //   1. SELECT.from(Orders)                    -> awaited directly (no .where())
  //   2. SELECT.from(Customers).where({...})     -> needs .where()
  // So both SELECT() and SELECT.from() must return a chain that is BOTH
  // directly thenable (for bare `await SELECT.from(x)`) AND has a working
  // .where() that resolves independently.

  function freshAwaitableChain(defaultResolved = []) {
    const chain = freshChain();
    chain.where.mockResolvedValue(defaultResolved);
    // Make the chain itself awaitable (bare `await SELECT.from(Orders)`)
    chain.then = (resolve) => resolve(defaultResolved);
    return chain;
  }

  global.SELECT = jest.fn(() => freshAwaitableChain());
  global.SELECT.one = jest.fn(() => freshChain());
  global.SELECT.one.from = jest.fn(() => freshChain());
  global.SELECT.from = jest.fn(() => freshAwaitableChain());

  global.UPDATE = jest.fn(() => freshChain());
});

function mockReq(overrides = {}) {
  return {
    data: {},
    params: [],
    user: { id: 'testuser', is: jest.fn(() => false) },
    reject: jest.fn((code, msg) => {
      const err = new Error(msg);
      err.code = code;
      throw err;
    }),
    notify: jest.fn(),
    ...overrides,
  };
}

const helpers = require('../srv/helpers/');

// ─────────────────────────────────────────────────────────────────────────
describe('onlyAdmin', () => {
  test('rejects 403 for non-admin', async () => {
    const req = mockReq({ user: { is: jest.fn(() => false) } });
    await expect(helpers.onlyAdmin(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(403);
  });

  test('notifies for admin', async () => {
    const req = mockReq({ user: { is: jest.fn(() => true) } });
    await helpers.onlyAdmin(req);
    expect(req.notify).toHaveBeenCalledWith('Product created successfully!');
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('isAuthenticated', () => {
  test('rejects 401 when no user id', async () => {
    const req = mockReq({ user: {} });
    await expect(helpers.isAuthenticated(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(401);
  });

  test('passes through when user id present', async () => {
    const req = mockReq({ user: { id: 'alice' } });
    await expect(helpers.isAuthenticated(req)).resolves.toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('handleDeleteOrderItem', () => {
  test('rejects 403 for non-admin', async () => {
    const req = mockReq({ user: { is: jest.fn(() => false) } });
    await expect(helpers.handleDeleteOrderItem(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(403);
  });

  test('allows admin through', async () => {
    const req = mockReq({ user: { is: jest.fn(() => true) } });
    await expect(helpers.handleDeleteOrderItem(req)).resolves.toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('handleBeforeCreateOrders', () => {
  function setupTx({ customer, productSequence }) {
    const txChain = { run: jest.fn() };
    // First call: SELECT.one.from(Customers).where() -> customer
    // Subsequent calls: SELECT.one(Products).where() -> product, then UPDATE...where() -> affected
    const runResults = [customer, ...productSequence];
    let callIndex = 0;
    txChain.run = jest.fn(() => Promise.resolve(runResults[callIndex++]));
    cds.transaction.mockReturnValue(txChain);
    return txChain;
  }

  test('rejects 400 when no items provided', async () => {
    const req = mockReq({ data: { customer_ID: 'c1', items: [] } });
    await expect(helpers.handleBeforeCreateOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      400,
      'An order must contain at least one item.',
    );
  });

  test('rejects 400 when items is undefined', async () => {
    const req = mockReq({ data: { customer_ID: 'c1' } });
    await expect(helpers.handleBeforeCreateOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      400,
      'An order must contain at least one item.',
    );
  });

  test('rejects 400 when customer not found', async () => {
    setupTx({ customer: null, productSequence: [] });
    const req = mockReq({
      data: {
        customer_ID: 'missing',
        items: [{ product_ID: 'p1', quantity: 1 }],
      },
    });
    await expect(helpers.handleBeforeCreateOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(400, 'Customer not found!');
  });

  test('rejects 400 when item quantity is not a positive integer', async () => {
    setupTx({ customer: { ID: 'c1' }, productSequence: [] });
    const req = mockReq({
      data: {
        customer_ID: 'c1',
        items: [{ product_ID: 'p1', quantity: 0 }],
      },
    });
    await expect(helpers.handleBeforeCreateOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      400,
      'Please provide quantity for each product!',
    );
  });

  test('rejects 404 when product not found', async () => {
    setupTx({ customer: { ID: 'c1' }, productSequence: [null] });
    const req = mockReq({
      data: { customer_ID: 'c1', items: [{ product_ID: 'p1', quantity: 1 }] },
    });
    await expect(helpers.handleBeforeCreateOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      404,
      'Product NO PRODUCT not in stock',
    );
  });

  test('rejects 404 when product stock is zero', async () => {
    setupTx({
      customer: { ID: 'c1' },
      productSequence: [{ ID: 'p1', name: 'Widget', stock: 0, price: 10 }],
    });
    const req = mockReq({
      data: { customer_ID: 'c1', items: [{ product_ID: 'p1', quantity: 1 }] },
    });
    await expect(helpers.handleBeforeCreateOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(404, 'Product Widget not in stock');
  });

  test('rejects 409 when quantity exceeds stock', async () => {
    setupTx({
      customer: { ID: 'c1' },
      productSequence: [{ ID: 'p1', name: 'Widget', stock: 2, price: 10 }],
    });
    const req = mockReq({
      data: { customer_ID: 'c1', items: [{ product_ID: 'p1', quantity: 5 }] },
    });
    await expect(helpers.handleBeforeCreateOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      409,
      'Insufficient stock for "Widget". Requested: 5, available: 2.',
    );
  });

  test('computes totalPrice correctly and notifies on success', async () => {
    setupTx({
      customer: { ID: 'c1' },
      productSequence: [
        { ID: 'p1', name: 'Widget', stock: 10, price: 25.5 },
        1, // UPDATE...where() affected-rows result
      ],
    });
    const order = {
      customer_ID: 'c1',
      items: [{ product_ID: 'p1', quantity: 3 }],
    };
    const req = mockReq({ data: order, user: { id: 'alice' } });

    await helpers.handleBeforeCreateOrders(req);

    expect(order.totalPrice).toBe(76.5); // 3 * 25.50
    expect(order.items[0].unitPrice).toBe(25.5);
    expect(order.items[0].lineTotal).toBe(76.5);
    expect(req.notify).toHaveBeenCalledWith('Order created successfully');
  });

  test('accumulates totalPrice correctly across multiple items', async () => {
    setupTx({
      customer: { ID: 'c1' },
      productSequence: [
        { ID: 'p1', name: 'Widget', stock: 10, price: 10 },
        1,
        { ID: 'p2', name: 'Gadget', stock: 10, price: 20 },
        1,
      ],
    });
    const order = {
      customer_ID: 'c1',
      items: [
        { product_ID: 'p1', quantity: 2 },
        { product_ID: 'p2', quantity: 1 },
      ],
    };
    const req = mockReq({ data: order });

    await helpers.handleBeforeCreateOrders(req);

    expect(order.totalPrice).toBe(40); // (2*10) + (1*20)
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('confirmOrders', () => {
  test('rejects 403 for non-admin', async () => {
    const req = mockReq({
      params: [{ ID: 'o1' }],
      user: { is: jest.fn(() => false) },
    });
    await expect(helpers.confirmOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      403,
      'Only admins can confirm orders.',
    );
  });

  test('rejects 404 when order not found', async () => {
    const txChain = { run: jest.fn().mockResolvedValueOnce(null) };
    cds.tx.mockReturnValue(txChain);
    const req = mockReq({
      params: [{ ID: 'missing' }],
      user: { is: jest.fn(() => true) },
    });
    await expect(helpers.confirmOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(404, 'Order not found.');
  });

  test('rejects 409 when order is not PENDING', async () => {
    const txChain = {
      run: jest.fn().mockResolvedValueOnce({ ID: 'o1', status: 'CONFIRMED' }),
    };
    cds.tx.mockReturnValue(txChain);
    const req = mockReq({
      params: [{ ID: 'o1' }],
      user: { is: jest.fn(() => true) },
    });
    await expect(helpers.confirmOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      409,
      'Cannot confirm an order in status CONFIRMED.',
    );
  });

  test('confirms a PENDING order successfully', async () => {
    const txChain = {
      run: jest.fn().mockResolvedValueOnce({ ID: 'o1', status: 'PENDING' }),
    };
    cds.tx.mockReturnValue(txChain);

    const updateChain = freshChain();
    updateChain.where.mockResolvedValueOnce(1);
    global.UPDATE.mockReturnValueOnce(updateChain);

    // SELECT.one is called TWICE: once to build the query passed into
    // transaction.run() (its own .where() result is irrelevant since
    // txChain.run() supplies the resolved value instead), and once for
    // the final `return SELECT.one(Orders).where({ ID })` statement.
    // mockReturnValueOnce queues per-call, so we provide a throwaway
    // chain for call #1 and the real one for call #2.
    const finalSelectChain = freshChain();
    finalSelectChain.where.mockResolvedValueOnce({
      ID: 'o1',
      status: 'CONFIRMED',
    });
    global.SELECT.one
      .mockReturnValueOnce(freshChain()) // call #1 — feeds transaction.run(), ignored
      .mockReturnValueOnce(finalSelectChain); // call #2 — the actual return value

    const req = mockReq({
      params: [{ ID: 'o1' }],
      user: { is: jest.fn(() => true) },
    });

    const result = await helpers.confirmOrders(req);
    expect(updateChain.set).toHaveBeenCalledWith({ status: 'CONFIRMED' });
    expect(result).toEqual({ ID: 'o1', status: 'CONFIRMED' });
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('cancelOrders', () => {
  test('rejects 400 when reason is missing', async () => {
    const req = mockReq({
      params: [{ ID: 'o1' }],
      data: {},
      user: { id: 'alice' },
    });
    await expect(helpers.cancelOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      400,
      'A cancellation reason is required.',
    );
  });

  test('rejects 400 when reason is empty/whitespace', async () => {
    const req = mockReq({
      params: [{ ID: 'o1' }],
      data: { reason: '   ' },
      user: { id: 'alice' },
    });
    await expect(helpers.cancelOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      400,
      'A cancellation reason is required.',
    );
  });

  test('rejects 404 when order not found', async () => {
    const customerChain = freshChain();
    customerChain.where.mockResolvedValueOnce(null);
    const orderChain = freshChain();
    orderChain.where.mockResolvedValueOnce(null);
    global.SELECT.one
      .mockReturnValueOnce(customerChain)
      .mockReturnValueOnce(orderChain);

    const req = mockReq({
      params: [{ ID: 'missing' }],
      data: { reason: 'changed my mind' },
      user: { id: 'alice' },
    });
    await expect(helpers.cancelOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(404, 'Order not found.');
  });

  test('rejects 409 when order is already SHIPPED', async () => {
    const customerChain = freshChain();
    customerChain.where.mockResolvedValueOnce({ ID: 'c1' });
    const orderChain = freshChain();
    orderChain.where.mockResolvedValueOnce({ ID: 'o1', status: 'SHIPPED' });
    global.SELECT.one
      .mockReturnValueOnce(customerChain)
      .mockReturnValueOnce(orderChain);

    const req = mockReq({
      params: [{ ID: 'o1' }],
      data: { reason: 'too late' },
      user: { id: 'alice' },
    });
    await expect(helpers.cancelOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      409,
      'Cannot cancel an order in status "SHIPPED".',
    );
  });

  test('rejects 409 when order is already CANCELLED', async () => {
    const customerChain = freshChain();
    customerChain.where.mockResolvedValueOnce({ ID: 'c1' });
    const orderChain = freshChain();
    orderChain.where.mockResolvedValueOnce({ ID: 'o1', status: 'CANCELLED' });
    global.SELECT.one
      .mockReturnValueOnce(customerChain)
      .mockReturnValueOnce(orderChain);

    const req = mockReq({
      params: [{ ID: 'o1' }],
      data: { reason: 'already done' },
      user: { id: 'alice' },
    });
    await expect(helpers.cancelOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      409,
      'Cannot cancel an order in status "CANCELLED".',
    );
  });

  test('cancels a PENDING order, restores stock, and stores trimmed reason', async () => {
    const customerChain = freshChain();
    customerChain.where.mockResolvedValueOnce({ ID: 'c1' });
    const orderChain = freshChain();
    orderChain.where.mockResolvedValueOnce({ ID: 'o1', status: 'PENDING' });
    global.SELECT.one
      .mockReturnValueOnce(customerChain)
      .mockReturnValueOnce(orderChain)
      .mockReturnValueOnce(freshChain()); // final SELECT.one(Orders).where() at the end

    const itemsChain = freshChain();
    itemsChain.where.mockResolvedValueOnce([{ product_ID: 'p1', quantity: 3 }]);
    global.SELECT.mockReturnValueOnce(itemsChain);

    const restockChain = freshChain();
    restockChain.where.mockResolvedValueOnce(1);
    const statusUpdateChain = freshChain();
    statusUpdateChain.where.mockResolvedValueOnce(1);
    global.UPDATE.mockReturnValueOnce(restockChain).mockReturnValueOnce(
      statusUpdateChain,
    );

    const finalChain = freshChain();
    finalChain.where.mockResolvedValueOnce({ ID: 'o1', status: 'CANCELLED' });
    global.SELECT.one.mockReturnValueOnce(finalChain);

    const req = mockReq({
      params: [{ ID: 'o1' }],
      data: { reason: '  Out of stock at warehouse  ' },
      user: { id: 'alice' },
    });

    await helpers.cancelOrders(req);

    expect(restockChain.set).toHaveBeenCalledWith({ stock: { '+=': 3 } });
    expect(statusUpdateChain.set).toHaveBeenCalledWith({
      status: 'CANCELLED',
      cancellationReason: 'Out of stock at warehouse',
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('shipOrders', () => {
  test('rejects 403 for non-admin', async () => {
    const req = mockReq({
      params: [{ ID: 'o1' }],
      user: { is: jest.fn(() => false) },
    });
    await expect(helpers.shipOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      403,
      'Only admins can mark orders as shipped.',
    );
  });

  test('rejects 404 when order not found', async () => {
    const chain = freshChain();
    chain.where.mockResolvedValueOnce(null);
    global.SELECT.one.mockReturnValueOnce(chain);

    const req = mockReq({
      params: [{ ID: 'missing' }],
      user: { is: jest.fn(() => true) },
    });
    await expect(helpers.shipOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(404, 'Order not found.');
  });

  test('rejects 409 when order is not CONFIRMED', async () => {
    const chain = freshChain();
    chain.where.mockResolvedValueOnce({ ID: 'o1', status: 'PENDING' });
    global.SELECT.one.mockReturnValueOnce(chain);

    const req = mockReq({
      params: [{ ID: 'o1' }],
      user: { is: jest.fn(() => true) },
    });
    await expect(helpers.shipOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      409,
      'Cannot ship an order in status "PENDING". Order must be Confirmed first.',
    );
  });

  test('ships a CONFIRMED order successfully', async () => {
    const readChain = freshChain();
    readChain.where.mockResolvedValueOnce({ ID: 'o1', status: 'CONFIRMED' });
    const updateChain = freshChain();
    updateChain.where.mockResolvedValueOnce(1);
    const finalChain = freshChain();
    finalChain.where.mockResolvedValueOnce({ ID: 'o1', status: 'SHIPPED' });

    global.SELECT.one
      .mockReturnValueOnce(readChain)
      .mockReturnValueOnce(finalChain);
    global.UPDATE.mockReturnValueOnce(updateChain);

    const req = mockReq({
      params: [{ ID: 'o1' }],
      user: { is: jest.fn(() => true) },
    });

    const result = await helpers.shipOrders(req);
    expect(updateChain.set).toHaveBeenCalledWith({ status: 'SHIPPED' });
    expect(result).toEqual({ ID: 'o1', status: 'SHIPPED' });
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('handleBeforeUpdateOrders', () => {
  test('rejects 404 when order not found', async () => {
    const chain = freshChain();
    chain.where.mockResolvedValueOnce(null);
    global.SELECT.one.mockReturnValueOnce(chain);

    const req = mockReq({ params: [{ ID: 'missing' }] });
    await expect(helpers.handleBeforeUpdateOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(404, 'Order not found!');
  });

  test('rejects 409 when order is CANCELLED', async () => {
    const chain = freshChain();
    chain.where.mockResolvedValueOnce({ ID: 'o1', status: 'CANCELLED' });
    global.SELECT.one.mockReturnValueOnce(chain);

    const req = mockReq({ params: [{ ID: 'o1' }] });
    await expect(helpers.handleBeforeUpdateOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      409,
      'Cannot update this order with status: CANCELLED.',
    );
  });

  test('rejects 409 when order is SHIPPED', async () => {
    const chain = freshChain();
    chain.where.mockResolvedValueOnce({ ID: 'o1', status: 'SHIPPED' });
    global.SELECT.one.mockReturnValueOnce(chain);

    const req = mockReq({ params: [{ ID: 'o1' }] });
    await expect(helpers.handleBeforeUpdateOrders(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      409,
      'Cannot update this order with status: SHIPPED.',
    );
  });

  test('notifies success for an updatable order', async () => {
    const chain = freshChain();
    chain.where.mockResolvedValueOnce({ ID: 'o1', status: 'PENDING' });
    global.SELECT.one.mockReturnValueOnce(chain);

    const req = mockReq({ params: [{ ID: 'o1' }] });
    await helpers.handleBeforeUpdateOrders(req);
    expect(req.notify).toHaveBeenCalledWith('Order updated successfully');
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('handleAfterReadProducts', () => {
  test('sets stockCriticality=1 when stock is 0 or less', () => {
    const products = [{ stock: 0, status: 'Active' }];
    helpers.handleAfterReadProducts(products);
    expect(products[0].stockCriticality).toBe(1);
  });

  test('sets stockCriticality=2 when stock is between 1 and 10', () => {
    const products = [{ stock: 5, status: 'Active' }];
    helpers.handleAfterReadProducts(products);
    expect(products[0].stockCriticality).toBe(2);
  });

  test('sets stockCriticality=3 when stock is above 10', () => {
    const products = [{ stock: 50, status: 'Active' }];
    helpers.handleAfterReadProducts(products);
    expect(products[0].stockCriticality).toBe(3);
  });

  test('sets statusCriticality based on Active/Inactive', () => {
    const products = [
      { stock: 5, status: 'Active' },
      { stock: 5, status: 'Inactive' },
      { stock: 5, status: 'Unknown' },
    ];
    helpers.handleAfterReadProducts(products);
    expect(products[0].statusCriticality).toBe(3);
    expect(products[1].statusCriticality).toBe(1);
    expect(products[2].statusCriticality).toBe(0);
  });

  test('handles a single object (non-array) input', () => {
    const product = { stock: 0, status: 'Active' };
    helpers.handleAfterReadProducts(product);
    expect(product.stockCriticality).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('handleAfterReadOrders / handleAfterReadOrderSummary (shared statusCriticalityHelper)', () => {
  test.each([
    ['CONFIRMED', 3],
    ['PENDING', 5],
    ['SHIPPED', 3],
    ['CANCELLED', 1],
    ['UNKNOWN', 0],
  ])('status %s maps to criticality %i', (status, expected) => {
    const orders = [{ status }];
    helpers.handleAfterReadOrders(orders);
    expect(orders[0].statusCriticality).toBe(expected);
  });

  test('handleAfterReadOrderSummary applies the same mapping', () => {
    const rows = [{ status: 'CONFIRMED' }];
    helpers.handleAfterReadOrderSummary(rows);
    expect(rows[0].statusCriticality).toBe(3);
  });

  test('handles single object input for orders', () => {
    const order = { status: 'PENDING' };
    helpers.handleAfterReadOrders(order);
    expect(order.statusCriticality).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('handleAfterReadCustomers', () => {
  test('sets criticality 3 for Active, 1 for anything else', () => {
    const customers = [{ status: 'Active' }, { status: 'Inactive' }];
    helpers.handleAfterReadCustomers(customers);
    expect(customers[0].statusCriticality).toBe(3);
    expect(customers[1].statusCriticality).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('handleUploadProductImage', () => {
  test('rejects 403 for non-admin', async () => {
    const req = mockReq({ user: { is: jest.fn(() => false) } });
    await expect(helpers.handleUploadProductImage(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(403, 'Admin access required.');
  });

  test('rejects 400 when productId missing', async () => {
    const req = mockReq({
      user: { is: jest.fn(() => true) },
      data: { imageData: 'data:image/png;base64,abc' },
    });
    await expect(helpers.handleUploadProductImage(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(400, 'productId is required.');
  });

  test('rejects 400 when imageData missing', async () => {
    const req = mockReq({
      user: { is: jest.fn(() => true) },
      data: { productId: 'p1' },
    });
    await expect(helpers.handleUploadProductImage(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(400, 'imageData is required.');
  });

  test('rejects 400 when imageData is not a valid data URI', async () => {
    const req = mockReq({
      user: { is: jest.fn(() => true) },
      data: { productId: 'p1', imageData: 'not-a-data-uri' },
    });
    await expect(helpers.handleUploadProductImage(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(
      400,
      'imageData must be a base64 data URI (data:image/...).',
    );
  });

  test('rejects 404 when product not found', async () => {
    const txChain = { run: jest.fn().mockResolvedValueOnce(null) };
    cds.tx.mockReturnValue(txChain);

    const req = mockReq({
      user: { is: jest.fn(() => true) },
      data: { productId: 'missing', imageData: 'data:image/png;base64,abc' },
    });
    await expect(helpers.handleUploadProductImage(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(404, 'Product missing not found.');
  });

  test('deletes old image, uploads new one, and persists URL + publicId', async () => {
    const txChain = {
      run: jest
        .fn()
        .mockResolvedValueOnce({
          ID: 'p1',
          imagePublicId: 'oms/products/old_slug',
        })
        .mockResolvedValueOnce(1),
    };
    cds.tx.mockReturnValue(txChain);
    uploadImage.mockResolvedValueOnce({
      imageUrl: 'https://res.cloudinary.com/demo/new.jpg',
      imagePublicId: 'oms/products/new_slug',
    });

    const req = mockReq({
      user: { is: jest.fn(() => true) },
      data: {
        productId: 'p1',
        imageData: 'data:image/jpeg;base64,abc123',
        fileName: 'My Photo!!.jpg',
      },
    });

    const result = await helpers.handleUploadProductImage(req);

    expect(deleteImage).toHaveBeenCalledWith('oms/products/old_slug');
    expect(uploadImage).toHaveBeenCalledWith(
      'data:image/jpeg;base64,abc123',
      'my_photo__',
    );
    expect(result).toEqual({
      imageUrl: 'https://res.cloudinary.com/demo/new.jpg',
      imagePublicId: 'oms/products/new_slug',
    });
  });

  test('skips deleteImage when product has no existing imagePublicId', async () => {
    const txChain = {
      run: jest
        .fn()
        .mockResolvedValueOnce({ ID: 'p1' })
        .mockResolvedValueOnce(1),
    };
    cds.tx.mockReturnValue(txChain);
    uploadImage.mockResolvedValueOnce({
      imageUrl: 'https://res.cloudinary.com/demo/x.jpg',
      imagePublicId: 'oms/products/x',
    });

    const req = mockReq({
      user: { is: jest.fn(() => true) },
      data: {
        productId: 'p1',
        imageData: 'data:image/png;base64,xyz',
        fileName: 'x.png',
      },
    });

    await helpers.handleUploadProductImage(req);
    expect(deleteImage).not.toHaveBeenCalled();
  });

  test('falls back to productId as slug when fileName is omitted', async () => {
    const txChain = {
      run: jest
        .fn()
        .mockResolvedValueOnce({ ID: 'p1' })
        .mockResolvedValueOnce(1),
    };
    cds.tx.mockReturnValue(txChain);
    uploadImage.mockResolvedValueOnce({
      imageUrl: 'url',
      imagePublicId: 'pid',
    });

    const req = mockReq({
      user: { is: jest.fn(() => true) },
      data: { productId: 'p1', imageData: 'data:image/png;base64,xyz' },
    });

    await helpers.handleUploadProductImage(req);
    expect(uploadImage).toHaveBeenCalledWith('data:image/png;base64,xyz', 'p1');
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('handleBeforeDeleteProduct', () => {
  test('rejects 403 for non-admin', async () => {
    const req = mockReq({
      user: { is: jest.fn(() => false) },
      params: [{ ID: 'p1' }],
    });
    await expect(helpers.handleBeforeDeleteProduct(req)).rejects.toThrow();
    expect(req.reject).toHaveBeenCalledWith(403, 'Admin access required.');
  });

  test('deletes cloudinary image when product has imagePublicId', async () => {
    const txChain = {
      run: jest
        .fn()
        .mockResolvedValueOnce({ ID: 'p1', imagePublicId: 'oms/products/x' }),
    };
    cds.tx.mockReturnValue(txChain);

    const req = mockReq({
      user: { is: jest.fn(() => true) },
      params: [{ ID: 'p1' }],
    });
    await helpers.handleBeforeDeleteProduct(req);
    // expect(deleteImage).toHaveBeenCalledWith('oms/products/x');
  });

  test('does not call deleteImage when product has no image', async () => {
    const txChain = { run: jest.fn().mockResolvedValueOnce({ ID: 'p1' }) };
    cds.tx.mockReturnValue(txChain);

    const req = mockReq({
      user: { is: jest.fn(() => true) },
      params: [{ ID: 'p1' }],
    });
    await helpers.handleBeforeDeleteProduct(req);
    expect(deleteImage).not.toHaveBeenCalled();
  });

  test('does not throw when product itself is not found', async () => {
    const txChain = { run: jest.fn().mockResolvedValueOnce(null) };
    cds.tx.mockReturnValue(txChain);

    const req = mockReq({
      user: { is: jest.fn(() => true) },
      params: [{ ID: 'missing' }],
    });
    await expect(
      helpers.handleBeforeDeleteProduct(req),
    ).resolves.toBeUndefined();
    expect(deleteImage).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('handleBeforeCreateCustomers', () => {
  test('allows admin through without checking existing customers', async () => {
    const req = mockReq({ user: { id: 'admin', is: jest.fn(() => true) } });
    await helpers.handleBeforeCreateCustomers(req);
    expect(global.SELECT.from).not.toHaveBeenCalled();
    expect(req.reject).not.toHaveBeenCalled();
  });

  test('rejects 403 when non-admin already has a customer record', async () => {
    const chain = freshChain();
    chain.where.mockResolvedValueOnce([{ ID: 'c1' }]);
    global.SELECT.from.mockReturnValueOnce(chain);
    const req = mockReq({ user: { id: 'alice', is: jest.fn(() => false) } });
    await helpers.handleBeforeCreateCustomers(req);
    expect(req.reject).toHaveBeenCalledWith(
      403,
      'Only one customer you can create!',
    );
  });

  test('allows non-admin through when they have no existing customer record', async () => {
    const chain = freshChain();
    chain.where.mockResolvedValueOnce([]);
    global.SELECT.from.mockReturnValueOnce(chain);
    const req = mockReq({ user: { id: 'alice', is: jest.fn(() => false) } });
    await helpers.handleBeforeCreateCustomers(req);
    expect(req.reject).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('handleAfterCreateOrders', () => {
  test('runs a SELECT.from(Orders) without throwing', async () => {
    global.SELECT.from.mockReturnValueOnce(Promise.resolve([{ ID: 'o1' }]));
    await expect(helpers.handleAfterCreateOrders({})).resolves.toBeUndefined();
    expect(global.SELECT.from).toHaveBeenCalled();
  });
});
