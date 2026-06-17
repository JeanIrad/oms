namespace oms;
using { cuid, managed, Currency } from '@sap/cds/common';

entity Products : cuid, managed {
  name        : String(100) not null;
  description : String(500);
  price       : Decimal(10,2) not null @assert.range: [(0.001), _];
  stock       : Integer       not null default 1 @assert.range: [(0), _] @assert.range.message: 'Stock cannot be less than zero!';
  category    : String(50);
  status      : String;
  stockCriticality  : Integer @Core.Computed: true;  
  statusCriticality : Integer @Core.Computed: true;
  imageUrl: String(500);
  imagePublicId: String(500);
}

entity Customers : cuid, managed {
  name    : String(100) not null;
  email   : String(200) not null;
  phone   : String(20);
  address : String(300);
  status  : String(20)  default 'Active';
  statusCriticality : Integer @Core.Computed: true;

}

entity Orders : cuid, managed {
  customer    : Association to Customers not null;
  status      : OrderStatus default 'PENDING';
  totalPrice : Decimal(10,2);
  notes       : String(500);
  items       : Composition of many OrderItems on items.order = $self;
  statusCriticality : Integer @Core.Computed: true;

}

entity OrderItems : cuid, managed {
  order      : Association to Orders  not null;
  product    : Association to Products not null;
  quantity   : Integer     not null;
  unitPrice : Decimal(10,2) not null;  
  lineTotal : Decimal(10,2);
  currency: Currency          
}

// type ProductCategory: String enum {}
type OrderStatus: String enum {PENDING; CONFIRMED; SHIPPED; CANCELLED}