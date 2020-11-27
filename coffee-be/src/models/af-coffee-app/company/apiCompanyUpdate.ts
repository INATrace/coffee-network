import { ApiAddress } from "../apiAddress";
import { ApiDocument } from "../apiDocument";
import { ApiBaseEntity } from "../apiBaseEntity";
import { ApiCertificationUpdate } from "../apiCertificationUpdate";
import { ApiCompanyDocumentUpdate } from "./apiCompanyDocumentUpdate";

export interface ApiCompanyUpdate {
    /**
     * company abbreviation
     */
    abbreviation?: string;
    /**
     * about the company
     */
    about?: string;
    /**
     * email
     */
    certifications?: ApiCertificationUpdate[];
    documents?: ApiCompanyDocumentUpdate[];
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
     * Add users with these ids
     */
    users?: ApiBaseEntity[];
    /**
     * webpage
     */
    webPage?: string;
    /**
     * interview the company
     */
    interview?: string;
}
