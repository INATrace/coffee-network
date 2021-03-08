import { ChainFacility } from "./ChainFacility";
import { ChainLocation } from "./ChainLocaton";
import { ChainMeasureUnitType } from "./ChainMeasureUnitType";
import { ChainSemiProduct } from "./ChainSemiProduct";
import { DBDocument, DocType, ForeignKeyScheme, TimeStamped } from "./DBDocument";
import { ChainDocumentRequirementList } from "./ChainDocumentRequirementList";
import { ChainUserCustomer } from "./ChainUserCustomer";
import { ChainTransaction } from "./ChainTransaction";
import { ChainProcessingAction } from "./ChainProcessingAction";
import { ChainCertification } from "./ChainCertification";
import { ChainGradeAbbreviation } from "./ChainGradeAbbreviation";
import { ChainActionType } from "./ChainActionType";
import { ChainProcessingOrder } from "./ChainProcessingOrder";
import { ChainOrganization } from "./ChainOrganization";
import { ChainCompanyCustomer } from "./ChainCompanyCustomer";
import { ChainProductOrder } from "./ChainProductOrder";


export interface ChainPrice {
    amount: number;
    currency: string;
}

export interface ChainExchangeRate {
    baseCurrency: string;
    quoteCurrency: string;
    rate: number;
}
/**
 * Represents a product instance (package, bag, container, drying bed, etc.) of a product defined by ChainProduct.
 * Product unit is located on one facility only. It is measured by some quantity units (unitType) and
 * by the number totalQuantity. Ti has official production date (productionDate) and expiry date (expiryDate)
 * A product unit may be represented by a label in FE.
 *
 * Product unit can be created from nothing (e.g. picking the coffee).
 * In general product unit is created by some transactions (ChainTransaction). Product unit does not
 * change its facility. Instead a product unit is transformed by a list of transactions (Chain)
 * to different product unit either in the same facility or in some other facility.
 */
export interface ChainStockOrder extends DocType, TimeStamped {
    /**
     * Official creation date/time
     */
    formalCreationTime?: string | null;
    /**
     * Human readable identifier
     */
    identifier?: string | null;
    /**
     * Id of the user creator
     */
    creatorId?: string | null;
    /**
     * Representative of producer user customer. E.g. collector. Relevant only for order type: PURCHASE_ORDER
     */
    representativeOfProducerUserCustomerId?: string | null;
    /**
     * Id of the person who has produced the entry. Relevant only for order type: PURCHASE_ORDER
     */
    producerUserCustomerId?: string | null;
    /**
     * Location of the production. Relevant only for order type: PURCHASE_ORDER
     */
    productionLocation?: ChainLocation;
    certificates?: ChainCertification[] | null;
    /**
     * Consumer company customer. Relevant for order type: SALES_ORDER
     */
    consumerCompanyCustomerId?: string | null;
    /**
     * Reference to the semi product
     */
    semiProductId: string;
    /**
     * Facility Id where product unit is located
     */
    facilityId: string;
    /**
     * Calculated from facility during insert.
     */
    organizationId?: string;
    /**
     * Quantity unit tipe. Calculated automatically from semiProduct at insertion.
     */
    measurementUnitType?: ChainMeasureUnitType | null;
    /**
     * Total ordered quantity
     */
    totalQuantity: number;
    /**
     * Fulfilled quantity (<= totalQuantity)
     */
    fullfilledQuantity: number;
    /**
     * Available quantity ( <= fulfilledQuantity)
     */
    availableQuantity: number;
    /**
     * '1' if availableQuantity > 0. Set automatically.
     */
    isAvailable?: '0' | '1' | null;
    /**
     * Production date
     */
    productionDate: string;
    /**
     * Expiry date
     */
    expiryDate?: string | null;
    /**
     * Estimated delivery date
     */
    estimatedDeliveryDate?: string | null;
    /**
     * Preferred delivery date.
     */
    deliveryTime?: string | null;
    /**
     * Order which triggered creation of the product unit
     */
    orderId?: string | null;
    /**
     * Global order id. Global order is initial order that triggers other orders in value chain.
     */
    globalOrderId?: string | null;
    /**
     * List of document requrements.
     */
    documentRequirements?: ChainDocumentRequirementList;
    /**
     * Price per unit (purchase price). Relevant for type PURCHASE_ORDER. Irrelevant for PROCESSING_ORDER.
     * Should be calculated from input transactions for SALES_ORDER and GENERAL_ORDER
     */
    pricePerUnit?: number | null;
    /**
     * Sales price per unit.
     */
    salesPricePerUnit?: number | null;
    /**
     * Purchase currency. Currency code according to ISO 4217 for pricePerUnit.
     * Relevant for all orders. In case of order type SALES_ORDER it denotes the price
     * of sale to the final customer.
     */
    currency?: string | null;
    /**
     * Sales currency. Currency code according to ISO 4217 for pricePerUnit
     */
    salesCurrency?: string | null;
    /**
     * Is it a purchase order? Depricated, should use orderType: PURCHASE_ORDER
     */
    isPurchaseOrder?: boolean | null;
    /**
     * Order type.
     * - PURCHASE_ORDER - created during purchase of coffee from farmers. No input transactions, allows output transactions.
     * - PROCESSING_ORDER - created as a result of a processing transaction. No input transactions, allows output transactions.
     * - SALES_ORDER - created on behalf of final customer. Filled by input transactions. No output transactions allowed.
     * - GENERAL - general (transport) order in the middle of the value chain. Allows input and output transactions.
     * - TRANSFER ORDER - generated through transfer processing actions
     */
    orderType?: 'PURCHASE_ORDER' | 'PROCESSING_ORDER' | 'SALES_ORDER' | 'GENERAL_ORDER' | 'TRANSFER_ORDER'
    /**
     * Grade abbreviaton id
     */
    gradeAbbreviationId?: string;
    /**
     * Internal lot number
     */
    internalLotNumber?: string | null;
    /**
     * External lot number
     */
    lotNumber?: string | null;
    /**
     * Screen size
     */
    screenSize?: string | null;
    /**
     * Comments
     */
    comments?: string | null;
    /**
     * ActionType
     */
    actionType?: ChainActionType;
    /**
     * Share between 0 and 1 (100%)
     */
    womenShare?: number;
    /////////////////////////
    ////// CALCULATED ///////
    /////////////////////////
    /**
     * Cost (to be paid, calculated automatically)
     */
    cost?: number | null;
    /**
     * Amount paid (calculated automatically)
     */
    paid?: number | null;
    /**
     * Balance to be paid (calculated automatically)
     */
    balance?: number | null;
    /**
     * Semi-product object. Set automatically on read. Ignored on write (not stored, obtained through semiProductId)
     */
    semiProduct?: ChainSemiProduct;
    /**
     * Facility object. Set automatically on read. Ignored on write (not stored, obtained through facilityId)
     */
    facility?: ChainFacility;
    /**
     * Representative of producer user customer. Not saved. Used for setting id.
     */
    representativeOfProducerUserCustomer?: ChainUserCustomer;
    /**
     * User customer. Not saved. Used for setting id.
     */
    producerUserCustomer?: ChainUserCustomer
    /**
     * Input transactions for stock order. Read only.
     */
    inputTransactions?: ChainTransaction[]
    /**
     * Output transactions for stock order. Read only.
     */
    outputTransactions?: ChainTransaction[]
    /**
     * Lot label
     */
    lotLabel?: string | null;
    /**
     * Start of drying
     */
    startOfDrying?: string | null;
    /**
     * Client's name (ID) TODO: add foreign key, when ApiProductCompany is defined
     */
    clientId?: number | null;
    /**
     * Flavour profile
     */
    flavourProfile?: string | null;
    /**
     * Processing action id. The order cannot be deleted directly through API, if this is not null.
     */
    processingActionId?: string;
    /**
     * Processing action. Read only.
     */
    processingAction?: ChainProcessingAction,
    /**
     * Grade abbreviaton readOnly
     */
    gradeAbbreviation?: ChainGradeAbbreviation;
    /**
     * Reference to processing order
     */
    processingOrderId?: string;
    /**
     * Processing order. Read only.
     */
    processingOrder?: ChainProcessingOrder;

    preferredWayOfPayment?: 'CASH_VIA_COOPERATIVE' | 'CASH_VIA_COLLECTOR' | 'BANK_TRANSFER' | 'UNKNOWN';
    /**
     * Consumer company customer. Relevant for order type: SALES_ORDER
     */
    consumerCompanyCustomer?: ChainCompanyCustomer,
    client?: ChainOrganization;
    /**
     * Sac number. Relevant when outputs repacked
     */
    sacNumber?: number | null;
    /**
     * Id of the quote order that triggered the this order
     */
    triggerOrderIds?: string[];
    /**
     * Calculated property, depending on whether total quantity differs from fullfiled quantity.
     */
    isOpenOrder?: '0' | '1' | null;
    /**
     * Quote facility - the facility to which a quote is made
     */
    quoteFacilityId?: string;
    /**
     * Quote organization id. Set automatically from quoteFacilityId while saving.
     */
    quoteOrganizationId?: string;
    /**
     * Input orders
     */
    inputOrders?: ChainStockOrder[];
    //// Additional fields for "right" side

    pricePerUnitForOwner?: number | null; // ChainPrice;
    pricePerUnitForBuyer?: number | null; // ChainPrice;
    exchangeRateAtBuyer?: number | null; // ChainExchangeRate;
    pricePerUnitForEndCustomer?: number | null; // ChainPrice
    exchangeRateAtEndCustomer?: number | null; // ChainExchangeRate;
    cuppingResult?: string | null;
    cuppingGrade?: string | null;
    cuppingFlavour?: string | null;
    roastingDate?: string | null;
    roastingProfile?: string | null;
    shipperDetails?: string | null;
    carrierDetails?: string | null;
    portOfLoading?: string | null;
    portOfDischarge?: string | null;
    locationOfEndDelivery?: string | null;
    dateOfEndDelivery?: string | null;
    requiredWomensCoffee?: boolean;
    requiredQuality?: ChainGradeAbbreviation;
    requiredQualityId?: string;
    shippedAtDateFromOriginPort?: string | null;
    arrivedAtDateToDestinationPort?: string | null;


    /**
     * Product order matching orderId. Read only.
     */
    productOrder?: ChainProductOrder;
    /**
     * Product order matching triggerOrderId. Read only.
     */
    triggerOrders?: ChainStockOrder[];
    /**
     * List of orders that have been trigerred by this order. Read only
     */
    triggeredOrders?: ChainStockOrder[];
    quoteFacility?: ChainFacility;
    quoteOrganization?: ChainOrganization;

    /**
     * Read only organization.
     */
    organization?: ChainOrganization;
}



export class ChainStockOrderDB extends DBDocument<ChainStockOrder> {
    _prefix = "SO"
    docType = "stock_order"

    public get foreignKeySchemes(): ForeignKeyScheme[] {
        return [
            {
                field: "semiProductId",
                docType: "semi_product",
                required: true
            },
            {
                field: "facilityId",
                docType: "facility",
                required: true
            },
            {
                field: "orderId",
                docType: "order",
                required: false
            },
            {
                field: "consumerCompanyCustomerId",
                docType: "company_customer",
                required: false
            },

        ]
    }

    public get fieldsToCleanOnSave(): string[] {
        return ['product', 'semiProduct', 'facility', 'paid',
        'representativeOfProducerUserCustomer', 'inputTransactions', 'outputTransactions',
        'processingOrder', 'gradeAbbreviation', 'processingAction', 'inputOrders', 'client',
        'consumerCompanyCustomer', 'requiredQuality', 'triggerOrders']
    }

}

export interface ChainStockOrderSummary {
    totalInputQuantity: number;
    totalOutputQuantity: number;
    stockOrder: ChainStockOrder;
}

export interface WeightedAggregate<T> {
    fieldID: string;
    value: T;
    quantity: number;
    measurementUnit: ChainMeasureUnitType,
    stockOrderId?: string;
    identifier?: string;
    isDocument?: boolean;
    processingAction?: ChainProcessingAction,
    required?: boolean;
    mandatory?: boolean;
    requiredOnQuote?: boolean;
    requiredOnQuoteOneOk?: boolean;
    requiredOneOfGroupIdForQuote?: string;
}

export interface QuoteRequirementConfirmation {
    fieldId?: string;
    fieldIds?: string[];
    fairness?: boolean;
    provenance?: boolean;
    quality?: boolean;
    targetValue?: any;
    aggregates: WeightedAggregate<any>[]
}

export interface QuoteRequirementConfirmationsWithMetaData {
    requirements: QuoteRequirementConfirmation[];
    producers: ChainOrganization[]
}

export interface StockOrderAggregates {
    stockOrder: ChainStockOrder;
    fieldAggregates?: KeyAggregates[]
    documentAggregates?: KeyAggregates[]
}

export interface KeyAggregates {
    key: string;
    required?: boolean;
    depth: number;
    created: string;
    lastChange: string;
    // processingAction: ChainProcessingAction;
    processingOrder: ChainProcessingOrder;
    aggregates: WeightedAggregate<any>[]
}

export interface StockOrderAgg {
    stockOrder: ChainStockOrder;
    fields: WeightedAggregate<any>[]
    documents: WeightedAggregate<any>[]
}

export interface ProcessingOrderHistory {
    depth: number;
    processingOrder: ChainProcessingOrder;
    stockOrderAggs: StockOrderAgg[];
    stockOrderIds?: any
}

export interface B2CHistoryItem {
    type?: string;
    name: string;
    location?: string;
    date?: string;
    iconEnumType?: string;
    iconClass?: string;
}

export interface B2CHistoryTimeline {
    items: B2CHistoryItem[];
    shortItems: B2CHistoryItem[];
    coopName?: string
}

// export interface StockOrderAggregate {
//     certificates?:
//     ChainCertification[] | null;
//     documentRequirements?: ChainDocumentRequirementList;
//     /**
//      * Grade abbreviaton id
//      */
//     gradeAbbreviation?: string;
//     /**
//      * External lot number
//      */
//     lotNumber?: string | null;
//     /**
//      * Screen size
//      */
//     screenSize?: string | null;
//     /**
//      * Comments
//      */
//     comments?: string | null;
//     /**
//      * ActionType
//      */
//     cost?: number | null;
//     /**
//      * Amount paid (calculated automatically)
//      */
//     paid?: number | null;
//     /**
//      * Balance to be paid (calculated automatically)
//      */
//     balance?: number | null;
//     /**
//      * Lot label
//      */
//     lotLabel?: string | null;
//     /**
//      * Start of drying
//      */
//     startOfDrying?: string | null;
//     /**
//      * Client's name (ID) TODO: add foreign key, when ApiProductCompany is defined
//      */
//     clientId?: string | null;
//     /**
//      * Flavour profile
//      */
//     flavourProfile?: string | null;

// }

