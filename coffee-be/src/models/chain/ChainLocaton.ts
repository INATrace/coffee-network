import { ChainCountry } from "./ChainCountry";

export interface ChainLocation {
    /**
     * address
     */
    address?: string | null;
    /**
     * city
     */
    city?: string | null;
    /**
     * country
     */
    country?: ChainCountry;
    /**
     * state / province / region
     */
    state?: string | null;
    /**
     * ZIP / postal code / p.p. box
     */
    zip?: string | null;
    /**
     * location latitude
     */
    latitude?: number | null;
    /**
     * location longitude
     */
    longitude?: number | null;
    /**
     * Custom site coordinate
     */
    site?: string | null;
    /**
     * Custom sector coordinate
     */
    sector?: string | null;
    /**
     * Custom cell coordinate
     */
    cell?: string | null;
    /**
     * Custom village coordinate
     */
    village?: string | null;
    /**
     * Is location publicly visible?
     */
    isPubliclyVisible?: boolean | null;
}

