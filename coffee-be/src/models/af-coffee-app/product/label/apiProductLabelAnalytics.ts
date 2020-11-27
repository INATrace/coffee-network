export interface ApiProductLabelAnalytics {
    /**
     * number of authenticity checks per country
     */
    authCountries?: { [key: string]: number; };
    /**
     * number of unsuccessful authenticity checks
     */
    authFalse?: number;
    /**
     * number of authenticity checks per lat:lon
     */
    authLocations?: { [key: string]: number; };
    /**
     * number of successful authenticity checks
     */
    authTrue?: number;
    /**
     * number of origin checks per country
     */
    originCountries?: { [key: string]: number; };
    /**
     * number of unsuccessful origin checks
     */
    originFalse?: number;
    /**
     * number of origin checks per lat:lon
     */
    originLocations?: { [key: string]: number; };
    /**
     * number of successful origin checks
     */
    originTrue?: number;
    /**
     * number of vistis
     */
    visits?: number;
    /**
     * number of visits per country
     */
    visitsCountries?: { [key: string]: number; };
    /**
     * number of visits per lat:lon
     */
    visitsLocations?: { [key: string]: number; };
}
