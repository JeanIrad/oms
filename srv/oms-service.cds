using oms from '../db/schema';

service OmsService @(path: '/oms') {

@odata.draft.enabled
  @restrict: [
    { grant: ['READ', 'CREATE', 'UPDATE'], to: 'authenticated-user' },
    { grant: '*', to: 'admin' }
  ]
  entity Products  as projection on oms.Products;

  @restrict: [{grant: '*', to: 'admin'},{grant: 'READ', to: 'authenticated-user'}]
  entity Customers as projection on oms.Customers;

  @odata.draft.enabled
  @cds.redirection.target
  @restrict: [{grant: '*', to: 'admin'}, {grant: ['CREATE', 'READ', 'cancel'], to: 'authenticated-user', where: 'createdBy = $user'}]
  entity Orders as projection on oms.Orders actions {
    action confirm() returns Orders;
    action cancel()  returns Orders;
  };

@restrict: [
    { grant: ['READ', 'CREATE', 'UPDATE', 'DELETE'], to: 'authenticated-user' },
    { grant: '*', to: 'admin' }
  ]
  entity OrderItems as projection on oms.OrderItems;

  @readonly
  @restrict: [
    { grant: 'READ', to: 'authenticated-user', where: 'createdBy = $user' },
    { grant: '*', to: 'admin' }
  ]
  entity OrderSummary as select from oms.Orders {
     ID, status, totalPrice,
    customer.name as customerName,
    createdAt,
    createdBy
  };

@restrict: [{ grant: '*', to: 'admin' }]
action uploadProductImage(productId: UUID,imageData: LargeString, fileName: String) returns { 
  imageUrl: String;
  imagePublicId: String
}
}