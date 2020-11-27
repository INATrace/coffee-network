import { ApiAddress } from "../apiAddress";

export interface ApiProductLocation {
    address?: ApiAddress;
    /**
     * location latitude
     */
    latitude?: number;
    /**
     * location longitude
     */
    longitude?: number;
    /**
     * number of farmers at this location
     */
    numberOfFarmers?: number;
    /**
     * pin (location) name
     */
    pinName?: string;
}

