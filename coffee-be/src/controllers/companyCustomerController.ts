import { Body, Controller, Get, Path, Post, Query, Route, Tags } from "tsoa";
import { Inject } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainCompanyCustomer } from "../models/chain/ChainCompanyCustomer";
import { PaginatedList } from "../models/chain/PaginatedList";

@Tags('Company Customer')
@Route("chain-api/data/company-customer")
export class CompanyCustomerController extends Controller {

    @Inject
    private chaincode: ChainCode;

    ////////////////////////////////////////////////
    /// COMPANY CUSTOMER
    ////////////////////////////////////////////////

    /**
     * Paginated list of company customers.
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list")
    public async listCompanyCustomers(
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainCompanyCustomer>>> {
        return handleApiResponse(
            this.chaincode.listAllCompanyCustomers({sort, limit, offset})
        )
    }

    /**
     * Fetches comapny customer by its _id.
     * @param dbId database id of the product
     */
    @Get("{dbId}")
    public async getCompanyCustomer(
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainCompanyCustomer>> {
        return handleApiResponse(
            this.chaincode.getCompanyCustomer(dbId)
        )
    }

    /**
     * Returns a list of company customers matching to the list of external ids.
     * Warning: Id lists and response list do not necessary match in length.
     * if invalid external id is provided in the request's list the response list is shorter.
     * @param requestBody list of external ids
     */
    @Post('external/list')
    public async companyCustomersForIds(
        @Body() requestBody: number[]
    ): Promise<ApiResponse<ChainCompanyCustomer[]>> {
        return handleApiResponse(
            this.chaincode.companyCustomersForIds(requestBody)
        )
    }

    /**
     * Returns company customer according to external database id.
     * @param linkId external database product id
     */
    @Get("external/{linkId}")
    public async getComapnyCustomerByAFId(
        @Path() linkId: number,
    ): Promise<ApiResponse<ChainCompanyCustomer>> {
        return handleApiResponse(
            this.chaincode.getCompanyCustomerByCompanyCustomerId(linkId)
        )
    }

    /**
     * Inserts or updates a company customer. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('')
    public async postCompanyCustomer(
        @Body() requestBody: ChainCompanyCustomer
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertCompanyCustomer(requestBody)
        )
    }

    /**
     * Paginated list of company customers for a given organization
     * @param organizationId _id of a given organization
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list/organization/{organizationId}")
    public async listCompanyCustomersForOrganization(
        @Path() organizationId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainCompanyCustomer>>> {
        return handleApiResponse(
            this.chaincode.listCompanyCustomersForOrganization(organizationId, {sort, limit, offset})
        )
    }

    /**
     * Paginated list of company customers for a given organization
     * @param organizationId _id of a given organization
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list/product/{productId}/organization/{organizationId}")
    public async listCompanyCustomersForProductAndOrganization(
        @Path() productId: string,
        @Path() organizationId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainCompanyCustomer>>> {
        return handleApiResponse(
            this.chaincode.listCompanyCustomersForProductAndOrganization(productId, organizationId, {sort, limit, offset})
        )
    }

    /**
     * Deletes company custoemr
     * @param requestBody
     */
    @Post('delete')
    public async deleteCompanyCustomer(
        @Body() requestBody: ChainCompanyCustomer
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteCompanyCustomer(requestBody)
        )
    }

}