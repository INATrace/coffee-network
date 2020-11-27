/**
 * Generic API response. See documentation for data type for specific type details.
 */

import { ApiPaginatedListApiCompanyListResponse } from "./apiPaginatedListApiCompanyListResponse";
import { ApiValidationErrorDetails } from "../apiValidationErrorDetails";
import { ApiDefaultResponseStatusEnum } from "../apiDefaultResponse";

export interface ApiPaginatedResponseApiCompanyListResponse {
    data?: ApiPaginatedListApiCompanyListResponse;
    /**
     * Optional details for unexpected error responses.
     */
    errorDetails?: string;
    /**
     * Simple message to explain client developers the reason for error.
     */
    errorMessage?: string;
    /**
     * Response status. OK for successful reponses.
     */
    status: ApiDefaultResponseStatusEnum;
    validationErrorDetails?: ApiValidationErrorDetails;
}
