
// // using OmsService from '../srv/oms-service';

// // annotate OmsService.Orders with {
// //   ID          @title: 'Order ID'       @Core.Computed: true  @UI.Hidden: true;
// //   customer    @title: 'Customer';
// //   status      @title: 'Status'         @Core.Computed: true;
// //   totalPrice  @title: 'Total Price'    @Core.Computed: true
// //               @Measures.ISOCurrency: 'USD';
// //   notes       @title: 'Delivery Notes' @UI.MultiLineText: true;
// //   createdAt   @title: 'Order Date'     @Core.Computed: true;
// //   createdBy   @title: 'Placed By'      @Core.Computed: true;
// //   modifiedAt  @title: 'Last Updated'   @Core.Computed: true;
// // }

// // annotate OmsService.OrderItems with {
// //   product     @title: 'Product';
// //   quantity    @title: 'Quantity';
// //   unitPrice   @title: 'Unit Price'  @Core.Computed: true
// //               @Measures.ISOCurrency: 'USD';
// //   lineTotal   @title: 'Line Total'  @Core.Computed: true
// //               @Measures.ISOCurrency: 'USD';
// // }

// // annotate OmsService.Products with {
// //   name        @title: 'Product Name';
// //   description @title: 'Description'   @UI.MultiLineText: true;
// //   price       @title: 'Price'
// //               @Measures.ISOCurrency: 'USD';
// //   stock       @title: 'Stock';
// //   category    @title: 'Category';
// //   status      @title: 'Status';
// // }

// // annotate OmsService.Customers with {
// //   name    @title: 'Customer Name';
// //   email   @title: 'Email';
// //   phone   @title: 'Phone';
// //   address @title: 'Address';
// //   status  @title: 'Status';
// // }

// // // ORDERS

// // annotate OmsService.Orders with @(

// //   UI.HeaderInfo: {
// //     TypeName:       'Order',
// //     TypeNamePlural: 'Orders',
// //     Title:       { $Type: 'UI.DataField', Value: ID },
// //     Description: { $Type: 'UI.DataField', Value: status }
// //   },

// //   UI.SelectionFields: [ status, createdAt ],

// //   UI.LineItem: [
// //     {
// //       $Type: 'UI.DataField',
// //       Value: customer.name,          
// //       Label: 'Customer'
// //     },
// //     {
// //       $Type: 'UI.DataField',
// //       Value: createdAt,
// //       Label: 'Order Date'
// //     },
// //     {
// //       $Type: 'UI.DataField',
// //       Value: totalPrice,
// //       Label: 'Total Price'
// //     },
// //     {
// //       $Type:       'UI.DataField',
// //       Value:       status,
// //       Label:       'Status',
// //       Criticality: statusCriticality   
// //     },
// //     {
// //       $Type:              'UI.DataFieldForAction',
// //       Action:             'OmsService.EntityContainer/confirm',
// //       Label:              'Confirm Order',
// //       InvocationGrouping: #Isolated
// //     },
// //     {
// //       $Type:              'UI.DataFieldForAction',
// //       Action:             'OmsService.EntityContainer/cancel',
// //       Label:              'Cancel Order',
// //       InvocationGrouping: #Isolated
// //     }
// //   ],
// //   UI.PresentationVariant: {
// //     MaxItems: 10,
// //     SortOrder: [{Property: createdAt, Descending: true}],
// //     Visualizations: ['@UI.LineItem']
// //   },

// // //  Object page header 
// //   UI.HeaderFacets: [
// //     {
// //       $Type:  'UI.ReferenceFacet',
// //       Target: '@UI.FieldGroup#StatusBadge'
// //     },
// //     {
// //       $Type:  'UI.ReferenceFacet',
// //       Target: '@UI.FieldGroup#TotalBadge'
// //     }
// //   ],

// //   UI.FieldGroup #StatusBadge: {
// //     Data: [{
// //       $Type:       'UI.DataField',
// //       Value:       status,
// //       Criticality: statusCriticality
// //     }]
// //   },

// //   UI.FieldGroup #TotalBadge: {
// //     Data: [{
// //       $Type: 'UI.DataField',
// //       Value: totalPrice,
// //       Label: 'Order Total'
// //     }]
// //   },

// //   // Object page facets (tabs) 
// //   UI.Facets: [
// //     {
// //       $Type: 'UI.CollectionFacet',
// //       ID:    'GeneralFacet',
// //       Label: 'General Information',
// //       Facets: [
// //         {
// //           $Type:  'UI.ReferenceFacet',
// //           Label:  'Order Details',
// //           Target: '@UI.FieldGroup#OrderDetails'
// //         },
// //         {
// //           $Type:  'UI.ReferenceFacet',
// //           Label:  'Audit',
// //           Target: '@UI.FieldGroup#AuditDetails'
// //         }
// //       ]
// //     },
// //     {
// //       $Type:  'UI.ReferenceFacet',
// //       ID:     'ItemsFacet',
// //       Label:  'Order Items',
// //       Target: 'items/@UI.LineItem'
// //     },
// //     {
// //       $Type:  'UI.ReferenceFacet',
// //       ID:     'NotesFacet',
// //       Label:  'Notes',
// //       Target: '@UI.FieldGroup#NotesGroup'
// //     }
// //   ],

// //   // Order Details field group — customer + status read-only, no ID field
// //   UI.FieldGroup #OrderDetails: {
// //     $Type: 'UI.FieldGroupType',
// //     Data: [
// //       {
    
// //         $Type: 'UI.DataField',
// //         Value: customer.name,
// //         Label: 'Customer'
// //       },
// //       {
// //         $Type: 'UI.DataField',
// //         Value: customer.email,
// //         Label: 'Customer Email'
// //       },
// //       {
// //         $Type:       'UI.DataField',
// //         Value:       status,
// //         Label:       'Status',
// //         Criticality: statusCriticality
// //       },
// //       {
// //         $Type: 'UI.DataField',
// //         Value: totalPrice,
// //         Label: 'Total Price'
// //       }
// //     ]
// //   },

// //   // Audit trail — who created it and when
// //   UI.FieldGroup #AuditDetails: {
// //     $Type: 'UI.FieldGroupType',
// //     Data: [
// //       { $Type: 'UI.DataField', Value: createdBy,  Label: 'Placed By'    },
// //       { $Type: 'UI.DataField', Value: createdAt,  Label: 'Order Date'   },
// //       { $Type: 'UI.DataField', Value: modifiedAt, Label: 'Last Updated' }
// //     ]
// //   },

// //   // Notes — separate tab so it doesn't clutter the main form
// //   UI.FieldGroup #NotesGroup: {
// //     $Type: 'UI.FieldGroupType',
// //     Data: [
// //       { $Type: 'UI.DataField', Value: notes, Label: 'Delivery Notes' }
// //     ]
// //   }
// // );

// // // ── Create form — hide fields the user must not set manually ─────────────────
// // // customer_ID is hidden because CAP sets it from req.user in the handler
// // // status is hidden because it defaults to Draft
// // // totalPrice is hidden because it is computed by the handler
// // annotate OmsService.Orders with @(
// //   UI.CreateHidden:  false,   // allow create button
// //   UI.DeleteHidden:  true,    // users cannot delete orders

// //   UI.FieldGroup #CreateForm: {
// //     $Type: 'UI.FieldGroupType',
// //     Data: [
// //       // notes is the only free-text field the user fills in at create time
// //       { $Type: 'UI.DataField', Value: notes, Label: 'Delivery Notes' },
// //       {
// //        $Type:'UI.DataField', Value: customer, Label: 'Select Customer'
// //       }
// //       // items are added via the inline table on the object page after creation
// //     ]
// //   }
// // );
// // annotate OmsService.Orders with {
// //   customer @Common.ValueList: {
// //     CollectionPath: 'Customers',
// //     Parameters: [
// //       {
// //         $Type:             'Common.ValueListParameterOut',
// //         LocalDataProperty: customer_ID,
// //         ValueListProperty: 'ID'
// //       },
// //       {
// //         $Type:             'Common.ValueListParameterDisplayOnly',
// //         ValueListProperty: 'name'
// //       },
// //       {
// //         $Type:             'Common.ValueListParameterDisplayOnly',
// //         ValueListProperty: 'email'
// //       },
// //       {
// //         $Type:             'Common.ValueListParameterDisplayOnly',
// //         ValueListProperty: 'phone'
// //       }
// //     ]
// //   };
// // }
// // // Hide these fields from all forms — they are system-managed
// // annotate OmsService.Orders with {
// //   customer_ID  @UI.Hidden: true;   // set from session, never shown as input
// //   status       @UI.HiddenFilter: false;  // hidden as input but available as filter
// //   totalPrice   @UI.Hidden: false;  // shown read-only, never as input
// // }

// // // annotate OmsService.Orders with @(
// // //   UI.FieldGroup #CreateForm: {
// // //     $Type: 'UI.FieldGroupType',
// // //     Data: [
// // //       // Customer MUST be selectable via value help
// // //       {
// // //         $Type: 'UI.DataField',
// // //         Value: customer,
// // //         Label: 'Select Customer'
// // //       },
// // //       {
// // //         $Type: 'UI.DataField',
// // //         Value: notes,
// // //         Label: 'Delivery Notes'
// // //       }
// // //     ]
// // //   }
// // // );

// // // ─────────────────────────────────────────────────────────────────────────────
// // // ORDER ITEMS
// // // ─────────────────────────────────────────────────────────────────────────────

// // annotate OmsService.OrderItems with @(

// //   UI.LineItem: [
// //     {
// //       // Value help from Products entity
// //       $Type: 'UI.DataField',
// //       Value: product.name,
// //       Label: 'Product'
// //     },
// //     {
// //       $Type: 'UI.DataField',
// //       Value: quantity,
// //       Label: 'Quantity'
// //     },
// //     {
// //       // Read-only — snapshotted from Product.price at order creation
// //       $Type: 'UI.DataField',
// //       Value: unitPrice,
// //       Label: 'Unit Price'
// //     },
// //     {
// //       // Read-only — computed: qty × unit_price
// //       $Type: 'UI.DataField',
// //       Value: lineTotal,
// //       Label: 'Line Total'
// //     }
// //   ],

// //   UI.FieldGroup #ItemDetails: {
// //     $Type: 'UI.FieldGroupType',
// //     Data: [
// //       { $Type: 'UI.DataField', Value: product.name,        Label: 'Product'    },
// //       { $Type: 'UI.DataField', Value: product.description, Label: 'Description'},
// //       { $Type: 'UI.DataField', Value: quantity,            Label: 'Quantity'   },
// //       { $Type: 'UI.DataField', Value: unitPrice,           Label: 'Unit Price' },
// //       { $Type: 'UI.DataField', Value: lineTotal,           Label: 'Line Total' }
// //     ]
// //   }
// // );

// // // Value help: when adding an item, show a product picker
// // annotate OmsService.OrderItems with {
// //   product @Common.ValueList: {
// //     CollectionPath: 'Products',
// //     Parameters: [
// //       {
// //         $Type:             'Common.ValueListParameterOut',
// //         LocalDataProperty: product_ID,
// //         ValueListProperty: 'ID'
// //       },
// //       {
// //         $Type:             'Common.ValueListParameterDisplayOnly',
// //         ValueListProperty: 'name'
// //       },
// //       {
// //         $Type:             'Common.ValueListParameterDisplayOnly',
// //         ValueListProperty: 'price'
// //       },
// //       {
// //         $Type:             'Common.ValueListParameterDisplayOnly',
// //         ValueListProperty: 'stock'
// //       }
// //     ]
// //   };
// //   // unit_price and lineTotal are computed — never editable
// //   unitPrice  @Core.Computed: true;
// //   lineTotal  @Core.Computed: true;
// //   product_ID @UI.Hidden: true;     
// // }

// // // ─────────────────────────────────────────────────────────────────────────────
// // // PRODUCTS
// // // ─────────────────────────────────────────────────────────────────────────────

// // annotate OmsService.Products with @(

// //   UI.HeaderInfo: {
// //     TypeName:       'Product',
// //     TypeNamePlural: 'Products',
// //     Title:       { $Type: 'UI.DataField', Value: name },
// //     Description: { $Type: 'UI.DataField', Value: category }
// //   },

// //   UI.SelectionFields: [ category, status, price ],

// //   UI.LineItem: [
// //     { $Type: 'UI.DataField', Value: name,        Label: 'Product Name' },
// //     { $Type: 'UI.DataField', Value: category,    Label: 'Category'     },
// //     { $Type: 'UI.DataField', Value: price,        Label: 'Price'        },
// //     {
// //       $Type:       'UI.DataField',
// //       Value:       stock,
// //       Label:       'Stock',
// //       Criticality: stockCriticality    // virtual field — see note below
// //     },
// //     {
// //       $Type:       'UI.DataField',
// //       Value:       status,
// //       Label:       'Status',
// //       Criticality: statusCriticality
// //     }
// //   ],

// //   UI.Facets: [
// //     {
// //       $Type: 'UI.CollectionFacet',
// //       ID:    'ProductDetailsFacet',
// //       Label: 'Product Details',
// //       Facets: [
// //         {
// //           $Type:  'UI.ReferenceFacet',
// //           Label:  'Basic Information',
// //           Target: '@UI.FieldGroup#ProductBasic'
// //         },
// //         {
// //           $Type:  'UI.ReferenceFacet',
// //           Label:  'Inventory',
// //           Target: '@UI.FieldGroup#ProductInventory'
// //         }
// //       ]
// //     }
// //   ],

// //   UI.FieldGroup #ProductBasic: {
// //     $Type: 'UI.FieldGroupType',
// //     Data: [
// //       { $Type: 'UI.DataField', Value: name,        Label: 'Product Name' },
// //       { $Type: 'UI.DataField', Value: description, Label: 'Description'  },
// //       { $Type: 'UI.DataField', Value: category,    Label: 'Category'     },
// //       { $Type: 'UI.DataField', Value: price,        Label: 'Price'        },
// //       {
// //         $Type:       'UI.DataField',
// //         Value:       status,
// //         Criticality: statusCriticality
// //       }
// //     ]
// //   },

// //   UI.FieldGroup #ProductInventory: {
// //     $Type: 'UI.FieldGroupType',
// //     Data: [
// //       {
// //         $Type:       'UI.DataField',
// //         Value:       stock,
// //         Label:       'Units in Stock',
// //         Criticality: stockCriticality
// //       }
// //     ]
// //   }
// // );

// // // CUSTOMERS  (admin only — regular users never see this entity)

// // annotate OmsService.Customers with @(

// //   UI.HeaderInfo: {
// //     TypeName:       'Customer',
// //     TypeNamePlural: 'Customers',
// //     Title:       { $Type: 'UI.DataField', Value: name  },
// //     Description: { $Type: 'UI.DataField', Value: email }
// //   },

// //   UI.SelectionFields: [ status ],

// //   UI.LineItem: [
// //     { $Type: 'UI.DataField', Value: name,    Label: 'Name'   },
// //     { $Type: 'UI.DataField', Value: email,   Label: 'Email'  },
// //     { $Type: 'UI.DataField', Value: phone,   Label: 'Phone'  },
// //     {
// //       $Type:       'UI.DataField',
// //       Value:       status,
// //       Label:       'Status',
// //       Criticality: statusCriticality
// //     }
// //   ],

// //   UI.Facets: [
// //     {
// //       $Type:  'UI.ReferenceFacet',
// //       Label:  'Customer Details',
// //       Target: '@UI.FieldGroup#CustomerDetails'
// //     }
// //   ],

// //   UI.FieldGroup #CustomerDetails: {
// //     $Type: 'UI.FieldGroupType',
// //     Data: [
// //       { $Type: 'UI.DataField', Value: name,    Label: 'Full Name' },
// //       { $Type: 'UI.DataField', Value: email,   Label: 'Email'     },
// //       { $Type: 'UI.DataField', Value: phone,   Label: 'Phone'     },
// //       { $Type: 'UI.DataField', Value: address, Label: 'Address'   },
// //       {
// //         $Type:       'UI.DataField',
// //         Value:       status,
// //         Criticality: statusCriticality
// //       }
// //     ]
// //   }
// // );

// using OmsService from '../srv/oms-service';

// // ─────────────────────────────────────────────────────────────────────────────
// // ORDERS — field-level annotations
// // ─────────────────────────────────────────────────────────────────────────────

// annotate OmsService.Orders with {
//   ID         @title: 'Order ID'      @Core.Computed: true @UI.Hidden: true;
//   status     @title: 'Status'        @Core.Computed: true @UI.HiddenFilter: false;
//   totalPrice @title: 'Total Price'   @Core.Computed: true @Measures.ISOCurrency: 'USD';
//   notes      @title: 'Delivery Notes' @UI.MultiLineText: true;
//   createdAt  @title: 'Order Date'    @Core.Computed: true;
//   createdBy  @title: 'Placed By'     @Core.Computed: true;
//   modifiedAt @title: 'Last Updated'  @Core.Computed: true;

//   // KEY FIX: customer_ID must NOT be Hidden — it is the editable foreign key.
//   // @Common.Text tells Fiori to display customer.name as the label.
//   // @Common.ValueList enables the picker dialog.
//   customer_ID
//     @title: 'Customer'
//     @Common.Text: customer.name
//     @Common.TextArrangement: #TextOnly
//     @Common.ValueList: {
//       CollectionPath: 'Customers',
//       Parameters: [
//         {
//           $Type:             'Common.ValueListParameterOut',
//           LocalDataProperty: customer_ID,
//           ValueListProperty: 'ID'
//         },
//         {
//           $Type:             'Common.ValueListParameterDisplayOnly',
//           ValueListProperty: 'name'
//         },
//         {
//           $Type:             'Common.ValueListParameterDisplayOnly',
//           ValueListProperty: 'email'
//         },
//         {
//           $Type:             'Common.ValueListParameterDisplayOnly',
//           ValueListProperty: 'phone'
//         }
//       ]
//     };
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // ORDERS — UI layout annotations
// // ─────────────────────────────────────────────────────────────────────────────

// annotate OmsService.Orders with @(

//   UI.HeaderInfo: {
//     TypeName:       'Order',
//     TypeNamePlural: 'Orders',
//     Title:       { $Type: 'UI.DataField', Value: ID },
//     Description: { $Type: 'UI.DataField', Value: status }
//   },

//   UI.SelectionFields: [ status, createdAt ],

//   UI.LineItem: [
//     {
//       $Type: 'UI.DataField',
//       Value: customer_ID,   // renders as customer.name via @Common.Text
//       Label: 'Customer'
//     },
//     {
//       $Type: 'UI.DataField',
//       Value: createdAt,
//       Label: 'Order Date'
//     },
//     {
//       $Type: 'UI.DataField',
//       Value: totalPrice,
//       Label: 'Total Price'
//     },
//     {
//       $Type:       'UI.DataField',
//       Value:       status,
//       Label:       'Status',
//       Criticality: statusCriticality
//     },
//     {
//       $Type:              'UI.DataFieldForAction',
//       Action:             'OmsService.EntityContainer/confirm',
//       Label:              'Confirm Order',
//       InvocationGrouping: #Isolated
//     },
//     {
//       $Type:              'UI.DataFieldForAction',
//       Action:             'OmsService.EntityContainer/cancel',
//       Label:              'Cancel Order',
//       InvocationGrouping: #Isolated
//     }
//   ],

//   UI.PresentationVariant: {
//     MaxItems: 10,
//     SortOrder: [{ Property: createdAt, Descending: true }],
//     Visualizations: ['@UI.LineItem']
//   },

//   // Object-page header badges
//   UI.HeaderFacets: [
//     { $Type: 'UI.ReferenceFacet', Target: '@UI.FieldGroup#StatusBadge' },
//     { $Type: 'UI.ReferenceFacet', Target: '@UI.FieldGroup#TotalBadge'  }
//   ],

//   UI.FieldGroup #StatusBadge: {
//     Data: [{ $Type: 'UI.DataField', Value: status, Criticality: statusCriticality }]
//   },

//   UI.FieldGroup #TotalBadge: {
//     Data: [{ $Type: 'UI.DataField', Value: totalPrice, Label: 'Order Total' }]
//   },

//   // Object-page tabs
//   UI.Facets: [
//     {
//       $Type: 'UI.CollectionFacet',
//       ID:    'GeneralFacet',
//       Label: 'General Information',
//       Facets: [
//         { $Type: 'UI.ReferenceFacet', Label: 'Order Details', Target: '@UI.FieldGroup#OrderDetails' },
//         { $Type: 'UI.ReferenceFacet', Label: 'Audit',         Target: '@UI.FieldGroup#AuditDetails' }
//       ]
//     },
//     { $Type: 'UI.ReferenceFacet', ID: 'ItemsFacet', Label: 'Order Items', Target: 'items/@UI.LineItem' },
//     { $Type: 'UI.ReferenceFacet', ID: 'NotesFacet', Label: 'Notes',       Target: '@UI.FieldGroup#NotesGroup' }
//   ],

//   // FIX: use customer_ID (not customer.name) so the field is editable with value help.
//   // customer.email is shown read-only once a customer is selected.
//   UI.FieldGroup #OrderDetails: {
//     $Type: 'UI.FieldGroupType',
//     Data: [
//       {
//         $Type: 'UI.DataField',
//         Value: customer_ID,
//         Label: 'Customer'
//       },
//       {
//         // Read-only — auto-populated from the selected customer
//         $Type: 'UI.DataField',
//         Value: customer.email,
//         Label: 'Customer Email'
//       },
//       {
//         $Type:       'UI.DataField',
//         Value:       status,
//         Label:       'Status',
//         Criticality: statusCriticality
//       },
//       {
//         $Type: 'UI.DataField',
//         Value: totalPrice,
//         Label: 'Total Price'
//       }
//     ]
//   },

//   UI.FieldGroup #AuditDetails: {
//     $Type: 'UI.FieldGroupType',
//     Data: [
//       { $Type: 'UI.DataField', Value: createdBy,  Label: 'Placed By'    },
//       { $Type: 'UI.DataField', Value: createdAt,  Label: 'Order Date'   },
//       { $Type: 'UI.DataField', Value: modifiedAt, Label: 'Last Updated' }
//     ]
//   },

//   UI.FieldGroup #NotesGroup: {
//     $Type: 'UI.FieldGroupType',
//     Data: [
//       { $Type: 'UI.DataField', Value: notes, Label: 'Delivery Notes' }
//     ]
//   }
// );

// // Create form — only fields the user fills in manually
// annotate OmsService.Orders with @(
//   UI.CreateHidden: false,
//   UI.DeleteHidden: true,

//   UI.FieldGroup #CreateForm: {
//     $Type: 'UI.FieldGroupType',
//     Data: [
//       // customer_ID shows the value-help picker thanks to @Common.ValueList above
//       { $Type: 'UI.DataField', Value: customer_ID, Label: 'Customer'        },
//       { $Type: 'UI.DataField', Value: notes,        Label: 'Delivery Notes' }
//     ]
//   }
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // ORDER ITEMS — field-level annotations
// // ─────────────────────────────────────────────────────────────────────────────

// annotate OmsService.OrderItems with {
//   product   @title: 'Product';
//   quantity  @title: 'Quantity';
//   unitPrice @title: 'Unit Price' @Core.Computed: true @Measures.ISOCurrency: 'USD';
//   lineTotal @title: 'Line Total' @Core.Computed: true @Measures.ISOCurrency: 'USD';

//   // KEY FIX: same pattern as customer_ID above.
//   // product_ID must NOT be @UI.Hidden — it is the writable FK.
//   // @Common.Text makes Fiori display product.name as the label.
//   product_ID
//     @title: 'Product'
//     @Common.Text: product.name
//     @Common.TextArrangement: #TextOnly
//     @Common.ValueList: {
//       CollectionPath: 'Products',
//       Parameters: [
//         {
//           $Type:             'Common.ValueListParameterOut',
//           LocalDataProperty: product_ID,
//           ValueListProperty: 'ID'
//         },
//         {
//           $Type:             'Common.ValueListParameterDisplayOnly',
//           ValueListProperty: 'name'
//         },
//         {
//           $Type:             'Common.ValueListParameterDisplayOnly',
//           ValueListProperty: 'price'
//         },
//         {
//           $Type:             'Common.ValueListParameterDisplayOnly',
//           ValueListProperty: 'stock'
//         }
//       ]
//     };
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // ORDER ITEMS — UI layout annotations
// // ─────────────────────────────────────────────────────────────────────────────

// annotate OmsService.OrderItems with @(

//   UI.LineItem: [
//     {
//       // FIX: use product_ID (not product.name) so value help works inline
//       $Type: 'UI.DataField',
//       Value: product_ID,
//       Label: 'Product'
//     },
//     { $Type: 'UI.DataField', Value: quantity,  Label: 'Quantity'   },
//     { $Type: 'UI.DataField', Value: unitPrice, Label: 'Unit Price' },
//     { $Type: 'UI.DataField', Value: lineTotal, Label: 'Line Total' }
//   ],

//   UI.FieldGroup #ItemDetails: {
//     $Type: 'UI.FieldGroupType',
//     Data: [
//       { $Type: 'UI.DataField', Value: product_ID,          Label: 'Product'     },
//       { $Type: 'UI.DataField', Value: product.description, Label: 'Description' },
//       { $Type: 'UI.DataField', Value: quantity,             Label: 'Quantity'    },
//       { $Type: 'UI.DataField', Value: unitPrice,            Label: 'Unit Price'  },
//       { $Type: 'UI.DataField', Value: lineTotal,            Label: 'Line Total'  }
//     ]
//   }
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // PRODUCTS
// // ─────────────────────────────────────────────────────────────────────────────

// annotate OmsService.Products with {
//   name        @title: 'Product Name';
//   description @title: 'Description' @UI.MultiLineText: true;
//   price       @title: 'Price'       @Measures.ISOCurrency: 'USD';
//   stock       @title: 'Stock';
//   category    @title: 'Category';
// }

// annotate OmsService.Products with @(

//   UI.HeaderInfo: {
//     TypeName:       'Product',
//     TypeNamePlural: 'Products',
//     Title:       { $Type: 'UI.DataField', Value: name     },
//     Description: { $Type: 'UI.DataField', Value: category }
//   },

//   UI.SelectionFields: [ category, price ],

//   UI.LineItem: [
//     { $Type: 'UI.DataField', Value: name,     Label: 'Product Name' },
//     { $Type: 'UI.DataField', Value: category, Label: 'Category'     },
//     { $Type: 'UI.DataField', Value: price,    Label: 'Price'        },
//     { $Type: 'UI.DataField', Value: stock,    Label: 'Stock', Criticality: stockCriticality }
//   ],

//   UI.Facets: [
//     {
//       $Type: 'UI.CollectionFacet',
//       ID:    'ProductDetailsFacet',
//       Label: 'Product Details',
//       Facets: [
//         { $Type: 'UI.ReferenceFacet', Label: 'Basic Information', Target: '@UI.FieldGroup#ProductBasic'     },
//         { $Type: 'UI.ReferenceFacet', Label: 'Inventory',         Target: '@UI.FieldGroup#ProductInventory' }
//       ]
//     }
//   ],

//   UI.FieldGroup #ProductBasic: {
//     $Type: 'UI.FieldGroupType',
//     Data: [
//       { $Type: 'UI.DataField', Value: name,        Label: 'Product Name' },
//       { $Type: 'UI.DataField', Value: description, Label: 'Description'  },
//       { $Type: 'UI.DataField', Value: category,    Label: 'Category'     },
//       { $Type: 'UI.DataField', Value: price,        Label: 'Price'        }
//     ]
//   },

//   UI.FieldGroup #ProductInventory: {
//     $Type: 'UI.FieldGroupType',
//     Data: [
//       { $Type: 'UI.DataField', Value: stock, Label: 'Units in Stock', Criticality: stockCriticality }
//     ]
//   }
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // CUSTOMERS
// // ─────────────────────────────────────────────────────────────────────────────

// annotate OmsService.Customers with {
//   name    @title: 'Customer Name';
//   email   @title: 'Email';
//   phone   @title: 'Phone';
//   address @title: 'Address';
//   status  @title: 'Status';
// }

// annotate OmsService.Customers with @(

//   UI.HeaderInfo: {
//     TypeName:       'Customer',
//     TypeNamePlural: 'Customers',
//     Title:       { $Type: 'UI.DataField', Value: name  },
//     Description: { $Type: 'UI.DataField', Value: email }
//   },

//   UI.SelectionFields: [ status ],

//   UI.LineItem: [
//     { $Type: 'UI.DataField', Value: name,  Label: 'Name'  },
//     { $Type: 'UI.DataField', Value: email, Label: 'Email' },
//     { $Type: 'UI.DataField', Value: phone, Label: 'Phone' },
//     { $Type: 'UI.DataField', Value: status, Label: 'Status', Criticality: statusCriticality }
//   ],

//   UI.Facets: [
//     { $Type: 'UI.ReferenceFacet', Label: 'Customer Details', Target: '@UI.FieldGroup#CustomerDetails' }
//   ],

//   UI.FieldGroup #CustomerDetails: {
//     $Type: 'UI.FieldGroupType',
//     Data: [
//       { $Type: 'UI.DataField', Value: name,    Label: 'Full Name' },
//       { $Type: 'UI.DataField', Value: email,   Label: 'Email'     },
//       { $Type: 'UI.DataField', Value: phone,   Label: 'Phone'     },
//       { $Type: 'UI.DataField', Value: address, Label: 'Address'   },
//       { $Type: 'UI.DataField', Value: status,  Criticality: statusCriticality }
//     ]
//   }
// );


// annotate OmsService.Orders with {
//   customer @(
//     Common.Text: customer.name,
//     Common.TextArrangement: #TextOnly,
//     Common.ValueList: {
//       $Type:          'Common.ValueListType',
//       CollectionPath: 'Customers',
//       Parameters: [
//         { $Type: 'Common.ValueListParameterOut',        LocalDataProperty: customer_ID, ValueListProperty: 'ID'    },
//         { $Type: 'Common.ValueListParameterDisplayOnly',                                ValueListProperty: 'name'  },
//         { $Type: 'Common.ValueListParameterDisplayOnly',                                ValueListProperty: 'email' }
//       ]
//     }
//   );
//   customer_ID @UI.Hidden: true;  // hide display only — still writable
// }

// annotate OmsService.OrderItems with {
//   product @(
//     Common.Text: product.name,
//     Common.TextArrangement: #TextOnly,
//     Common.ValueList: {
//       $Type:          'Common.ValueListType',
//       CollectionPath: 'Products',
//       Parameters: [
//         { $Type: 'Common.ValueListParameterOut',        LocalDataProperty: product_ID, ValueListProperty: 'ID'    },
//         { $Type: 'Common.ValueListParameterDisplayOnly',                               ValueListProperty: 'name'  },
//         { $Type: 'Common.ValueListParameterDisplayOnly',                               ValueListProperty: 'price' },
//         { $Type: 'Common.ValueListParameterDisplayOnly',                               ValueListProperty: 'stock' }
//       ]
//     }
//   );
//   product_ID @UI.Hidden: true;
// }