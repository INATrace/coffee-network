import { ApiAddress } from "../apiAddress";
import { ApiCertification } from "../apiCertification";
import { ApiDocument } from "../apiDocument";
import { ApiCompanyDocument } from "./apiCompanyDocument";

export interface ApiCompany {
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
     * webpage
     */
    webPage?: string;
    /**
     * interview the company
     */
    interview?: string;
}

