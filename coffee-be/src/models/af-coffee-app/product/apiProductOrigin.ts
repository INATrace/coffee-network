import { ApiLocation } from "./location/apiLocation";

export interface ApiProductOrigin {
    /**
     * origin - farmer location
     */
    locations?: ApiLocation[];
    /**
     * origin - text and quantity input - Briefly describe where the product or its ingredients are produced
     */
    text?: string;
}
