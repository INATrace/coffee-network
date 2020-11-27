import { ApiDocumentStorageKey } from "./apiDocumentStorageKey";

export interface ApiCertificationUpdate {
    certificate?: ApiDocumentStorageKey;
    /**
     * description of this standard and certification
     */
    description?: string;
    type?: string;
    validity?: string;
}