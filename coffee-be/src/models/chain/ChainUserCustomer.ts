import { DBDocument, DocType, TimeStamped } from "./DBDocument";
import { ChainLocation } from "./ChainLocaton";
import { ApiCountry } from "../af-coffee-app/apiCountry";
import { ChainOrganization } from "./ChainOrganization";

export interface ChainUserCustomerRole {
    organizationId: string;
    role: string;
}

export interface ContactInfo {
    /**
     * Phone number
     */
    phone?: string;
    /**
     * Email
     */
    email?: string;
    /**
     * Whether a contact has a smart phone.
     */
    hasSmartPhone?: boolean;
}

export interface BankAccountInfo {
    /**
     * Bank account holder's name
     */
    accountHoldersName?: string;
    /**
     * Bank account number
     */
    accountNumber?: string;
    /**
     * Bank name
     */
    bankName?: string;
    /**
     * Bank's branch address
     */
    branchAddress?: string;
    /**
     * Country code.
     */
    country?: ApiCountry;
}
/**
 * Describes some data about a farm of a customer.
 */
export interface FarmInfo {
    /**
     * Whether a user customer owns a farm.
     */
    ownsFarm?: boolean;
    /**
     * Farm size
     */
    farmSize?: string;
    /**
     * Number of trees
     */
    numberOfTrees?: number;
    /**
     * True if it is an organic farm
     */
    organicFarm?: boolean;
    /**
     * Fertilizer used description.
     */
    fertilizerDescription?: string;
    /**
     * Any additional info.
     */
    additionalInfo?: string;
}

/**
 * User (physical person) type customer
 */
export interface ChainUserCustomer extends DocType, TimeStamped {
    /**
     * Customer id from af-coffee-ap database
     */
    id: number;
    /**
     * Product Id as in af-coffee database
     */
    productId: number;
    /**
     * Product id in chain database. If productId is given and organization with such id is in the database, then organizationId is ignored and set automatically.;
     */
    chainProductId?: string;
    /**
     * Company Id as in af-coffee database
     */
    companyId: number;
    /**
     * Organization id. If companyId is given and organization with such id is in the database, then organizationId is ignored and set automatically.;
     */
    organizationId?: string;
    // /**
    //  * List of customer roles;
    //  */
    // customerRoles?: string[];
    /**
     * Name of the customer.
     */
    name?: string;
    /**
     * Surname of the customer;
     */
    surname: string;
    /**
     * Gender of the customer
     */
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    /**
     * Location of the user as a customer. Typicaly a production location or location of a farm.
     */
    location?: ChainLocation;
    /**
     * Human readable customer identificator
     */
    customerId?: string;
    /**
     * Customer contact.
     */
    contact?: ContactInfo;
    /**
     * Some info about a farm.
     */
    farmInfo?: FarmInfo;
    /**
     * List of references to associations.
     */
    associationIds?: string[];
    /**
     * List of references to cooperatives (producers) and their roles
     */
    cooperativeIdsAndRoles?: ChainUserCustomerRole[];
    /**
     * Some info about bank account
     */
    bankAccountInfo?: BankAccountInfo;
    // /**
    //  * Purchase order (stock order) list of the user customer.
    //  */
    // purchases?: ChainStockOrder[];
    // /**
    //  * Payments for purchase orders.
    //  */
    // payments?: ChainPayment[];
    ///////////////////////////
    ///// CALCULATED
    //////////////////////////
    /**
     * Organization for organizationId
     */
    organization?: ChainOrganization;
    /**
     * UserCustomer id - FARXXXX
     */
    userCustomerId?: string;
}

export class ChainUserCustomerDB extends DBDocument<ChainUserCustomer> {
    _prefix = "USERCUSTOMER"
    docType = "user_customer"

    // public get fieldsToCleanOnSave(): string[] {
    //     return ['purchases', 'payments']
    // }

}