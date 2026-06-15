const cds = require('@sap/cds');

const { GET, POST } = cds.test(__dirname + '/..');

describe('OmsService - stock validation', () => {
  async function postAs(user, password, path, body) {
    const credentials = Buffer.from(`${user}:${password}`).toString('base64');
    return fetch(`http://localhost:4004${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify(body),
    });
  }

  async function getAs(user, password, path) {
    const credentials = Buffer.from(`${user}:${password}`).toString('base64');
    return fetch(`http://localhost:4004${path}`, {
      headers: { Authorization: `Basic ${credentials}` },
    });
  }

  let customerId;
  let productId;
  let orderId;

  beforeAll(async () => {
    // const customerRes = await POST('/oms/Customers', {
    //   name: 'John Doe',
    //   email: 'john@example.com',
    //   phone: '+250788123456',
    // });
    const customerRes = await postAs('admin', 'admin', '/oms/Customers', {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+250788123456',
    });
    console.log('customer response>>>', customerRes);
    customerId = customerRes?.data?.ID;
    console.log('CUSTOMER ID>>>', customerId);
    const productRes = await postAs('admin', 'admin', '/oms/Products', {
      name: 'Laptop',
      price: 1299.99,
      stock: 10000,
    });
    productId = productRes.data?.ID;
    console.log('PRODUCT ID>>>> ', productId);
    const orderRes = await postAs('admin', 'admin', '/oms/Orders', {
      customer_ID: customerId,
      items: [
        {
          product_ID: productId,
          quantity: 1,
        },
      ],
    });
    orderId = orderRes.data?.ID;
    console.log('ORDER ID>>>>>', orderId);
  });
  // test('creates order when stock is sufficient', async () => {
  //   console.log('PRODUCT ID<<<<', productId);
  //   const { status, data } = await POST('/oms/Orders', {
  //     customer_ID: customerId,
  //     items: [{ product_ID: productId, quantity: 2 }],
  //   });
  //   expect(status).toBe(201);
  //   expect(data.totalPrice).toBe(2599.98);
  // });

  // test('rejects order when quantity exceeds stock', async () => {
  //   await expect(
  //     POST('/oms/Orders', {
  //       customer_ID: customerId,
  //       items: [{ product_ID: productId, quantity: 999999999 }],
  //     }),
  //   ).rejects.toMatchObject({ response: { status: 409 } });
  // });

  // test('rejects order when quantity not provided', async () => {
  //   await expect(
  //     POST('/oms/Orders', {
  //       customer_ID: customerId,
  //     }),
  //   ).rejects.toMatchObject({ response: { status: 400 } });
  // });

  // test('decrements product stock after successful order', async () => {
  //   const { data: before } = await GET(`/oms/Products(${productId})`);
  //   await POST('/oms/Orders', {
  //     customer_ID: customerId,
  //     items: [{ product_ID: productId, quantity: 5 }],
  //   });
  //   const { data: after } = await GET(`/oms/Products(${productId})`);
  //   expect(after.stock).toBe(before.stock - 5);
  // });

  // test('cancel order when status not cancelled, or shipped', async () => {
  //   const { status } = await POST(`/oms/Orders(${orderId})/cancel`);
  //   expect(status).toBe(200);
  // });
  // test('cancel order fail when status is cancelled', async () => {
  //   await expect(POST(`/oms/Orders(${orderId})/cancel`)).rejects.toMatchObject({
  //     response: { status: 409 },
  //   });
  // });
});
