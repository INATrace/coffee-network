
export const customViews = [
    {
        "_id": "_design/customs",
        "language": "javascript",
        "views": {
            "userCustomer_by_role": {
                "map": "function(doc) { \
                    if(doc.docType === 'user_customer') { \
                      doc.cooperativeIdsAndRoles.forEach(function(item) { \
                        emit([item.role, doc.name], null); \
                      }); \
                    }\
                }",
            },
            "userCustomer_by_organization": {
                "map": "function(doc) { \
                    if(doc.docType === 'user_customer' && doc.organizationId) { \
                      doc.cooperativeIdsAndRoles.forEach(function(item) { \
                        emit([item.organizationId, doc.name], null); \
                      }); \
                    }\
                }",
            },
            "userCustomer_by_organization_id_and_role_query_by_name": {
                "map": "function(doc) { \
                    if(doc.docType === 'user_customer' && doc.organizationId) { \
                      doc.cooperativeIdsAndRoles.forEach(function(item) { \
                        emit([item.organizationId, item.role, doc.name], null); \
                      }); \
                    }\
                }",
            },
            "userCustomer_by_organization_id_and_role_query_by_surname": {
                "map": "function(doc) { \
                    if(doc.docType === 'user_customer' && doc.organizationId) { \
                      doc.cooperativeIdsAndRoles.forEach(function(item) { \
                        emit([item.organizationId, item.role, doc.surname], null); \
                      }); \
                    }\
                }",
            },
            "userCustomer_by_organization_id_and_role_query_by_userCustomerId": {
                "map": "function(doc) { \
                    if(doc.docType === 'user_customer' && doc.organizationId) { \
                      doc.cooperativeIdsAndRoles.forEach(function(item) { \
                        emit([item.organizationId, item.role, doc.userCustomerId], null); \
                      }); \
                    }\
                }",
            },
            "userCustomer_by_organization_id_and_role_query_by_all": {
                "map": "function(doc) { \
                    if(doc.docType === 'user_customer' && doc.organizationId) { \
                      doc.cooperativeIdsAndRoles.forEach(function(item) { \
                        emit([item.organizationId, item.role, doc.userCustomerId], null); \
                        emit([item.organizationId, item.role, doc.name], null); \
                        emit([item.organizationId, item.role, doc.surname], null); \
                      }); \
                    }\
                }",
            },
            "collecting_facilities_by_organization": {
                "map": "function(doc) { \
                    if(doc.docType === 'facility' && doc.organizationId && doc.isCollectionFacility) { \
                      emit([doc.organizationId], doc); \
                    }\
                }",
            },
            "facilities_by_organization_and_semi_product": {
                "map": "function(doc) { \
                    if(doc.docType === 'facility' && doc.organizationId) { \
                      doc.semiProductIds.forEach(function(semiProductId) { \
                        emit([doc.organizationId, semiProductId], null); \
                      }); \
                    }\
                }",
            },
            "payment_by_paying_organization": {
                "map": "function(doc) { \
                    if(doc.docType === 'payment' && doc.payingOrganizationId) { \
                        emit([doc.payingOrganizationId, doc.productionDate], null); \
                    }\
                }",
            },
            "payment_by_paying_organization_by_payment_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'payment' && doc.payingOrganizationId) { \
                        emit([doc.payingOrganizationId, doc.formalCreationTime], null); \
                    }\
                }",
            },
            "payment_by_paying_organization_delivery_date_by_payment_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'payment' && doc.payingOrganizationId) { \
                        emit([doc.payingOrganizationId, doc.productionDate, doc.formalCreationTime], null); \
                    }\
                }",
            },
            "payment_by_paying_organization_by_payment_status_and_by_preffered_way_of_payment": {
                "map": "function(doc) { \
                    if(doc.docType === 'payment' && doc.payingOrganizationId && doc.paymentStatus && doc.preferredWayOfPayment) { \
                        emit([doc.payingOrganizationId, doc.paymentStatus, doc.preferredWayOfPayment, doc.productionDate], null); \
                    }\
                }",
            },
            "payment_by_paying_organization_by_payment_status_and_by_preffered_way_of_payment_by_payment_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'payment' && doc.payingOrganizationId && doc.paymentStatus && doc.preferredWayOfPayment) { \
                        emit([doc.payingOrganizationId, doc.paymentStatus, doc.preferredWayOfPayment, doc.formalCreationTime], null); \
                    }\
                }",
            },
            "payment_by_paying_organization_by_payment_status_and_by_preffered_way_of_payment_delivery_date_by_payment_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'payment' && doc.payingOrganizationId && doc.paymentStatus && doc.preferredWayOfPayment) { \
                        emit([doc.payingOrganizationId, doc.paymentStatus, doc.preferredWayOfPayment, doc.productionDate, doc.formalCreationTime], null); \
                    }\
                }",
            },
            "payment_by_paying_organization_by_preffered_way_of_payment": {
                "map": "function(doc) { \
                    if(doc.docType === 'payment' && doc.payingOrganizationId && doc.preferredWayOfPayment) { \
                        emit([doc.payingOrganizationId, doc.preferredWayOfPayment, doc.productionDate], null); \
                    }\
                }",
            },
            "payment_by_paying_organization_by_preffered_way_of_payment_by_payment_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'payment' && doc.payingOrganizationId && doc.preferredWayOfPayment) { \
                        emit([doc.payingOrganizationId, doc.preferredWayOfPayment, doc.formalCreationTime], null); \
                    }\
                }",
            },
            "payment_by_paying_organization_by_preffered_way_of_payment_delivery_date_by_payment_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'payment' && doc.payingOrganizationId && doc.preferredWayOfPayment) { \
                        emit([doc.payingOrganizationId, doc.preferredWayOfPayment, doc.productionDate, doc.formalCreationTime], null); \
                    }\
                }",
            },
            "payment_by_paying_organization_by_payment_status": {
                "map": "function(doc) { \
                    if(doc.docType === 'payment' && doc.payingOrganizationId && doc.paymentStatus) { \
                        emit([doc.payingOrganizationId, doc.paymentStatus, doc.productionDate], null); \
                    }\
                }",
            },
            "payment_by_paying_organization_by_payment_status_by_payment_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'payment' && doc.payingOrganizationId && doc.paymentStatus) { \
                        emit([doc.payingOrganizationId, doc.paymentStatus, doc.formalCreationTime], null); \
                    }\
                }",
            },
            "payment_by_paying_organization_by_payment_status_delivery_date_by_payment_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'payment' && doc.payingOrganizationId && doc.paymentStatus) { \
                        emit([doc.payingOrganizationId, doc.paymentStatus, doc.productionDate, doc.formalCreationTime], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder) { \
                        emit([doc.facilityId, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance_for_farmer": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder && doc.producerUserCustomerId) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance_for_farmer_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder && doc.producerUserCustomerId && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder && doc.preferredWayOfPayment) { \
                        emit([doc.facilityId, doc.preferredWayOfPayment, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder && doc.preferredWayOfPayment && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.preferredWayOfPayment, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.preferredWayOfPayment, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_womens_coffee": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder && doc.preferredWayOfPayment && doc.documentRequirements && doc.documentRequirements.targets) { \
                        emit([doc.facilityId, doc.preferredWayOfPayment, doc.documentRequirements.targets.womenShare, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_womens_coffee_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder && doc.preferredWayOfPayment && doc.documentRequirements && doc.documentRequirements.targets && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.preferredWayOfPayment, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.preferredWayOfPayment, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance_womens_coffee": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder && doc.documentRequirements && doc.documentRequirements.targets) { \
                        emit([doc.facilityId, doc.documentRequirements.targets.womenShare, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance_womens_coffee_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder && doc.documentRequirements && doc.documentRequirements.targets && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_for_farmer": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder && doc.preferredWayOfPayment && doc.producerUserCustomerId) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.preferredWayOfPayment, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_for_farmer_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder && doc.preferredWayOfPayment && doc.producerUserCustomerId && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.preferredWayOfPayment, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.preferredWayOfPayment, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_for_farmer_womens_coffee": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder && doc.preferredWayOfPayment && doc.producerUserCustomerId && doc.documentRequirements && doc.documentRequirements.targets) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.preferredWayOfPayment, doc.documentRequirements.targets.womenShare, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_for_farmer_womens_coffee_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder && doc.preferredWayOfPayment && doc.producerUserCustomerId && doc.documentRequirements && doc.documentRequirements.targets && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.preferredWayOfPayment, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.preferredWayOfPayment, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance_for_farmer_womens_coffee": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder && doc.producerUserCustomerId && doc.documentRequirements && doc.documentRequirements.targets) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.documentRequirements.targets.womenShare, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_with_open_balance_for_farmer_womens_coffee_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.balance && doc.balance > 0 && doc.isPurchaseOrder && doc.producerUserCustomerId && doc.documentRequirements && doc.documentRequirements.targets && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder) { \
                        emit([doc.facilityId, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_for_farmer": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder && doc.producerUserCustomerId) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_for_farmer_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder && doc.producerUserCustomerId && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_by_preferred_way_of_payment": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder && doc.preferredWayOfPayment) { \
                        emit([doc.facilityId, doc.preferredWayOfPayment, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_by_preferred_way_of_payment_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder && doc.preferredWayOfPayment && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.preferredWayOfPayment, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.preferredWayOfPayment, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_by_preferred_way_of_payment_womens_coffee": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder && doc.preferredWayOfPayment && doc.documentRequirements && doc.documentRequirements.targets) { \
                        emit([doc.facilityId, doc.preferredWayOfPayment, doc.documentRequirements.targets.womenShare, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_by_preferred_way_of_payment_womens_coffee_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder && doc.preferredWayOfPayment && doc.documentRequirements && doc.documentRequirements.targets && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.preferredWayOfPayment, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.preferredWayOfPayment, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_womens_coffee": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder && doc.documentRequirements && doc.documentRequirements.targets) { \
                        emit([doc.facilityId, doc.documentRequirements.targets.womenShare, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_womens_coffee_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder && doc.documentRequirements && doc.documentRequirements.targets && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_by_preferred_way_of_payment_for_farmer": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder && doc.preferredWayOfPayment && doc.producerUserCustomerId) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.preferredWayOfPayment, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_by_preferred_way_of_payment_for_farmer_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder && doc.preferredWayOfPayment && doc.producerUserCustomerId && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.preferredWayOfPayment, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.preferredWayOfPayment, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_by_preferred_way_of_payment_for_farmer_womens_coffee": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder && doc.preferredWayOfPayment && doc.producerUserCustomerId && doc.documentRequirements && doc.documentRequirements.targets) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.preferredWayOfPayment, doc.documentRequirements.targets.womenShare, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_by_preferred_way_of_payment_for_farmer_womens_coffee_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder && doc.preferredWayOfPayment && doc.producerUserCustomerId && doc.documentRequirements && doc.documentRequirements.targets && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.preferredWayOfPayment, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.preferredWayOfPayment, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_for_farmer_womens_coffee": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder && doc.producerUserCustomerId && doc.documentRequirements && doc.documentRequirements.targets) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.documentRequirements.targets.womenShare, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_facility_for_farmer_womens_coffee_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isPurchaseOrder && doc.producerUserCustomerId && doc.documentRequirements && doc.documentRequirements.targets && doc.producerUserCustomer) { \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.name, doc.productionDate], null); \
                        emit([doc.facilityId, doc.producerUserCustomerId, doc.documentRequirements.targets.womenShare, doc.producerUserCustomer.surname, doc.productionDate], null); \
                    }\
                }",
            },
            "stock_order_by_facility": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId) { \
                        emit([doc.facilityId, doc.productionDate], null); \
                    }\
                }",
            },
            "stock_order_by_facility_available_with_production_date": {
                "map": "function(doc) { \
                            if(doc.docType === 'stock_order' && doc.facilityId && doc.isAvailable == '1') { \
                                emit([doc.facilityId, doc.productionDate], null); \
                            }\
                        }",
            },
            "stock_order_by_facility_with_production_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId) { \
                        emit([doc.facilityId, doc.productionDate], null); \
                    }\
                }",
            },
            "stock_order_by_facility_available_with_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isAvailable == '1') { \
                        emit([doc.facilityId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_by_facility_by_semi_product_available_with_production_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isAvailable == '1') { \
                        emit([doc.facilityId, doc.semiProductId, doc.productionDate], null); \
                    }\
                }",
            },
            "stock_order_by_facility_by_semi_product_available_with_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isAvailable == '1') { \
                        emit([doc.facilityId, doc.semiProductId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_by_facility_available_with_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isAvailable == '1') { \
                        emit([doc.facilityId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_by_facility_by_semi_product_available_with_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.isAvailable == '1') { \
                        emit([doc.facilityId, doc.semiProductId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_by_facility_by_semi_product_with_production_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId) { \
                        emit([doc.facilityId, doc.semiProductId, doc.productionDate], null); \
                    }\
                }",
            },
            "stock_order_by_facility_with_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId) { \
                        emit([doc.facilityId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_by_facility_by_semi_product_with_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId) { \
                        emit([doc.facilityId, doc.semiProductId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_by_facility_with_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId) { \
                        emit([doc.facilityId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_by_facility_by_semi_product_with_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId) { \
                        emit([doc.facilityId, doc.semiProductId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "processing_order_by_facility_with_query": {
                "map": "function(doc) { \
                    if(doc.docType === 'processing_order' && doc.facilityId) { \
                        emit([doc.facilityId, doc.identifier], null); \
                    }\
                }",
            },
            "purchase_order": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.isPurchaseOrder) { \
                        emit(null); \
                    }\
                }",
            },
            "purchase_order_with_open_balance": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.isPurchaseOrder && doc.balance && doc.balance > 0) { \
                        emit(null); \
                    }\
                }",
            },
            "semi_product_by_product": {
                "map": "function(doc) { \
                    if(doc.docType === 'semi_product' && doc.productId) { \
                        emit([doc.productId, doc.name], null); \
                    }\
                }",
            },
            "semi_product_by_product_is_sku": {
                "map": "function(doc) { \
                    if(doc.docType === 'semi_product' && doc.productId && doc.isSKU) { \
                        emit([doc.productId, doc.name], null); \
                    }\
                }",
            },
            "semi_product_by_product_is_sku_end_customer": {
                "map": "function(doc) { \
                    if(doc.docType === 'semi_product' && doc.productId && doc.isSKUEndCustomer) { \
                        emit([doc.productId, doc.name], null); \
                    }\
                }",
            },
            "semi_product_by_product_is_buyable": {
                "map": "function(doc) { \
                    if(doc.docType === 'semi_product' && doc.productId && doc.isBuyable) { \
                        emit([doc.productId, doc.name], null); \
                    }\
                }",
            },
            "semi_product_by_product_is_sku_and_is_buyable_and_is_sku_end_customer": {
                "map": "function(doc) { \
                    if(doc.docType === 'semi_product' && doc.productId && doc.isSKU && doc.isBuyable && doc.isSKUEndCustomer) { \
                        emit([doc.productId, doc.name], null); \
                    }\
                }",
            },
            "semi_product_by_product_is_sku_and_is_buyable": {
                "map": "function(doc) { \
                    if(doc.docType === 'semi_product' && doc.productId && doc.isSKU && doc.isBuyable) { \
                        emit([doc.productId, doc.name], null); \
                    }\
                }",
            },
            "semi_product_by_product_is_sku_and_is_sku_end_customer": {
                "map": "function(doc) { \
                    if(doc.docType === 'semi_product' && doc.productId && doc.isSKU && doc.isSKUEndCustomer) { \
                        emit([doc.productId, doc.name], null); \
                    }\
                }",
            },
            "semi_product_by_product_is_sku_end_customer_and_is_buyable": {
                "map": "function(doc) { \
                    if(doc.docType === 'semi_product' && doc.productId && doc.isSKUEndCustomer && doc.isBuyable) { \
                        emit([doc.productId, doc.name], null); \
                    }\
                }",
            },
            "available_stock_for_semi_product_in_facility": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.productionDate && doc.isAvailable == '1' && doc.semiProductId) { \
                        emit([doc.facilityId, doc.isAvailable, doc.semiProductId, doc.productionDate], null); \
                    }\
                }",
            },
            "available_stock_for_semi_product_in_facility_womens_share": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.productionDate && doc.isAvailable == '1' && doc.semiProductId && doc.documentRequirements && doc.documentRequirements.targets) { \
                        emit([doc.facilityId, doc.isAvailable, doc.semiProductId, doc.documentRequirements.targets.womenShare, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_farmer_order_by_production_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.isPurchaseOrder && doc.producerUserCustomerId) { \
                        emit([doc.producerUserCustomerId, doc.productionDate], null); \
                    }\
                }",
            },
            "purchase_order_by_farmer_with_open_balance_order_by_production_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.isPurchaseOrder && doc.producerUserCustomerId && doc.balance && doc.balance > 0) { \
                        emit([doc.producerUserCustomerId, doc.productionDate], null); \
                    }\
                }",
            },
            "payment_by_farmer_order_by_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'payment' && doc.recipientUserCustomerId) { \
                        emit([doc.recipientUserCustomerId, doc.formalCreationTime], null); \
                    }\
                }",
            },
            "transaction_source_facility_target_facility_semiproduct_date_exp": {
                "map": "function(doc) { \
                    if(doc.docType === 'transaction') { \
                        emit([doc.sourceFacilityId, doc.targetFacilityId, doc.semiProductId, doc.lastChange], null); \
                    }\
                }",
            },
            "transaction_target_facility_semiproduct_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'transaction') { \
                        emit([doc.targetFacilityId, doc.semiProductId, doc.lastChange], null); \
                    }\
                }",
            },
            "transaction_source_facility_semiproduct_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'transaction') { \
                        emit([doc.sourceFacilityId, doc.semiProductId, doc.lastChange], null); \
                    }\
                }",
            },
            "transaction_semiproduct_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'transaction') { \
                        emit([doc.semiProductId, doc.lastChange], null); \
                    }\
                }",
            },
            "transaction_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'transaction') { \
                        emit([doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_by_quote_facility_by_open_quote_with_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteFacilityId && doc.isOpenOrder) { \
                        emit([doc.quoteFacilityId, doc.isOpenOrder, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_by_quote_facility_by_open_quote_by_semi_product_with_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteFacilityId && doc.semiProductId && doc.isOpenOrder) { \
                        emit([doc.quoteFacilityId, doc.isOpenOrder, doc.semiProductId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_by_quote_facility_with_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteFacilityId) { \
                        emit([doc.quoteFacilityId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_by_quote_facility_by_semi_product_with_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteFacilityId && doc.semiProductId) { \
                        emit([doc.quoteFacilityId, doc.semiProductId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_by_quote_facility_by_open_quote_with_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteFacilityId && doc.isOpenOrder) { \
                        emit([doc.quoteFacilityId, doc.isOpenOrder, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_by_quote_facility_by_open_quote_by_semi_product_with_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteFacilityId && doc.semiProductId && doc.isOpenOrder) { \
                        emit([doc.quoteFacilityId, doc.isOpenOrder, doc.semiProductId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_by_quote_facility_with_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteFacilityId) { \
                        emit([doc.quoteFacilityId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_by_quote_facility_by_semi_product_with_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteFacilityId && doc.semiProductId) { \
                        emit([doc.quoteFacilityId, doc.semiProductId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_by_quote_organization_by_open_quote_with_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteOrganizationId && doc.isOpenOrder) { \
                        emit([doc.quoteOrganizationId, doc.isOpenOrder, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_by_quote_organization_by_open_quote_by_semi_product_with_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteOrganizationId && doc.semiProductId && doc.isOpenOrder) { \
                        emit([doc.quoteOrganizationId, doc.isOpenOrder, doc.semiProductId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_by_quote_organization_with_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteOrganizationId) { \
                        emit([doc.quoteOrganizationId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_by_quote_organization_by_semi_product_with_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteOrganizationId && doc.semiProductId) { \
                        emit([doc.quoteOrganizationId, doc.semiProductId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_by_quote_organization_by_open_quote_with_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteOrganizationId && doc.isOpenOrder) { \
                        emit([doc.quoteOrganizationId, doc.isOpenOrder, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_by_quote_organization_by_open_quote_by_semi_product_with_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteOrganizationId && doc.semiProductId && doc.isOpenOrder) { \
                        emit([doc.quoteOrganizationId, doc.isOpenOrder, doc.semiProductId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_by_quote_organization_with_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteOrganizationId) { \
                        emit([doc.quoteOrganizationId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_by_quote_organization_by_semi_product_with_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteOrganizationId && doc.semiProductId) { \
                        emit([doc.quoteOrganizationId, doc.semiProductId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_by_quote_organization_by_open_quote_with_production_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteOrganizationId && doc.isOpenOrder) { \
                        emit([doc.quoteOrganizationId, doc.isOpenOrder, doc.productionDate], null); \
                    }\
                }",
            },
            "stock_order_by_quote_organization_by_open_quote_by_semi_product_with_production_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteOrganizationId && doc.semiProductId && doc.isOpenOrder) { \
                        emit([doc.quoteOrganizationId, doc.isOpenOrder, doc.semiProductId, doc.productionDate], null); \
                    }\
                }",
            },
            "stock_order_by_quote_organization_with_production_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteOrganizationId) { \
                        emit([doc.quoteOrganizationId, doc.productionDate], null); \
                    }\
                }",
            },
            "stock_order_by_quote_organization_by_semi_product_with_production_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteOrganizationId && doc.semiProductId) { \
                        emit([doc.quoteOrganizationId, doc.semiProductId, doc.productionDate], null); \
                    }\
                }",
            },
            "stock_order_by_quote_facility_by_open_quote_with_production_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteFacilityId && doc.isOpenOrder) { \
                        emit([doc.quoteFacilityId, doc.isOpenOrder, doc.productionDate], null); \
                    }\
                }",
            },
            "stock_order_by_quote_facility_by_open_quote_by_semi_product_with_production_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteFacilityId && doc.semiProductId && doc.isOpenOrder) { \
                        emit([doc.quoteFacilityId, doc.isOpenOrder, doc.semiProductId, doc.productionDate], null); \
                    }\
                }",
            },
            "stock_order_by_quote_facility_with_production_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteFacilityId) { \
                        emit([doc.quoteFacilityId, doc.productionDate], null); \
                    }\
                }",
            },
            "stock_order_by_quote_facility_by_semi_product_with_production_date": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.quoteFacilityId && doc.semiProductId) { \
                        emit([doc.quoteFacilityId, doc.semiProductId, doc.productionDate], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_facility_by_company_customer_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.consumerCompanyCustomerId) { \
                        emit([doc.facilityId, doc.consumerCompanyCustomerId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_facility_by_company_customer_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.consumerCompanyCustomerId) { \
                        emit([doc.facilityId, doc.consumerCompanyCustomerId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_facility_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId) { \
                        emit([doc.facilityId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_facility_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId) { \
                        emit([doc.facilityId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_facility_by_company_customer_open_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.consumerCompanyCustomerId && doc.totalQuantity > doc.fullfilledQuantity) { \
                        emit([doc.facilityId, doc.consumerCompanyCustomerId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_facility_by_company_customer_open_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.consumerCompanyCustomerId && doc.totalQuantity > doc.fullfilledQuantity) { \
                        emit([doc.facilityId, doc.consumerCompanyCustomerId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_facility_open_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.totalQuantity > doc.fullfilledQuantity) { \
                        emit([doc.facilityId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_facility_open_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.facilityId && doc.totalQuantity > doc.fullfilledQuantity) { \
                        emit([doc.facilityId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_organization_by_company_customer_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.organizationId && doc.consumerCompanyCustomerId) { \
                        emit([doc.organizationId, doc.consumerCompanyCustomerId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_organization_by_company_customer_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.organizationId && doc.consumerCompanyCustomerId) { \
                        emit([doc.organizationId, doc.consumerCompanyCustomerId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_organization_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.organizationId) { \
                        emit([doc.organizationId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_organization_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.organizationId) { \
                        emit([doc.organizationId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_organization_by_company_customer_open_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.organizationId && doc.consumerCompanyCustomerId && doc.totalQuantity > doc.fullfilledQuantity) { \
                        emit([doc.organizationId, doc.consumerCompanyCustomerId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_organization_by_company_customer_open_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.organizationId && doc.consumerCompanyCustomerId && doc.totalQuantity > doc.fullfilledQuantity) { \
                        emit([doc.organizationId, doc.consumerCompanyCustomerId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_organization_open_last_change": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.organizationId && doc.totalQuantity > doc.fullfilledQuantity) { \
                        emit([doc.organizationId, doc.lastChange], null); \
                    }\
                }",
            },
            "stock_order_for_customer_by_organization_open_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'stock_order' && doc.organizationId && doc.totalQuantity > doc.fullfilledQuantity) { \
                        emit([doc.organizationId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "product_order_for_facility_open_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'order' && doc.facilityId && doc.open) { \
                        emit([doc.facilityId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "product_order_for_facility_delivery_time": {
                "map": "function(doc) { \
                    if(doc.docType === 'order' && doc.facilityId) { \
                        emit([doc.facilityId, doc.deliveryTime], null); \
                    }\
                }",
            },
            "triggered_orders": {
                "map": "function(doc) {\
                    if (doc.docType === 'stock_order' && doc.triggerOrderIds) {\
                        for (var i in doc.triggerOrderIds) {\
                            emit([doc.triggerOrderIds[i], doc._id], {_id: doc._id});\
                        }\
                    }\
                }",
            },

        }

    }
]
