import { ApiProductLabelBatch } from "./label/apiProductLabelBatch";

export interface ApiPaginatedListApiProductLabelBatch {
    /**
     * Count of all items satisfying 'paginatable' request.
     */
    count?: number;
    /**
     * Response items.
     */
    items?: ApiProductLabelBatch[];
    /**
     * Limit got from request
     */
    limit?: number;
    /**
     * Offset got from request
     */
    offset?: number;
}
