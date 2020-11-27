import { Body, Controller, Get, Path, Post, Query, Route, Tags } from "tsoa";
import { Inject } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainOrganization } from "../models/chain/ChainOrganization";
import { PaginatedList } from "../models/chain/PaginatedList";

@Tags('Organization')
@Route("chain-api/data/organization")
export class OrganizationController extends Controller {

    @Inject
    private chaincode: ChainCode;

    ////////////////////////////////////////////////
    /// ORGANIZATION
    ////////////////////////////////////////////////

    /**
     * Paginated list of organization.
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list")
    public async listOrganizations(
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainOrganization>>> {
        return handleApiResponse(
            this.chaincode.listOrganizations({sort, limit, offset})
        )
    }

    /**
     * Fetches organization by its _id.
     * @param dbId database id of the organization
     */
    @Get("{dbId}")
    public async getOrganization(
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainOrganization>> {
        return handleApiResponse(
            this.chaincode.getOrganization(dbId)
        )
    }

    /**
     * Returns organization according to external database id.
     * @param linkId external database company id
     */
    @Get("external/{linkId}")
    public async getOrganizationByCompanyId(
        @Path() linkId: number,
    ): Promise<ApiResponse<ChainOrganization>> {
        return handleApiResponse(
            this.chaincode.getOrganizationByCompanyId(linkId)
        )
    }

    /**
     * Returns a list of organization matching to the list of external ids.
     * Warning: Id lists and response list do not necessary match in length.
     * if invalid external id is provided in the request's list the response list is shorter.
     * @param requestBody list of external ids
     */
    @Post('company/list')
    public async organizationsForIds(
        @Body() requestBody: number[]
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.organizationsForIds(requestBody)
        )
    }

    /**
     * Inserts or updates organization. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('')
    public async postOrganization(
        @Body() requestBody: ChainOrganization
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertOrganization(requestBody)
        )
    }

    /**
     * Deletes organization.
     * @param requestBody
     */
    @Post('delete')
    public async deleteOrganization(
        @Body() requestBody: ChainOrganization
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteOrganization(requestBody)
        )
    }

}