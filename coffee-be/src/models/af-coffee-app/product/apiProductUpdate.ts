import { ApiBaseEntity } from "../apiBaseEntity";
import { ApiProductLocation } from "./apiProductLocation";
import { ApiDocumentStorageKey } from "../apiDocumentStorageKey";
import { ApiProcessUpdate } from "./process/apiProcessUpdate";
import { ApiResponsibilityUpdate } from "./responsibility/apiResponsibilityUpdate";
import { ApiSustainability } from "./sustainability/apiSustainability";

export interface ApiProductUpdate {
    company?: ApiBaseEntity;
    /**
     * product description
     */
    description?: string;
    /**
     * how to Use / Recipes - Describe the best way to use the product (e.g. recipes, how to apply the product...)
     */
    howToUse?: string;
    /**
     * Entity id
     */
    id?: number;
    /**
     * ingredients - list the ingredients in the product and describe their properties
     */
    ingredients?: string;
    /**
     * Key Markets, market name - share number map
     */
    keyMarketsShare?: { [key: string]: number; };
    /**
     * product name
     */
    name?: string;
    /**
     * nutritional Value - list the nutritional value of the product
     */
    nutritionalValue?: string;
    /**
     * origin - farmer location
     */
    originLocations?: ApiProductLocation[];
    /**
     * origin - text and quantity input - Briefly describe where the product or its ingredients are produced
     */
    originText?: string;
    photo?: ApiDocumentStorageKey;
    process?: ApiProcessUpdate;
    responsibility?: ApiResponsibilityUpdate;
    sustainability?: ApiSustainability;
}

