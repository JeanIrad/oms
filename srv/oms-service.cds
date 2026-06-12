using oms from '../db/schema';

service OmsService @(path: '/oms') {

  entity Products  as projection on oms.Products;
  entity Customers as projection on oms.Customers;

  @cds.redirection.target
  entity Orders as projection on oms.Orders actions {
    action confirm() returns Orders;
    action cancel()  returns Orders;
  };

  entity OrderItems as projection on oms.OrderItems;

  @readonly
  view OrderSummary as select from oms.Orders {
     ID, status, totalPrice,
    customer.name as customerName,
    createdAt
  };
}