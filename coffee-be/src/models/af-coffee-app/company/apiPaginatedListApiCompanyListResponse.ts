import { ApiCompanyListResponse } from './apiCompanyListResponse';

export interface ApiPaginatedListApiCompanyListResponse {
    /**
     * Count of all items satisfying 'paginatable' request.
     */
    count?: number;
    /**
     * Response items.
     */
    items?: ApiCompanyListResponse[];
    /**
     * Limit got from request
     */
    limit?: number;
    /**
     * Offset got from request
     */
    offset?: number;
}
