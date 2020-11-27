import { ApiProductListResponse } from './apiProductListResponse';



export interface ApiPaginatedListApiProductListResponse {
    /**
     * Count of all items satisfying 'paginatable' request.
     */
    count?: number;
    /**
     * Response items.
     */
    items?: ApiProductListResponse[];
    /**
     * Limit got from request
     */
    limit?: number;
    /**
     * Offset got from request
     */
    offset?: number;
}