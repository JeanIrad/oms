namespace oms;
using { cuid, managed, Currency } from '@sap/cds/common';

entity Products : cuid, managed {
  name        : String(100) not null;
  description : String(500);
  price       : Decimal(10,2) not null;
  stock       : Integer       not null default 1;
  category    : String(50);
}

entity Customers : cuid, managed {
  name    : String(100) not null;
  email   : String(200) not null;
  phone   : String(20);
  address : String(300);
  status  : String(20)  default 'Active';
}

entity Orders : cuid, managed {
  customer    : Association to Customers not null;
  status      : OrderStatus;
  totalPrice : Decimal(10,2);
  notes       : String(500);
  items       : Composition of many OrderItems on items.order = $self;
}

entity OrderItems : cuid {
  order      : Association to Orders  not null;
  product    : Association to Products not null;
  quantity   : Integer     not null;
  unitPrice : Decimal(10,2) not null;  
  lineTotal : Decimal(10,2);
  currency: Currency          
}


type OrderStatus: String enum {Draft; Confirmed; Shipped; Cancelled}