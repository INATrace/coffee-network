import { ApiCountry } from './apiCountry';

export interface ApiAddress {
    /**
     * address
     */
    address?: string;
    /**
     * city
     */
    city?: string;
    country?: ApiCountry;
    /**
     * state / province / region
     */
    state?: string;
    /**
     * ZIP / postal code / p.p. box
     */
    zip?: string;
}

