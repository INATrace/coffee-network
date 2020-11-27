export interface ApiProductLabelCreate {
    /**
     * Fields
     */
    fields?: string[];
    /**
     * Entity id
     */
    id?: number;
    /**
     * Product id
     */
    productId?: number;
    /**
     * label title
     */
    title?: string;
    /**
     * Product label uuid (for url)
     */
    uuid?: string;
}
