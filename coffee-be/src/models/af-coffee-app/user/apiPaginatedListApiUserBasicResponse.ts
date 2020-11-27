
import { ApiUserBasicResponse } from './apiUserBasicResponse';



export interface ApiPaginatedListApiUserBasicResponse {
    /**
     * Count of all items satisfying 'paginatable' request.
     */
    count?: number;
    /**
     * Response items.
     */
    items?: ApiUserBasicResponse[];
    /**
     * Limit got from request
     */
    limit?: number;
    /**
     * Offset got from request
     */
    offset?: number;
}

