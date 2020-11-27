import { ApiDocument } from "../apiDocument";

export interface ApiCompanyDocument {
    category?: string;
    /**
     * description of this document
     */
    description?: string;
    document?: ApiDocument;
    link?: string;
    name?: string;
    quote?: string;
    type?: string;
}