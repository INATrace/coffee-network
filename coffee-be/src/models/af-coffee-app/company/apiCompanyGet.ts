import { ApiUserBase } from "../apiUserBase";
import { ApiAddress } from "../apiAddress";
import { ApiDocument } from "../apiDocument";
import { ApiCertification } from "../apiCertification";
import { ApiCompanyDocument } from "./apiCompanyDocument";

export interface ApiCompanyGet {
    /**
     * company abbreviation
     */
    abbreviation?: string;
    /**
     * about the company
     */
    about?: string;
    /**
     * Possible actions
     */
    actions?: ApiCompanyGetActionsEnum[];
    /**
     * email
     */
    certifications?: ApiCertification[];
    documents?: ApiCompanyDocument[];
    email?: string;
    headquarters?: ApiAddress;
    /**
     * Entity id
     */
    id?: number;
    logo?: ApiDocument;
    /**
     * name of manager / CEO
     */
    manager?: string;
    /**
     * social media URL links (Facebook, Instagram, Twitter, YouTube, ...)
     */
    mediaLinks?: { [key: string]: string; };
    /**
     * company name
     */
    name?: string;
    /**
     * webpage
     */
    phone?: string;
    /**
     * Company users
     */
    users?: ApiUserBase[];
    /**
     * webpage
     */
    webPage?: string;
    /**
     * interview the company
     */
    interview?: string;
}

/**
 * All possible values of actions.
 */
export type ApiCompanyGetActionsEnum =
    'VIEW_COMPANY_PROFILE'
    | 'UPDATE_COMPANY_PROFILE'
    | 'ACTIVATE_COMPANY'
    | 'DEACTIVATE_COMPANY'
    | 'ADD_USER_TO_COMPANY'
    | 'REMOVE_USER_FROM_COMPANY'
    | 'MERGE_TO_COMPANY'




