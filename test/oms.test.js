'use strict';
const cds = require('@sap/cds');
const path = require('path');
const { POST, PUT, PATCH, GET, DELETE, defaults } = cds.test(
  path.resolve(__dirname, '..'),
);
defaults.validateStatus = () => true;
// const app = cds.test(__dirname + '/..');

// async function requestAs(method, user, password, path, body) {
//   console.log(`TEST PORT===========> ${getPort()}`);
//   const credentials = Buffer.from(`${user}:${password}`).toString('base64');
//   const options = {
//     method,
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Basic ${credentials}`,
//     },
//   };
//   if (body) options.body = JSON.stringify(body);
//   return fetch(`http://localhost:${getPort()}${path}`, options);
// }

// async function getAs(user, password, path) {
//   return requestAs('GET', user, password, path);
// }

// async function postAs(user, password, path, body) {
//   return requestAs('POST', user, password, path, body);
// }

// async function patchAs(user, password, path, body) {
//   return requestAs('PATCH', user, password, path, body);
// }

// async function deleteAs(user, password, path) {
//   return requestAs('DELETE', user, password, path);
// }

// async function anonGet(path) {
//   return fetch(`http://localhost:${getPort()}${path}`);
// }

// async function anonPost(path, body) {
//   return fetch(`http://localhost:${getPort()}${path}`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(body),
//   });
// }
function authFor(user, password) {
  return { auth: { username: user, password: password } };
}

async function getAs(user, password, path) {
  return GET(path, authFor(user, password));
}

async function postAs(user, password, path, body) {
  return POST(path, body, authFor(user, password));
}

async function patchAs(user, password, path, body) {
  return PATCH(path, body, authFor(user, password));
}

async function deleteAs(user, password, path) {
  return DELETE(path, authFor(user, password));
}

async function anonGet(path) {
  return GET(path);
}

async function anonPost(path, body) {
  return POST(path, body);
}

let customerId, productId, aliceOrderId, bobOrderId;

beforeAll(async () => {
  // Admin creates a customer
  const cRes = await postAs('admin', 'admin', '/oms/Customers', {
    name: 'Test Customer',
    email: 'test@oms.com',
    phone: '+250788000000',
  });
  // const cBody = await cRes.json();
  customerId = cRes.data.ID;

  // Admin creates a product with enough stock
  const pRes = await postAs('admin', 'admin', '/oms/Products', {
    name: 'Test Product',
    price: 100.0,
    stock: 10000,
  });
  // const pBody = await pRes.json();
  productId = pRes.data.ID;

  // Alice creates an order (used across several tests)
  const aRes = await postAs('alice', 'alice', '/oms/Orders', {
    customer_ID: customerId,
    items: [{ product_ID: productId, quantity: 2 }],
  });
  // const aBody = await aRes.json();
  aliceOrderId = aRes.data.ID;

  // Bob creates his own order
  const bRes = await postAs('bob', 'bob', '/oms/Orders', {
    customer_ID: customerId,
    items: [{ product_ID: productId, quantity: 1 }],
  });
  // const bBody = await bRes.json();
  bobOrderId = bRes.data.ID;
});

// PRODUCTS

describe('Products', () => {
  describe('READ', () => {
    test('anyone (no auth) can read products', async () => {
      const res = await anonGet('/oms/Products');
      expect(res.status).toBe(200);
    });

    test('authenticated user can read products', async () => {
      const res = await getAs('alice', 'alice', '/oms/Products');
      expect(res.status).toBe(200);
    });

    test('returns 404 for non-existent product', async () => {
      const res = await getAs(
        'alice',
        'alice',
        '/oms/Products(00000000-0000-0000-0000-000000000000, IsActiveEntity=true)',
      );
      expect(res.status).toBe(404);
    });
  });

  describe('CREATE', () => {
    test('admin can create a product', async () => {
      const res = await postAs('admin', 'admin', '/oms/Products', {
        name: 'Admin Product',
        price: 50.0,
        stock: 100,
      });
      expect(res.status).toBe(201);
      // const body = await res.json();
      // expect(body.ID).toBeDefined();
      // expect(body.name).toBe('Admin Product');
    });

    test('regular user cannot create a product — 403', async () => {
      const res = await postAs('alice', 'alice', '/oms/Products', {
        name: 'Alice Product',
        price: 10.0,
        stock: 5,
      });
      expect(res.status).toBe(403);
    });

    test('unauthenticated cannot create a product — 403', async () => {
      const res = await anonPost('/oms/Products', {
        name: 'Anon Product',
        price: 10.0,
        stock: 5,
      });
      // No auth annotation on Products so CAP returns 403 not 401
      expect([403, 401]).toContain(res.status);
    });
  });

  describe('UPDATE', () => {
    test('admin can update a product', async () => {
      const created = await postAs('admin', 'admin', '/oms/Products', {
        name: 'To Update',
        stock: 100,
        price: 21.12,
      });
      expect(created.status).toBe(201);
      const newProductId = created.data.ID;

      const res = await patchAs(
        'admin',
        'admin',
        `/oms/Products(${newProductId})`,
        { stock: 9999 },
      );

      expect(res.status).toBe(200);
      expect(res.data.stock).toBe(9999);
    });

    test('regular user cannot update a product — 403', async () => {
      const res = await patchAs(
        'alice',
        'alice',
        `/oms/Products(${productId})`,
        { stock: 1 },
      );
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE', () => {
    test('admin can delete a product', async () => {
      // Create a disposable product first
      const createRes = await postAs('admin', 'admin', '/oms/Products', {
        name: 'To Delete',
        price: 1.0,
        stock: 1,
      });
      // const { ID } = await createRes.json();

      const deleteRes = await deleteAs(
        'admin',
        'admin',
        `/oms/Products(${createRes.data.ID})`,
      );
      expect(deleteRes.status).toBe(204);
    });

    test('regular user cannot delete a product — 403', async () => {
      const res = await deleteAs(
        'alice',
        'alice',
        `/oms/Products(${productId})`,
      );
      expect(res.status).toBe(403);
    });
  });
});

// CUSTOMERS

describe('Customers', () => {
  test('admin can READ customers', async () => {
    const res = await getAs('admin', 'admin', '/oms/Customers');
    expect(res.status).toBe(200);
  });

  test('admin can CREATE a customer', async () => {
    const res = await postAs('admin', 'admin', '/oms/Customers', {
      name: 'New Customer',
      email: 'new@oms.com',
    });
    expect(res.status).toBe(201);
    // const body = await res.json();
    expect(res.data.ID).toBeDefined();
  });

  test('admin can UPDATE a customer', async () => {
    const res = await patchAs(
      'admin',
      'admin',
      `/oms/Customers(${customerId})`,
      { phone: '+250799999999' },
    );
    expect(res.status).toBe(200);
  });

  test('admin can DELETE a customer', async () => {
    const createRes = await postAs('admin', 'admin', '/oms/Customers', {
      name: 'Temp',
      email: 'temp@oms.com',
    });
    // const { ID } = await createRes.json();
    const deleteRes = await deleteAs(
      'admin',
      'admin',
      `/oms/Customers(${createRes.data.ID})`,
    );
    expect(deleteRes.status).toBe(204);
  });

  test('regular user cannot READ customers — 403', async () => {
    const res = await getAs('alice', 'alice', '/oms/Customers');
    console.log('REGULAR USER RESPONSE------------', res.data);
    expect(res.status).toBe(403);
  });

  test('unauthenticated cannot READ customers — 401', async () => {
    const res = await anonGet('/oms/Customers');
    expect(res.status).toBe(401);
  });
});

// ORDERS — creation and stock logic

describe('Orders — creation and stock', () => {
  test('authenticated user can create an order', async () => {
    const res = await postAs('alice', 'alice', '/oms/Orders', {
      customer_ID: customerId,
      items: [{ product_ID: productId, quantity: 1 }],
    });
    console.log('CREATING ORDER STATUS>>>>', res.status);
    expect(res.status).toBe(201);
    // const body = await res.json();
    expect(res.data.ID).toBeDefined();
    expect(res.data.status).toBe('PENDING');
  });

  test('totalPrice is computed correctly from items', async () => {
    const res = await postAs('alice', 'alice', '/oms/Orders', {
      customer_ID: customerId,
      items: [{ product_ID: productId, quantity: 3 }],
    });
    // const body = await res.json();
    const createdOrder = await getAs(
      'alice',
      'alice',
      '/oms/Orders?$expand=items',
    );
    console.log('<<<<ORDER>>>>>', createdOrder.data);
    console.log('<<<<<<TOTAL PRICE COMPUTED>>>>', res.data);
    expect(res.data.totalPrice).toBe(300.0);
  });

  test('createdBy is set to the requesting user', async () => {
    const res = await postAs('alice', 'alice', '/oms/Orders', {
      customer_ID: customerId,
      items: [{ product_ID: productId, quantity: 1 }],
    });
    // const body = await res.json();
    expect(res.data.createdBy).toBe('alice');
  });

  test('stock decrements after a successful order', async () => {
    const beforeRes = await anonGet(`/oms/Products(${productId})`);
    // const before = await beforeRes.json();

    await postAs('alice', 'alice', '/oms/Orders', {
      customer_ID: customerId,
      items: [{ product_ID: productId, quantity: 4 }],
    });

    const afterRes = await anonGet(`/oms/Products(${productId})`);
    // const after = await afterRes.json();
    expect(afterRes.data.stock).toBe(beforeRes.data.stock - 4);
  });

  test('unauthenticated cannot create an order — 401', async () => {
    const res = await anonPost('/oms/Orders', {
      customer_ID: customerId,
      items: [{ product_ID: productId, quantity: 1 }],
    });
    expect(res.status).toBe(401);
  });

  test('order with no items is rejected — 400', async () => {
    const res = await postAs('alice', 'alice', '/oms/Orders', {
      customer_ID: customerId,
      items: [],
    });
    expect(res.status).toBe(400);
  });

  test('order exceeding stock is rejected — 409', async () => {
    const res = await postAs('alice', 'alice', '/oms/Orders', {
      customer_ID: customerId,
      items: [{ product_ID: productId, quantity: 99999999 }],
    });
    expect(res.status).toBe(409);
  });

  test('order with invalid product ID is rejected — 404', async () => {
    const res = await postAs('alice', 'alice', '/oms/Orders', {
      customer_ID: customerId,
      items: [
        { product_ID: '00000000-0000-0000-0000-000000000000', quantity: 1 },
      ],
    });
    expect(res.status).toBe(404);
  });

  test('stock does not change when order is rejected', async () => {
    const beforeRes = await anonGet(`/oms/Products(${productId})`);
    // const before = await beforeRes.json();

    await postAs('alice', 'alice', '/oms/Orders', {
      customer_ID: customerId,
      items: [{ product_ID: productId, quantity: 99999999 }],
    });

    const afterRes = await anonGet(`/oms/Products(${productId})`);
    // const after = await afterRes.json();
    expect(afterRes.data?.stock).toBe(beforeRes.data?.stock);
  });

  test('concurrent orders cannot oversell stock', async () => {
    const pRes = await anonGet(`/oms/Products(${productId})`);
    // const product = await pRes.json();
    const qty = Math.ceil(pRes.data?.stock * 0.7);

    const [res1, res2] = await Promise.all([
      postAs('alice', 'alice', '/oms/Orders', {
        customer_ID: customerId,
        items: [{ product_ID: productId, quantity: qty }],
      }),
      postAs('bob', 'bob', '/oms/Orders', {
        customer_ID: customerId,
        items: [{ product_ID: productId, quantity: qty }],
      }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 409]);

    const afterRes = await anonGet(`/oms/Products(${productId})`);
    // const after = await afterRes.json();
    expect(afterRes.data?.stock).toBeGreaterThanOrEqual(0);
  });
});

// ORDERS — ownership and isolation

describe('Orders — ownership and isolation', () => {
  test('user sees only their own orders in list', async () => {
    const res = await getAs('alice', 'alice', '/oms/Orders');
    // const body = await res.json();
    expect(res.data?.value.every((o) => o.createdBy === 'alice')).toBe(true);
  });

  test('user cannot read another user order by ID — 404', async () => {
    // Alice tries to read Bob's order — CAP WHERE filter makes it invisible
    const res = await getAs('alice', 'alice', `/oms/Orders(${bobOrderId})`);
    expect(res.status).toBe(404);
  });

  test('admin can read all orders regardless of owner', async () => {
    const res = await getAs('admin', 'admin', '/oms/Orders');
    // const body = await res.json();
    const owners = [...new Set(res.data?.value.map((o) => o.createdBy))];
    // Admin should see orders from both alice and bob
    expect(owners.length).toBeGreaterThan(1);
  });

  test('user cannot DELETE an order — 403', async () => {
    const res = await deleteAs(
      'alice',
      'alice',
      `/oms/Orders(${aliceOrderId}, IsActiveEntity=true)`,
    );
    expect(res.status).toBe(403);
  });

  test('unauthenticated cannot read orders — 401', async () => {
    const res = await anonGet('/oms/Orders');
    expect(res.status).toBe(401);
  });
});

// ORDERS — confirm and cancel actions

describe('Orders — confirm and cancel actions', () => {
  // Each test gets a fresh Draft order to avoid state bleed
  async function freshOrder(user = 'alice', qty = 1) {
    const res = await postAs(user, user, '/oms/Orders', {
      customer_ID: customerId,
      items: [{ product_ID: productId, quantity: qty }],
    });
    return res.data;
  }

  describe('confirm', () => {
    test('admin can confirm any order', async () => {
      const order = await freshOrder('alice');
      const res = await postAs(
        'admin',
        'admin',
        `/oms/Orders(${order.ID})/confirm`,
        {},
      );
      expect(res.status).toBe(200);
      // const body = await res.json();
      expect(res.data?.status).toBe('CONFIRMED');
    });

    test('owner cannot confirm their own order (not granted in @restrict)', async () => {
      // alice only has CREATE, READ, cancel — not confirm
      const order = await freshOrder('alice');
      const res = await postAs(
        'alice',
        'alice',
        `/oms/Orders(${order.ID})/confirm`,
        {},
      );
      expect(res.status).toBe(403);
    });

    test('confirming a non-existent order returns 404', async () => {
      const res = await postAs(
        'admin',
        'admin',
        '/oms/Orders(00000000-0000-0000-0000-000000000000)/confirm',
        {},
      );
      expect(res.status).toBe(404);
    });

    test('confirming an already-Confirmed order returns 409', async () => {
      const order = await freshOrder('alice');
      await postAs('admin', 'admin', `/oms/Orders(${order?.ID})/confirm`, {});

      const res = await postAs(
        'admin',
        'admin',
        `/oms/Orders(${order.ID})/confirm`,
        {},
      );
      expect(res.status).toBe(409);
    });

    test('confirming a Cancelled order returns 409', async () => {
      const order = await freshOrder('alice');
      await postAs('alice', 'alice', `/oms/Orders(${order.ID})/cancel`, {});

      const res = await postAs(
        'admin',
        'admin',
        `/oms/Orders(${order.ID})/confirm`,
        {},
      );
      expect(res.status).toBe(409);
    });
  });

  describe('cancel', () => {
    test('owner can cancel their own Draft order', async () => {
      const order = await freshOrder('alice');
      const res = await postAs(
        'alice',
        'alice',
        `/oms/Orders(${order.ID})/cancel`,
        {},
      );
      expect(res.status).toBe(200);
      // const body = await res.json();
      expect(res.data?.status).toBe('CANCELLED');
    });

    test('cancel restores product stock', async () => {
      const beforeRes = await anonGet(`/oms/Products(${productId})`);
      // const before = await beforeRes.json();

      const order = await freshOrder('alice', 5);

      const midRes = await anonGet(`/oms/Products(${productId})`);
      const mid = await midRes.json();
      expect(mid.stock).toBe(beforeRes.data?.stock - 5);

      await postAs('alice', 'alice', `/oms/Orders(${order?.ID})/cancel`, {});

      const afterRes = await anonGet(`/oms/Products(${productId})`);
      // const after = await afterRes.json();
      expect(after.data?.stock).toBe(beforeRes.data?.stock);
    });

    test('admin can cancel any order regardless of owner', async () => {
      const order = await freshOrder('bob');
      const res = await postAs(
        'admin',
        'admin',
        `/oms/Orders(${order.ID})/cancel`,
        {},
      );
      expect(res.status).toBe(200);
    });

    test('other user cannot cancel someone else order — 403', async () => {
      const order = await freshOrder('alice');
      const res = await postAs(
        'bob',
        'bob',
        `/oms/Orders(${order.ID})/cancel`,
        {},
      );
      expect(res.status).toBe(403);
    });

    test('cancelling an already-Cancelled order returns 409', async () => {
      const order = await freshOrder('alice');
      await postAs('alice', 'alice', `/oms/Orders(${order.ID})/cancel`, {});

      const res = await postAs(
        'alice',
        'alice',
        `/oms/Orders(${order?.ID})/cancel`,
        {},
      );
      expect(res.status).toBe(409);
    });

    test('cancelling a Shipped order returns 409', async () => {
      const order = await freshOrder('alice');
      // Force to Shipped via admin PATCH
      await patchAs('admin', 'admin', `/oms/Orders(${order.ID})`, {
        status: 'SHIPPED',
      });

      const res = await postAs(
        'alice',
        'alice',
        `/oms/Orders(${order.ID})/cancel`,
        {},
      );
      expect(res.status).toBe(409);
    });

    test('cancelling a non-existent order returns 404', async () => {
      const res = await postAs(
        'alice',
        'alice',
        '/oms/Orders(00000000-0000-0000-0000-000000000000)/cancel',
        {},
      );
      expect(res.status).toBe(404);
    });
  });

  describe('full transition matrix', () => {
    test('PENDING → Confirmed → Cancelled (full happy path via admin)', async () => {
      const order = await freshOrder('alice');
      expect(order.status).toBe('PENDING');

      await postAs('admin', 'admin', `/oms/Orders(${order.ID})/confirm`, {});
      const confirmed = await (
        await getAs('admin', 'admin', `/oms/Orders(${order.ID})`)
      ).data;
      expect(confirmed.status).toBe('CONFIRMED');

      await postAs('admin', 'admin', `/oms/Orders(${order.ID})/cancel`, {});
      const cancelled = await (
        await getAs('admin', 'admin', `/oms/Orders(${order.ID})`)
      ).data;
      expect(cancelled.status).toBe('CANCELLED');
    });
  });
});

// ORDER SUMMARY

describe('OrderSummary', () => {
  test('authenticated user sees only their own rows', async () => {
    const res = await getAs('alice', 'alice', '/oms/OrderSummary');
    // const body = await res.json();
    expect(res.data.value.every((r) => r.createdBy === 'alice')).toBe(true);
  });

  test('admin sees all rows', async () => {
    const res = await getAs('admin', 'admin', '/oms/OrderSummary');
    const body = res.data;
    const owners = [...new Set(body.value.map((r) => r.createdBy))];
    expect(owners.length).toBeGreaterThan(1);
  });

  test('summary rows contain expected fields', async () => {
    const res = await getAs('alice', 'alice', '/oms/OrderSummary');
    const body = res.data;
    const row = body.value[0];
    expect(row).toHaveProperty('ID');
    expect(row).toHaveProperty('status');
    expect(row).toHaveProperty('totalPrice');
    expect(row).toHaveProperty('customerName');
    expect(row).toHaveProperty('createdAt');
    expect(row).toHaveProperty('createdBy');
  });

  test('OrderSummary is read-only — POST returns 405', async () => {
    const res = await postAs('admin', 'admin', '/oms/OrderSummary', {
      status: 'PENDING',
    });
    expect(res.status).toBe(405);
  });

  test('unauthenticated cannot read OrderSummary — 401', async () => {
    const res = await anonGet('/oms/OrderSummary');
    expect(res.status).toBe(401);
  });
});

// ORDER ITEMS

describe('OrderItems', () => {
  test('authenticated user can read order items', async () => {
    const res = await getAs('alice', 'alice', '/oms/OrderItems');
    expect(res.status).toBe(200);
  });

  test('unauthenticated cannot read order items — 401', async () => {
    const res = await anonGet('/oms/OrderItems');
    expect(res.status).toBe(401);
  });

  test('items have correct fields after order creation', async () => {
    const orderRes = await postAs('alice', 'alice', '/oms/Orders', {
      customer_ID: customerId,
      items: [{ product_ID: productId, quantity: 2 }],
    });
    const order = orderRes.data;

    const itemsRes = await getAs(
      'alice',
      'alice',
      `/oms/OrderItems?$filter=order_ID eq ${order.ID}`,
    );
    const itemsBody = itemsRes.data;
    const item = itemsBody.value[0];

    expect(item.quantity).toBe(2);
    expect(item.unitPrice).toBe(100.0);
    expect(item.lineTotal).toBe(200.0);
  });

  test('admin can delete an order item', async () => {
    const orderRes = await postAs('admin', 'admin', '/oms/Orders', {
      customer_ID: customerId,
      items: [{ product_ID: productId, quantity: 1 }],
    });
    const order = orderRes.data;

    const itemsRes = await getAs(
      'admin',
      'admin',
      `/oms/OrderItems?$filter=order_ID eq ${order.ID}`,
    );
    const itemsBody = itemsRes.data;
    const itemId = itemsBody.value[0].ID;

    const deleteRes = await deleteAs(
      'admin',
      'admin',
      `/oms/OrderItems(${itemId})`,
    );
    expect(deleteRes.status).toBe(204);
  });

  test('regular user cannot delete order items — 403', async () => {
    const itemsRes = await getAs('alice', 'alice', '/oms/OrderItems?$top=1');
    const itemsBody = itemsRes.data;
    const itemId = itemsBody.value[0]?.ID;

    if (!itemId) return; // skip if alice has no items yet

    const res = await deleteAs('alice', 'alice', `/oms/OrderItems(${itemId})`);
    expect(res.status).toBe(403);
  });

  test('admin can upload a product image', async () => {
    const fs = require('fs');
    const path = require('path');
    const imgPath = path.join(__dirname, 'fixtures', 'test-product.jpg');
    const imgBuffer = fs.readFileSync(imgPath);
    const base64 = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`;

    const res = await postAs('admin', 'admin', '/oms/uploadProductImage', {
      productId: productId,
      imageData: base64,
      fileName: 'test-product.jpg',
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.imageUrl).toMatch(/^https:\/\/res\.cloudinary\.com/);
    expect(body.imagePublicId).toContain('oms/products');

    // Verify it was persisted to the product
    const productRes = await getAs(
      'admin',
      'admin',
      `/oms/Products(${productId})`,
    );
    const product = productRes.data;
    expect(product.imageUrl).toBe(body.imageUrl);
  });

  test('regular user cannot upload an image — 403', async () => {
    const res = await postAs('alice', 'alice', '/oms/uploadProductImage', {
      productId: productId,
      imageData: 'data:image/jpeg;base64,/9j/fake',
      fileName: 'fake.jpg',
    });
    expect(res.status).toBe(403);
  });
});
