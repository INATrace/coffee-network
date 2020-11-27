import { Body, Controller, Get, Path, Post, Query, Route, Tags } from "tsoa";
import { Inject } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainFacility } from "../models/chain/ChainFacility";
import { PaginatedList } from "../models/chain/PaginatedList";

@Tags('Facility')
@Route("chain-api/data/facility")
export class FacilityController extends Controller {

    @Inject
    private chaincode: ChainCode;

    ////////////////////////////////////////////////
    /// FACILITY
    ////////////////////////////////////////////////

    /**
     * Paginated list of facilities.
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list")
    public async listFacilities(
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainFacility>>> {
        return handleApiResponse(
            this.chaincode.listFacilities({sort, limit, offset})
        )
    }

    /**
     * Fetches a facility by its _id.
     * @param dbId
     */
    @Get("{dbId}")
    public async getFacilityById(
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainFacility>> {
        return handleApiResponse(
            this.chaincode.getFacility(dbId)
        )
    }

    /**
     * Inserts or updates a facility. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('')
    public async postFacility(
        @Body() requestBody: ChainFacility
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertFacility(requestBody)
        )
    }

    /**
     * Paginated list of facilities for a given organization
     * @param organizationId _id of a given organization
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list/organization/{organizationId}")
    public async listFacilitiesForOrganization(
        @Path() organizationId: string,
        @Query() query?: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainFacility>>> {
        return handleApiResponse(
            this.chaincode.listFacilitiesForOrganization(organizationId, query, {sort, limit, offset})
        )
    }

    /**
     * Paginated list of facilities for a given organization and semiProductId
     * @param organizationId _id of a given organization
     * @param semiProductId _id of desired semi-product
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list/organization/{organizationId}/semi-product/{semiProductId}")
    public async listFacilitiesForOrganizationAndSemiProduct(
        @Path() organizationId: string,
        @Path() semiProductId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainFacility>>> {
        return handleApiResponse(
            this.chaincode.listFacilitiesForOrganizationAndSemiProduct(organizationId, semiProductId, { sort, limit, offset })
        )
    }

    /**
     * Paginated list of sellig facilities for a given organization and semiProductId
     * @param organizationId _id of a given organization
     * @param semiProductId _id of desired semi-product
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list/organization/{organizationId}/semi-product/{semiProductId}/selling")
    public async listSellingFacilitiesForOrganizationAndSemiProduct(
        @Path() organizationId: string,
        @Path() semiProductId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainFacility>>> {
        return handleApiResponse(
            this.chaincode.listSellingFacilitiesForOrganizationAndSemiProduct(organizationId, semiProductId, { sort, limit, offset })
        )
    }

    /**
     * Paginated list of COLLECTING facilities for a given organization
     * @param organizationId _id of a given organization
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list/collecting/organization/{organizationId}")
    public async listOfCollectingFacilitiesForOrganization(
        @Path() organizationId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainFacility>>> {
        return handleApiResponse(
            this.chaincode.listOfCollectingFacilitiesForOrganization(organizationId, { sort, limit, offset })
        )
    }

    /**
     * Deletes facility.
     * @param requestBody
     */
    @Post('delete')
    public async deleteFacility(
        @Body() requestBody: ChainFacility
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteFacility(requestBody)
        )
    }
}