import { ApiLocation } from "../location/apiLocation";
import { ApiDocument } from "../../apiDocument";

export interface ApiProductLabelBatch {
    /**
     * enable authenticity check
     */
    checkAuthenticity?: boolean;
    /**
     * Expiry date
     */
    expiryDate?: string;
    /**
     * Entity id
     */
    id?: number;
    /**
     * Label id
     */
    labelId?: number;
    /**
     * batch farming location
     */
    locations?: ApiLocation[];
    /**
     * Batch number
     */
    number?: string;
    photo?: ApiDocument;
    /**
     * Production date
     */
    productionDate?: string;
    /**
     * enable tracing origin
     */
    traceOrigin?: boolean;
}
