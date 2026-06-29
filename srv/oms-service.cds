using oms from '../db/schema';


service OmsService @(path: '/oms') {
  type CancelOrderInput {
  reason : String(500) @title: 'Cancellation Reason' @Common.FieldControl: #Mandatory @UI.MultiLineText: true;
}

// @odata.draft.enabled
  @restrict: [
    { grant: ['READ'], to: 'any' },
    { grant: ['READ', 'CREATE', 'UPDATE', 'DELETE'], to: 'admin' }
  ]
  entity Products  as projection on oms.Products;

// @odata.draft.enabled
  @restrict: [
            {grant: ['READ', 'CREATE', 'UPDATE', 'DELETE'], to: 'admin'},
            {grant: ['READ', 'CREATE', 'UPDATE'], to: 'authenticated-user', where: 'createdBy = $user'}
  ]
  entity Customers as projection on oms.Customers;

@readonly
entity Categories as projection on oms.Categories;
  // @odata.draft.enabled
  @cds.redirection.target
  @restrict: [{grant: '*', to: 'admin'}, {grant: ['CREATE', 'READ', 'cancel'], to: 'authenticated-user', where: 'createdBy = $user'}]
  entity Orders as projection on oms.Orders actions {
    action confirm() returns Orders;
    action cancel( reason : String(500) @title: 'Cancellation Reason'
                          @Common.FieldControl: #Mandatory
                          @UI.MultiLineText: true
                          not null
    ) returns Orders;
    action ship()    returns Orders;

  };

@restrict: [
    { grant: ['READ', 'CREATE', 'UPDATE', 'DELETE'], to: 'authenticated-user' },
    { grant: '*', to: 'admin' }
  ]
  entity OrderItems as projection on oms.OrderItems;

@readonly
@restrict: [
  { grant: 'READ', to: 'authenticated-user', where: 'createdBy = $user' },
  {grant: 'READ', to: 'admin'}
]
entity OrderSummary as select from oms.Orders {
  key ID,
  status,
  case status
    when 'CONFIRMED' then 3
    when 'CANCELLED' then 1
    else 2
  end                as statusCriticality : Integer,
  totalPrice,
  customer.name      as customerName : String,
  createdAt,
  createdBy,
  1                  as orderCount : Integer
};

@restrict: [{ grant: '*', to: 'admin' }]
action uploadProductImage(productId: UUID,imageData: LargeString, fileName: String) returns { 
  imageUrl: String;
  imagePublicId: String
}
}