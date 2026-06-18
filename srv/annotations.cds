using OmsService from '../srv/oms-service';



annotate OmsService.Orders with {
  ID         @title: 'Order ID'       @Core.Computed: true @UI.Hidden: true;
  status     @title: 'Status'         @Core.Computed: true @UI.HiddenFilter: false;
  totalPrice @title: 'Total Price'    @Core.Computed: true @Measures.ISOCurrency: 'USD';
  notes      @title: 'Delivery Notes' @UI.MultiLineText: true;
  createdAt  @title: 'Order Date'     @Core.Computed: true;
  createdBy  @title: 'Placed By'      @Core.Computed: true;
  modifiedAt @title: 'Last Updated'   @Core.Computed: true;

  // CRITICAL FIX: annotate the ASSOCIATION (customer), NOT customer_ID.
  // Fiori maps this to customer_ID in OData $metadata and renders a value-help
  // picker instead of a raw GUID input.
  customer @(
    title: 'Customer',
    Common.Text: customer.name,
    Common.TextArrangement: #TextOnly,
    Common.ValueList: {
      $Type:          'Common.ValueListType',
      CollectionPath: 'Customers',
      Parameters: [
        {
          $Type:             'Common.ValueListParameterOut',
          LocalDataProperty: customer_ID,
          ValueListProperty: 'ID'
        },
        {
          $Type:             'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name'
        },
        {
          $Type:             'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'email'
        },
        {
          $Type:             'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'phone'
        }
      ]
    }
  );

  // customer_ID: hidden from display, but writable (no @Core.Computed, no @ReadOnly)
  // so the value-help out-parameter can populate it.
}


annotate OmsService.Orders with @(

  UI.HeaderInfo: {
    TypeName:       'Order',
    TypeNamePlural: 'Orders',
    Title:       { $Type: 'UI.DataField', Value: ID },
    Description: { $Type: 'UI.DataField', Value: status }
  },

  UI.SelectionFields: [ status, createdAt ],

  UI.LineItem: [
    { $Type: 'UI.DataField', Value: customer_ID,  Label: 'Customer'    },
    { $Type: 'UI.DataField', Value: createdAt,    Label: 'Order Date'  },
    { $Type: 'UI.DataField', Value: totalPrice,   Label: 'Total Price' },
    { $Type: 'UI.DataField', Value: status,       Label: 'Status', Criticality: statusCriticality },
    {
      $Type:              'UI.DataFieldForAction',
      Action:             'OmsService.confirm',
      Label:              'Confirm Order',

      InvocationGrouping: #Isolated
    },
    {
      $Type:              'UI.DataFieldForAction',
      Action:             'OmsService.cancel',
      Label:              'Cancel Order',
      InvocationGrouping: #Isolated,
      Determining: false
    },
    {
  $Type:              'UI.DataFieldForAction',
  Action:             'OmsService.ship',
  Label:              'Mark as Shipped',
  InvocationGrouping: #Isolated
},
  ],

  UI.PresentationVariant: {
    MaxItems: 10,
    SortOrder: [{ Property: createdAt, Descending: true }],
    Visualizations: ['@UI.LineItem']
  },

  UI.HeaderFacets: [
    { $Type: 'UI.ReferenceFacet', Target: '@UI.FieldGroup#StatusBadge' },
    { $Type: 'UI.ReferenceFacet', Target: '@UI.FieldGroup#TotalBadge'  }
  ],

  UI.FieldGroup #StatusBadge: {
    Data: [{ $Type: 'UI.DataField', Value: status, Criticality: statusCriticality }]
  },

  UI.FieldGroup #TotalBadge: {
    Data: [{ $Type: 'UI.DataField', Value: totalPrice, Label: 'Order Total' }]
  },

  UI.Facets: [
    {
      $Type: 'UI.CollectionFacet',
      ID:    'GeneralFacet',
      Label: 'General Information',
      Facets: [
        { $Type: 'UI.ReferenceFacet', Label: 'Order Details', Target: '@UI.FieldGroup#OrderDetails' },
        { $Type: 'UI.ReferenceFacet', Label: 'Audit',         Target: '@UI.FieldGroup#AuditDetails' }
      ]
    },
    { $Type: 'UI.ReferenceFacet', ID: 'ItemsFacet', Label: 'Order Items', Target: 'items/@UI.LineItem' },
    { $Type: 'UI.ReferenceFacet', ID: 'NotesFacet', Label: 'Notes',       Target: '@UI.FieldGroup#NotesGroup' }
  ],

  UI.FieldGroup #OrderDetails: {
    $Type: 'UI.FieldGroupType',
    Data: [
      // customer_ID renders as the customer name (via @Common.Text) with a picker
      { $Type: 'UI.DataField', Value: customer_ID,    Label: 'Customer'       },
      // customer.email is a read-only nav-property — shown after selection
      { $Type: 'UI.DataField', Value: customer.email, Label: 'Customer Email' },
      { $Type: 'UI.DataField', Value: status,         Label: 'Status',   Criticality: statusCriticality },
      { $Type: 'UI.DataField', Value: cancellationReason, Label: 'Cancel Reason' },
      { $Type: 'UI.DataField', Value: totalPrice,     Label: 'Total Price' }
    ]
  },

  UI.FieldGroup #AuditDetails: {
    $Type: 'UI.FieldGroupType',
    Data: [
      { $Type: 'UI.DataField', Value: createdBy,  Label: 'Placed By'    },
      { $Type: 'UI.DataField', Value: createdAt,  Label: 'Order Date'   },
      { $Type: 'UI.DataField', Value: modifiedAt, Label: 'Last Updated' }
    ]
  },

  UI.FieldGroup #NotesGroup: {
    $Type: 'UI.FieldGroupType',
    Data: [
      { $Type: 'UI.DataField', Value: notes, Label: 'Delivery Notes' }
    ]
  }
);

annotate OmsService.Orders actions {
  cancel @(
    Common.IsActionCritical: true,
    Core.OperationAvailable: canCancel
  );
  ship @(
    Core.OperationAvailable: canShip
  );
};

annotate OmsService.Orders with @(
  UI.CreateHidden: false,
  UI.DeleteHidden: true,

  // The create dialog shows customer picker + notes.
  // customer_ID picks up the ValueList from the association annotation above.
  UI.FieldGroup #CreateForm: {
    $Type: 'UI.FieldGroupType',
    Data: [
      { $Type: 'UI.DataField', Value: customer_ID, Label: 'Customer'        },
      { $Type: 'UI.DataField', Value: notes,       Label: 'Delivery Notes'  }
    ]
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// ORDER ITEMS — field-level annotations
// ─────────────────────────────────────────────────────────────────────────────

annotate OmsService.OrderItems with {
  quantity  @title: 'Quantity';
  unitPrice @title: 'Unit Price' @Core.Computed: true @Measures.ISOCurrency: 'USD';
  lineTotal @title: 'Line Total' @Core.Computed: true @Measures.ISOCurrency: 'USD';

  // CRITICAL FIX: annotate the ASSOCIATION (product), NOT product_ID.
  product @(
    title: 'Product',
    Common.Text: product.name,
    Common.TextArrangement: #TextOnly,
    Common.ValueList: {
      $Type:          'Common.ValueListType',
      CollectionPath: 'Products',
      Parameters: [
        {
          $Type:             'Common.ValueListParameterOut',
          LocalDataProperty: product_ID,
          ValueListProperty: 'ID'
        },
        {
          $Type:             'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name'
        },
        {
          $Type:             'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'price'
        },
        {
          $Type:             'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'stock'
        },
        {
          $Type:             'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'category'
        }
      ]
    }
  );

  // product_ID: hidden from display, writable so the value-help can populate it.
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER ITEMS — UI layout annotations
// ─────────────────────────────────────────────────────────────────────────────

annotate OmsService.OrderItems with @(

  // HeaderInfo: replaces the raw UUID title on the OrderItems object page.
  UI.HeaderInfo: {
    TypeName:       'Order Item',
    TypeNamePlural: 'Order Items',
    Title:       { $Type: 'UI.DataField', Value: product_ID },
    Description: { $Type: 'UI.DataField', Value: quantity   }
  },

  // LineItem drives both the table view AND the inline create row.
  // product_ID renders as product.name (via @Common.Text) with value-help picker.
  // quantity is the only free-text input — unitPrice and lineTotal are computed.
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: product_ID, Label: 'Product'    },
    { $Type: 'UI.DataField', Value: quantity,   Label: 'Quantity'   },
    { $Type: 'UI.DataField', Value: unitPrice,  Label: 'Unit Price' },
    { $Type: 'UI.DataField', Value: lineTotal,  Label: 'Line Total' }
  ],

  // Facets for the OrderItems object page (shown when creation mode = NewPage).
  UI.Facets: [
    { $Type: 'UI.ReferenceFacet', Label: 'Item Details', Target: '@UI.FieldGroup#ItemDetails' }
  ],

  UI.FieldGroup #ItemDetails: {
    $Type: 'UI.FieldGroupType',
    Data: [
      // product_ID with value-help picker (via @Common.Text / @Common.ValueList on 'product' above)
      { $Type: 'UI.DataField', Value: product_ID,          Label: 'Product'     },
      { $Type: 'UI.DataField', Value: product.description, Label: 'Description' },
      { $Type: 'UI.DataField', Value: quantity,             Label: 'Quantity'    },
      { $Type: 'UI.DataField', Value: unitPrice,            Label: 'Unit Price'  },
      { $Type: 'UI.DataField', Value: lineTotal,            Label: 'Line Total'  }
    ]
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

annotate OmsService.Products with {
  name        @title: 'Product Name';
  description @title: 'Description' @UI.MultiLineText: true;
  price       @title: 'Price'       @Measures.ISOCurrency: 'USD';
  stock       @title: 'Stock';
  category    @title: 'Category';
}

annotate OmsService.Products with {
  imageUrl @(
    UI.IsImageURL: true,
    title: 'Product Image',
    Core.Computed: true
  );
  imagePublicId @UI.Hidden: true;
}


annotate OmsService.Products with @(
  UI.CreateHidden: false,
  UI.DeleteHidden: false,
  UI.UpdateHidden: false,

  UI.HeaderInfo: {
    TypeName:       'Product',
    TypeNamePlural: 'Products',
    Title:       { $Type: 'UI.DataField', Value: name     },
    Description: { $Type: 'UI.DataField', Value: category },
    ImageUrl: imageUrl
  },

  UI.SelectionFields: [ category, price ],

  UI.LineItem: [
      { $Type: 'UI.DataField', Value: imageUrl, Label: 'Image' },
    { $Type: 'UI.DataField', Value: name,     Label: 'Product Name' },
    { $Type: 'UI.DataField', Value: category, Label: 'Category'     },
    { $Type: 'UI.DataField', Value: price,    Label: 'Price'        },
    { $Type: 'UI.DataField', Value: stock,    Label: 'Stock', Criticality: stockCriticality }
  ],

  UI.Facets: [
    {
      $Type: 'UI.CollectionFacet',
      ID:    'ProductDetailsFacet',
      Label: 'Product Details',
      Facets: [
        { $Type: 'UI.ReferenceFacet', Label: 'Basic Information', Target: '@UI.FieldGroup#ProductBasic'     },
        { $Type: 'UI.ReferenceFacet', Label: 'Inventory',         Target: '@UI.FieldGroup#ProductInventory' }
      ]
    },
      {
      $Type: 'UI.ReferenceFacet',
      Target: '@UI.FieldGroup#ImageUpload',
      Label: 'Product Image',
    }
  ],

  UI.FieldGroup #ProductBasic: {
    $Type: 'UI.FieldGroupType',
    Data: [
      { $Type: 'UI.DataField', Value: name,        Label: 'Product Name' },
      { $Type: 'UI.DataField', Value: description, Label: 'Description'  },
      { $Type: 'UI.DataField', Value: category,    Label: 'Category'     },
      { $Type: 'UI.DataField', Value: price,        Label: 'Price'        }
    ]
  },
  UI.FieldGroup #ImageUpload: {
    Data: [
      { Value: imageUrl, Label: 'Image URL' },
    ]
  },
  UI.FieldGroup #ProductInventory: {
    $Type: 'UI.FieldGroupType',
    Data: [
      { $Type: 'UI.DataField', Value: stock, Label: 'Units in Stock', Criticality: stockCriticality }
    ]
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────────────────────────────────────

annotate OmsService.Customers with {
  name    @title: 'Customer Name';
  email   @title: 'Email';
  phone   @title: 'Phone';
  address @title: 'Address';
  status  @title: 'Status';
}

annotate OmsService.Customers with @(
  UI.CreateHidden: false,
  UI.DeleteHidden: false,

  UI.HeaderInfo: {
    TypeName:       'Customer',
    TypeNamePlural: 'Customers',
    Title:       { $Type: 'UI.DataField', Value: name  },
    Description: { $Type: 'UI.DataField', Value: email }
  },

  UI.SelectionFields: [ status ],

  UI.LineItem: [
    { $Type: 'UI.DataField', Value: name,   Label: 'Name'  },
    { $Type: 'UI.DataField', Value: email,  Label: 'Email' },
    { $Type: 'UI.DataField', Value: phone,  Label: 'Phone' },
    { $Type: 'UI.DataField', Value: status, Label: 'Status', Criticality: statusCriticality }
  ],

  UI.Facets: [
    { $Type: 'UI.ReferenceFacet', Label: 'Customer Details', Target: '@UI.FieldGroup#CustomerDetails' }
  ],

  UI.FieldGroup #CustomerDetails: {
    $Type: 'UI.FieldGroupType',
    Data: [
      { $Type: 'UI.DataField', Value: name,    Label: 'Full Name' },
      { $Type: 'UI.DataField', Value: email,   Label: 'Email'     },
      { $Type: 'UI.DataField', Value: phone,   Label: 'Phone'     },
      { $Type: 'UI.DataField', Value: address, Label: 'Address'   },
      { $Type: 'UI.DataField', Value: status,  Criticality: statusCriticality }
    ]
  }
);

// OrderSummary

// ─────────────────────────────────────────────────────────────────────────────
// ORDER SUMMARY — analytical entity
// ─────────────────────────────────────────────────────────────────────────────


// 1. Field-level analytics role declarations
annotate OmsService.OrderSummary with {
  totalPrice @(
    Analytics.Measure:    true,
    Aggregation.default:  #SUM,
    title:                'Revenue',
    Measures.ISOCurrency: 'USD'
  );
  orderCount @(
    Analytics.Measure:   true,
    Aggregation.default: #SUM,
    title:               'Order Count'
  );
  status @(
    Analytics.Dimension: true,
    title: 'Status'
  );
  customerName @(
    Analytics.Dimension: true,
    title: 'Customer'
  );
  createdAt @(
    Analytics.Dimension: true,
    title: 'Order Date'
  );
}

// 2. Aggregation capability — REQUIRED for CAP to advertise $apply support.
//    Without this Fiori treats the entity as a plain read-only list.
annotate OmsService.OrderSummary with @(
  Aggregation.ApplySupported: {
    $Type:           'Aggregation.ApplySupportedType',
    Transformations: [ 'aggregate', 'groupby', 'filter' ],
    GroupableProperties: [ status, customerName, createdAt ],
    AggregatableProperties: [
      { $Type: 'Aggregation.AggregatablePropertyType', Property: totalPrice },
      { $Type: 'Aggregation.AggregatablePropertyType', Property: orderCount }
    ]
  }
);

// 3. DataPoints — MUST be separate named annotations; UI.KPI references them
//    by path string, NOT by inline object.
annotate OmsService.OrderSummary with @(
  UI.DataPoint #TotalRevenue: {
    $Type: 'UI.DataPointType',
    Value: totalPrice,
    Title: 'Total Revenue'
  },
  UI.DataPoint #OrderCount: {
    $Type: 'UI.DataPointType',
    Value: orderCount,
    Title: 'Total Orders'
  }
);

// 4. KPI tiles — DataPoint must be a path reference, not an inline definition.
// annotate OmsService.OrderSummary with @(
//   UI.KPI #TotalRevenue: {
//     $Type:            'UI.KPIType',
//     DataPoint:        '@UI.DataPoint#TotalRevenue',
//     SelectionVariant: {
//       $Type:         'UI.SelectionVariantType',
//       SelectOptions: []
//     }
//   },
//   UI.KPI #OrderCount: {
//     $Type:            'UI.KPIType',
//     DataPoint:        '@UI.DataPoint#OrderCount',
//     SelectionVariant: {
//       $Type:         'UI.SelectionVariantType',
//       SelectOptions: []
//     }
//   }
// );

annotate OmsService.OrderSummary with @(
  UI.KPI #TotalRevenue: {
    $Type: 'UI.KPIType',
    DataPoint: {
      $Type: 'UI.DataPointType',
      Value: totalPrice,
      Title: 'Total Revenue'
    },
    SelectionVariant: {
      $Type: 'UI.SelectionVariantType',
      SelectOptions: []
    }
  },
  UI.KPI #OrderCount: {
    $Type: 'UI.KPIType',
    DataPoint: {
      $Type: 'UI.DataPointType',
      Value: orderCount,
      Title: 'Total Orders'
    },
    SelectionVariant: {
      $Type: 'UI.SelectionVariantType',
      SelectOptions: []
    }
  }
);

// 5. Chart
annotate OmsService.OrderSummary with @(
  UI.Chart #RevenueByStatus: {
    $Type:     'UI.ChartDefinitionType',
    ChartType: #Column,
    Title:     'Revenue by Status',
    Measures:  [ totalPrice ],
    MeasureAttributes: [{
      $Type:     'UI.ChartMeasureAttributeType',
      Measure:   totalPrice,
      Role:      #Axis1,
      DataPoint: '@UI.DataPoint#TotalRevenue'
    }],
    Dimensions: [ status ],
    DimensionAttributes: [{
      $Type:     'UI.ChartDimensionAttributeType',
      Dimension: status,
      Role:      #Category
    }]
  },

  UI.Chart #OrdersByCustomer: {
    $Type:     'UI.ChartDefinitionType',
    ChartType: #Bar,
    Title:     'Orders by Customer',
    Measures:  [ orderCount ],
    MeasureAttributes: [{
      $Type:     'UI.ChartMeasureAttributeType',
      Measure:   orderCount,
      Role:      #Axis1,
      DataPoint: '@UI.DataPoint#OrderCount'
    }],
    Dimensions: [ customerName ],
    DimensionAttributes: [{
      $Type:     'UI.ChartDimensionAttributeType',
      Dimension: customerName,
      Role:      #Category
    }]
  }
);

// 6. Selection fields
annotate OmsService.OrderSummary with @(
  UI.SelectionFields: [ status, customerName, createdAt ]
);

// 7. Table (drill-down list)
annotate OmsService.OrderSummary with @(
  UI.LineItem: [
    { $Type: 'UI.DataField', Value: customerName, Label: 'Customer'    },
    { $Type: 'UI.DataField', Value: createdAt,    Label: 'Order Date'  },
    { $Type: 'UI.DataField', Value: totalPrice,   Label: 'Revenue'     },
    { $Type: 'UI.DataField', Value: orderCount,   Label: 'Order Count' },
    { $Type: 'UI.DataField', Value: status, Label: 'Status' }
  ],
  UI.HeaderInfo: {
    TypeName:       'Order Summary',
    TypeNamePlural: 'Order Summaries',
    Title: { $Type: 'UI.DataField', Value: customerName }
  }
);

// 8. Presentation & SelectionPresentation variants.
//    The SelectionPresentationVariant is the entry point Fiori uses on an
//    Analytical List Page — both the chart and the table must appear here.
annotate OmsService.OrderSummary with @(
  UI.PresentationVariant: {
    $Type:          'UI.PresentationVariantType',
    Visualizations: [ '@UI.Chart#RevenueByStatus', '@UI.LineItem' ],
    SortOrder: [{ $Type: 'Common.SortOrderType', Property: totalPrice, Descending: true }],
    RequestAtLeast: [ totalPrice, orderCount, status, customerName ]
  },

  // Unqualified variant — matches manifest's defaultTemplateAnnotationPath without a qualifier
  UI.SelectionPresentationVariant: {
    $Type: 'UI.SelectionPresentationVariantType',
    Text:  'Default',
    SelectionVariant: {
      $Type:         'UI.SelectionVariantType',
      SelectOptions: []
    },
    PresentationVariant: {
      $Type:          'UI.PresentationVariantType',
      Visualizations: [ '@UI.Chart#RevenueByStatus', '@UI.LineItem' ],
      SortOrder: [{ $Type: 'Common.SortOrderType', Property: totalPrice, Descending: true }],
      RequestAtLeast: [ totalPrice, orderCount, status, customerName ]
    }
  },

  // Qualified variant for manifests that explicitly reference #Default
  UI.SelectionPresentationVariant #Default: {
    $Type: 'UI.SelectionPresentationVariantType',
    Text:  'Default',
    SelectionVariant: {
      $Type:         'UI.SelectionVariantType',
      SelectOptions: []
    },
    PresentationVariant: {
      $Type:          'UI.PresentationVariantType',
      Visualizations: [ '@UI.Chart#RevenueByStatus', '@UI.LineItem' ],
      SortOrder: [{ $Type: 'Common.SortOrderType', Property: totalPrice, Descending: true }],
      RequestAtLeast: [ totalPrice, orderCount, status, customerName ]
    }
  }
);


//----------------------------------------------------------------------------------------
// // 1. Field-level analytics role declarations
// annotate OmsService.OrderSummary with {
//   totalPrice @(
//     Analytics.Measure:    true,
//     Aggregation.default:  #SUM,
//     title:                'Revenue',
//     Measures.ISOCurrency: 'USD'
//   );
//   orderCount @(
//     Analytics.Measure:   true,
//     Aggregation.default: #SUM,
//     title:               'Order Count'
//   );
//   status @(
//     Analytics.Dimension: true,
//     title: 'Status'
//   );
//   customerName @(
//     Analytics.Dimension: true,
//     title: 'Customer'
//   );
//   createdAt @(
//     Analytics.Dimension: true,
//     title: 'Order Date'
//   );
// }

// // 2. Aggregation capability — REQUIRED for CAP to advertise $apply support.
// //    Without this Fiori treats the entity as a plain read-only list.
// annotate OmsService.OrderSummary with @(
//   Aggregation.ApplySupported: {
//     $Type:           'Aggregation.ApplySupportedType',
//     Transformations: [ 'aggregate', 'groupby', 'filter' ],
//     GroupableProperties: [ status, customerName, createdAt ],
//     AggregatableProperties: [
//       { $Type: 'Aggregation.AggregatablePropertyType', Property: totalPrice },
//       { $Type: 'Aggregation.AggregatablePropertyType', Property: orderCount }
//     ]
//   }
// );

// // 3. DataPoints — MUST be separate named annotations; UI.KPI references them
// //    by path string, NOT by inline object.
// annotate OmsService.OrderSummary with @(
//   UI.DataPoint #TotalRevenue: {
//     $Type: 'UI.DataPointType',
//     Value: totalPrice,
//     Title: 'Total Revenue'
//   },
//   UI.DataPoint #OrderCount: {
//     $Type: 'UI.DataPointType',
//     Value: orderCount,
//     Title: 'Total Orders'
//   }
// );

// // 4. KPI tiles — DataPoint must be a path reference, not an inline definition.
// annotate OmsService.OrderSummary with @(
//   UI.KPI #TotalRevenue: {
//     $Type:            'UI.KPIType',
//     DataPoint:        '@UI.DataPoint#TotalRevenue',
//     SelectionVariant: {
//       $Type:         'UI.SelectionVariantType',
//       SelectOptions: []
//     }
//   },
//   UI.KPI #OrderCount: {
//     $Type:            'UI.KPIType',
//     DataPoint:        '@UI.DataPoint#OrderCount',
//     SelectionVariant: {
//       $Type:         'UI.SelectionVariantType',
//       SelectOptions: []
//     }
//   }
// );

// // 5. Chart
// annotate OmsService.OrderSummary with @(
//   UI.Chart #RevenueByStatus: {
//     $Type:     'UI.ChartDefinitionType',
//     ChartType: #Column,
//     Title:     'Revenue by Status',
//     Measures:  [ totalPrice ],
//     MeasureAttributes: [{
//       $Type:     'UI.ChartMeasureAttributeType',
//       Measure:   totalPrice,
//       Role:      #Axis1,
//       DataPoint: '@UI.DataPoint#TotalRevenue'
//     }],
//     Dimensions: [ status ],
//     DimensionAttributes: [{
//       $Type:     'UI.ChartDimensionAttributeType',
//       Dimension: status,
//       Role:      #Category
//     }]
//   },

//   UI.Chart #OrdersByCustomer: {
//     $Type:     'UI.ChartDefinitionType',
//     ChartType: #Bar,
//     Title:     'Orders by Customer',
//     Measures:  [ orderCount ],
//     MeasureAttributes: [{
//       $Type:     'UI.ChartMeasureAttributeType',
//       Measure:   orderCount,
//       Role:      #Axis1,
//       DataPoint: '@UI.DataPoint#OrderCount'
//     }],
//     Dimensions: [ customerName ],
//     DimensionAttributes: [{
//       $Type:     'UI.ChartDimensionAttributeType',
//       Dimension: customerName,
//       Role:      #Category
//     }]
//   }
// );

// // 6. Selection fields
// annotate OmsService.OrderSummary with @(
//   UI.SelectionFields: [ status, customerName, createdAt ]
// );

// // 7. Table (drill-down list)
// annotate OmsService.OrderSummary with @(
//   UI.LineItem: [
//     { $Type: 'UI.DataField', Value: customerName, Label: 'Customer'    },
//     { $Type: 'UI.DataField', Value: createdAt,    Label: 'Order Date'  },
//     { $Type: 'UI.DataField', Value: totalPrice,   Label: 'Revenue'     },
//     { $Type: 'UI.DataField', Value: orderCount,   Label: 'Order Count' },
//     { $Type: 'UI.DataField', Value: status, Label: 'Status' }
//   ],
//   UI.HeaderInfo: {
//     TypeName:       'Order Summary',
//     TypeNamePlural: 'Order Summaries',
//     Title: { $Type: 'UI.DataField', Value: customerName }
//   }
// );

// // 8. Presentation & SelectionPresentation variants.
// //    The SelectionPresentationVariant is the entry point Fiori uses on an
// //    Analytical List Page — both the chart and the table must appear here.
// annotate OmsService.OrderSummary with @(
//   UI.PresentationVariant: {
//     $Type:          'UI.PresentationVariantType',
//     Visualizations: [ '@UI.Chart#RevenueByStatus', '@UI.LineItem' ],
//     SortOrder: [{ $Type: 'Common.SortOrderType', Property: totalPrice, Descending: true }],
//     RequestAtLeast: [ totalPrice, orderCount, status ]
//   },

//   UI.SelectionPresentationVariant #Default: {
//     $Type: 'UI.SelectionPresentationVariantType',
//     Text:  'Default',
//     SelectionVariant: {
//       $Type:         'UI.SelectionVariantType',
//       SelectOptions: []
//     },
//     PresentationVariant: {
//       $Type:          'UI.PresentationVariantType',
//       Visualizations: [ '@UI.Chart#RevenueByStatus', '@UI.LineItem' ],
//       SortOrder: [{ $Type: 'Common.SortOrderType', Property: totalPrice, Descending: true }],
//       RequestAtLeast: [ totalPrice, orderCount, status ]
//     }
//   }
// );

//------------------------------------------------------------------------------------------------------
// annotate OmsService.OrderSummary with {
//   totalPrice @(
//     Analytics.Measure:    true,
//     Aggregation.default:  #SUM,
//     title:                'Revenue',
//     Measures.ISOCurrency: 'USD'
//   );
//   orderCount @(
//     Analytics.Measure:   true,
//     Aggregation.default: #SUM,
//     title:               'Order Count'
//   );
//   status @(
//     Analytics.Dimension: true,
//     title: 'Status'
//   );
//   customerName @(
//     Analytics.Dimension: true,
//     title: 'Customer'
//   );
//   createdAt @(
//     Analytics.Dimension: true,
//     title: 'Order Date'
//   );
// }

// // 2. Aggregation capability — REQUIRED for CAP to advertise $apply support.
// //    Without this Fiori treats the entity as a plain read-only list.
// annotate OmsService.OrderSummary with @(
//   Aggregation.ApplySupported: {
//     $Type:           'Aggregation.ApplySupportedType',
//     Transformations: [ 'aggregate', 'groupby', 'filter' ],
//     GroupableProperties: [ status, customerName, createdAt ],
//     AggregatableProperties: [
//       { $Type: 'Aggregation.AggregatablePropertyType', Property: totalPrice },
//       { $Type: 'Aggregation.AggregatablePropertyType', Property: orderCount }
//     ]
//   }
// );

// // 3. DataPoints — MUST be separate named annotations; UI.KPI references them
// //    by path string, NOT by inline object.
// annotate OmsService.OrderSummary with @(
//   UI.DataPoint #TotalRevenue: {
//     $Type: 'UI.DataPointType',
//     Value: totalPrice,
//     Title: 'Total Revenue'
//   },
//   UI.DataPoint #OrderCount: {
//     $Type: 'UI.DataPointType',
//     Value: orderCount,
//     Title: 'Total Orders'
//   }
// );

// // 4. KPI tiles — DataPoint must be a path reference, not an inline definition.
// annotate OmsService.OrderSummary with @(
//   UI.KPI #TotalRevenue: {
//     $Type:            'UI.KPIType',
//     DataPoint:        '@UI.DataPoint#TotalRevenue',
//     SelectionVariant: {
//       $Type:         'UI.SelectionVariantType',
//       SelectOptions: []
//     }
//   },
//   UI.KPI #OrderCount: {
//     $Type:            'UI.KPIType',
//     DataPoint:        '@UI.DataPoint#OrderCount',
//     SelectionVariant: {
//       $Type:         'UI.SelectionVariantType',
//       SelectOptions: []
//     }
//   }
// );

// // 5. Chart
// annotate OmsService.OrderSummary with @(
//   UI.Chart #RevenueByStatus: {
//     $Type:     'UI.ChartDefinitionType',
//     ChartType: #Column,
//     Title:     'Revenue by Status',
//     Measures:  [ totalPrice ],
//     MeasureAttributes: [{
//       $Type:     'UI.ChartMeasureAttributeType',
//       Measure:   totalPrice,
//       Role:      #Axis1,
//       DataPoint: '@UI.DataPoint#TotalRevenue'
//     }],
//     Dimensions: [ status ],
//     DimensionAttributes: [{
//       $Type:     'UI.ChartDimensionAttributeType',
//       Dimension: status,
//       Role:      #Category
//     }]
//   },

//   UI.Chart #OrdersByCustomer: {
//     $Type:     'UI.ChartDefinitionType',
//     ChartType: #Bar,
//     Title:     'Orders by Customer',
//     Measures:  [ orderCount ],
//     MeasureAttributes: [{
//       $Type:     'UI.ChartMeasureAttributeType',
//       Measure:   orderCount,
//       Role:      #Axis1,
//       DataPoint: '@UI.DataPoint#OrderCount'
//     }],
//     Dimensions: [ customerName ],
//     DimensionAttributes: [{
//       $Type:     'UI.ChartDimensionAttributeType',
//       Dimension: customerName,
//       Role:      #Category
//     }]
//   }
// );

// // 6. Selection fields
// annotate OmsService.OrderSummary with @(
//   UI.SelectionFields: [ status, customerName, createdAt ]
// );

// // 7. Table (drill-down list)
// annotate OmsService.OrderSummary with @(
//   UI.LineItem: [
//     { $Type: 'UI.DataField', Value: customerName, Label: 'Customer'    },
//     { $Type: 'UI.DataField', Value: createdAt,    Label: 'Order Date'  },
//     { $Type: 'UI.DataField', Value: totalPrice,   Label: 'Revenue'     },
//     { $Type: 'UI.DataField', Value: orderCount,   Label: 'Order Count' },
//     { $Type: 'UI.DataField', Value: status,       Label: 'Status', Criticality: statusCriticality }
//   ],
//   UI.HeaderInfo: {
//     TypeName:       'Order Summary',
//     TypeNamePlural: 'Order Summaries',
//     Title: { $Type: 'UI.DataField', Value: customerName }
//   }
// );

// // 8. Presentation & SelectionPresentation variants.
// //    The SelectionPresentationVariant is the entry point Fiori uses on an
// //    Analytical List Page — both the chart and the table must appear here.
// annotate OmsService.OrderSummary with @(
//   UI.PresentationVariant: {
//     $Type:          'UI.PresentationVariantType',
//     Visualizations: [ '@UI.Chart#RevenueByStatus', '@UI.LineItem' ],
//     SortOrder: [{ $Type: 'Common.SortOrderType', Property: totalPrice, Descending: true }],
//     RequestAtLeast: [ totalPrice, orderCount, status ]
//   },

//   UI.SelectionPresentationVariant #Default: {
//     $Type: 'UI.SelectionPresentationVariantType',
//     Text:  'Default',
//     SelectionVariant: {
//       $Type:         'UI.SelectionVariantType',
//       SelectOptions: []
//     },
//     PresentationVariant: {
//       $Type:          'UI.PresentationVariantType',
//       Visualizations: [ '@UI.Chart#RevenueByStatus', '@UI.LineItem' ],
//       SortOrder: [{ $Type: 'Common.SortOrderType', Property: totalPrice, Descending: true }],
//       RequestAtLeast: [ totalPrice, orderCount, status ]
//     }
//   }
// );
