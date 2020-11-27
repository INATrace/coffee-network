import { ApiDocument } from "./apiDocument";

export interface ApiCertification {
    certificate?: ApiDocument;
    /**
     * description of this standard and certification
     */
    description?: string;
    type?: string;
    validity?: string;
}