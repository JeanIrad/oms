const cds = require('@sap/cds');
// const { faker } = require('@faker-js/faker');

const { GET, POST } = cds.test(__dirname + '/..');

describe('OmsService › stock validation', () => {
  let customerId;
  let productId;

  beforeAll(async () => {
    const customerRes = await POST('/oms/Customers', {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+250788123456',
    });

    customerId = customerRes.data.ID;
    console.log('CUSTOMER ID>>>', customerId);
    const productRes = await POST('/oms/Products', {
      name: 'Laptop',
      price: 1299.99,
      stock: 10,
    });

    productId = productRes.data.ID;
    console.log('PRODUCT ID: ', productId);
  });
  test('creates order when stock is sufficient', async () => {
    const { status, data } = await POST('/oms/Orders', {
      customer_ID: customerId,
      items: [{ product_ID: productId, quantity: 2 }],
    });
    expect(status).toBe(201);
    expect(data.totalPrice).toBe(2599.98);
  });

  test('rejects order when quantity exceeds stock', async () => {
    await expect(
      POST('/oms/Orders', {
        customer_ID: customerId,
        items: [{ product_ID: productId, quantity: 9999 }],
      }),
    ).rejects.toMatchObject({ response: { status: 409 } });
  });

  test('decrements product stock after successful order', async () => {
    const { data: before } = await GET(`/oms/Products(${productId})`);
    await POST('/oms/Orders', {
      customer_ID: customerId,
      items: [{ product_ID: productId, quantity: 5 }],
    });
    const { data: after } = await GET(`/oms/Products(${productId})`);
    expect(after.stock).toBe(before.stock - 5);
  });
});
