import { DBDocument } from "./DBDocument"

export interface ChainUserCompanyCustomerCounter {

    userCustomerCounter?: number | null;
    companyCustomerCounter?: number | null;

}

export class ChainUserCompanyCustomerCounterDB extends DBDocument<ChainUserCompanyCustomerCounter> {
    _prefix = "USERCOMPANYCUSTOMERCOUNTER"
    docType = "user_company_customer_counter"

}