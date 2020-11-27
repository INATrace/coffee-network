export interface ApiSustainability {
    /**
     * CO2 footprint - If you have calculated your company CO2 footprint, please add this information
     */
    co2Footprint?: string;
    /**
     * sustainable packaging - Describe the environmental sustainability of your packaging, max 1000 chars
     */
    packaging?: string;
    /**
     * environmentally friendly production, max 1000 chars
     */
    production?: string;
}

