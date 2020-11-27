import { ChainLocation } from "./ChainLocaton";
import { ChainPayment } from "./ChainPayment";
import { ChainStockOrder } from "./ChainStockOrder";
import { DBDocument, DocType, TimeStamped } from "./DBDocument";


export interface ChainSemiProductDatePriceAtCompanyCustomer {
    /**
     * semi-product id
     */
    id: string,
    /**
     * from date
     */
    from: string,
    /**
     * to date
     */
    to: string,
    /**
     * price
     */
    price: string,
    /**
     * currency code according to ISO 4217 for price
     */
    currency: string
}

/**
 * Company (legal person) type customer
 */
export interface ChainCompanyCustomer extends DocType, TimeStamped {
    /**
     * Custemor id from af-coffee-ap database
     * RENAME IT FOR NOW (until Java api is fix)
     */
     cccid?: number;
    /**
     * Product Id as in af-coffee database
     */
    productId: number;
    /**
     * Company Id as in af-coffee database
     */
    companyId: number;
    /**
     * Type of company customer;
     */
    type: 'CUSTOMER' | 'OTHER';
    /**
     * Organization id. Set automatically from companyId;
     */
    organizationId?: string;
    /**
     * Product id in chain database. Set automatically from productId.
     */
    chainProductId?: string;
    /**
     * Contact
     */
    contact?: string;
    /**
     * Email
     */
    email?: string;
    /**
     * Location (address)
     */
    location?: ChainLocation;
    /**
     * Name
     */
    name?: string;
    /**
     * Official company name
     */
    officialCompanyName?: string;
    /**
     * Phone
     */
    phone?: string;
    /**
     * Vat id
     */
    vatId?: string;
    /**
     * Vat id
     */
    semiProductPrices?: ChainSemiProductDatePriceAtCompanyCustomer[];
}

export class ChainCompanyCustomerDB extends DBDocument<ChainCompanyCustomer> {
    _prefix = "COMPANYCUSTOMER"
    docType = "company_customer"
}