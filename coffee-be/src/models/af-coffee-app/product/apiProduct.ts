import { ApiCompany } from "../company/apiCompany";
import { ApiProductLabelValues } from "./label/apiProductLabelValues";
import { ApiProductOrigin } from "./apiProductOrigin";
import { ApiDocument } from "../apiDocument";
import { ApiProcess } from "./process/apiProcess";
import { ApiResponsibility } from "./responsibility/apiResponsibility";
import { ApiSustainability } from "./sustainability/apiSustainability";

export interface ApiProduct {
    company?: ApiCompany;
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
     * labels
     */
    labels?: ApiProductLabelValues[];
    /**
     * product name
     */
    name?: string;
    /**
     * nutritional Value - list the nutritional value of the product
     */
    nutritionalValue?: string;
    origin?: ApiProductOrigin;
    photo?: ApiDocument;
    process?: ApiProcess;
    responsibility?: ApiResponsibility;
    sustainability?: ApiSustainability;
}
