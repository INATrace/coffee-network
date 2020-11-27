import { ApiProductLabelStatusEnum } from "./apiProductLabel";

export interface ApiProductLabelBase {
    /**
     * Entity id
     */
    id?: number;
    /**
     * Product id
     */
    productId?: number;
    /**
     * Product label status
     */
    status?: ApiProductLabelStatusEnum;
    /**
     * label title
     */
    title?: string;
    /**
     * Product label uuid (for url)
     */
    uuid?: string;
}
