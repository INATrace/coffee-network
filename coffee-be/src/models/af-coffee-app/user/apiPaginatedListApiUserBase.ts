
import { ApiUserBase } from '../apiUserBase';


export interface ApiPaginatedListApiUserBase {
    /**
     * Count of all items satisfying 'paginatable' request.
     */
    count?: number;
    /**
     * Response items.
     */
    items?: ApiUserBase[];
    /**
     * Limit got from request
     */
    limit?: number;
    /**
     * Offset got from request
     */
    offset?: number;
}
