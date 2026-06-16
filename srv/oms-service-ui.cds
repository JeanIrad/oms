using OmsService from '../srv/oms-service';

annotate OmsService.Orders with @(
  UI.HeaderInfo: {
    TypeName: 'Order',
    TypeNamePlural: 'Orders',
    Title: { Value: ID },
    Description: { Value: notes }
  },


  UI.SelectionFields: [ status, customer_ID, createdAt ],

  UI.LineItem: [
    { $Type: 'UI.DataField', Value: ID, Label: 'Order ID' },
    { $Type: 'UI.DataField', Value: customer_ID, Label: 'Customer ID' },
    { $Type: 'UI.DataField', Value: createdAt, Label: 'Date Created' },
    { $Type: 'UI.DataField', Value: totalPrice, Label: 'Total Price' },
    
    { 
      $Type: 'UI.DataField', 
      Value: status, 
      Label: 'Status',
      Criticality: #Information 
    },

    { 
      $Type: 'UI.DataFieldForAction', 
      Action: 'OmsService.confirm', 
      Label: 'Confirm Order', 
      InvocationGrouping: #Isolated 
    },
    { 
      $Type: 'UI.DataFieldForAction', 
      Action: 'OmsService.cancel', 
      Label: 'Cancel Order', 
      InvocationGrouping: #Isolated 
    }
  ]
);

annotate OmsService.Orders with @(
  UI.Facets: [
    {
      $Type: 'UI.CollectionFacet',
      ID: 'GeneralInformationFacet',
      Label: 'General Information',
      Facets: [
        { $Type: 'UI.ReferenceFacet', Label: 'Order Summary', Target: '@UI.FieldGroup#OrderDetails' }
      ]
    },
    {
      $Type: 'UI.ReferenceFacet',
      Label: 'Order Line Items',
      Target: 'items/@UI.LineItem' 
    }
  ],

  UI.FieldGroup #OrderDetails: {
    Data: [
    //   { $Type: 'UI.DataField', Value: customer_ID, Label: 'Customer Account' },
    //   { $Type: 'UI.DataField', Value: status, Label: 'Current Status' },
      { $Type: 'UI.DataField', Value: totalPrice, Label: 'Grand Total' },
      { $Type: 'UI.DataField', Value: notes, Label: 'Delivery Notes' }
    ]
  }
);
annotate OmsService.OrderItems with @(
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: product_ID, Label: 'Product ID' },
    { $Type: 'UI.DataField', Value: quantity, Label: 'Quantity Ordered' },
    { $Type: 'UI.DataField', Value: unitPrice, Label: 'Unit Price' },
    { $Type: 'UI.DataField', Value: lineTotal, Label: 'Line Item Total' }
  ]
);