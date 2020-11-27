import { ApiProductLabelField } from './apiProductLabelField';



export interface ApiProductLabel {
    /**
     * Fields
     */
    fields?: ApiProductLabelField[];
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

/**
 * All possible values of status.
 */
export type ApiProductLabelStatusEnum =
    'UNPUBLISHED'
    |  'PUBLISHED';


