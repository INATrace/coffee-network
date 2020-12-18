import express from "express";
import { Body, Controller, Get, Path, Post, Query, Route, Security, Tags, Request  } from "tsoa";
import { Inject } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainUserCustomer } from "../models/chain/ChainUserCustomer";
import { PaginatedList } from "../models/chain/PaginatedList";
import { ChainStockOrder } from "../models/chain/ChainStockOrder";
import { ChainPayment } from "../models/chain/ChainPayment";

@Security("jwt")
@Tags('User Customer')
@Route("chain-api/data/user-customer")
export class UserCustomerController extends Controller {

    @Inject
    private chaincode: ChainCode;

    ////////////////////////////////////////////////
    /// USER CUSTOMER
    ////////////////////////////////////////////////

    /**
     * Paginated list of user customer.
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list")
    public async listUserCustomers(
        @Request() request: express.Request,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainUserCustomer>>> {
        return handleApiResponse(
            this.chaincode.listAllUserCustomers({ sort, limit, offset })
        )
    }

    /**
     * Fetches user customer by its _id.
     * @param dbId database id of the product
     */
    @Get("{dbId}")
    public async getUserCustomer(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainUserCustomer>> {
        return handleApiResponse(
            this.chaincode.getUserCustomer(dbId)
        )
    }

    /**
     * Returns a list of user customers matching to the list of external ids.
     * Warning: Id lists and response list do not necessary match in length.
     * if invalid external id is provided in the request's list the response list is shorter.
     * @param requestBody list of external ids
     */
    @Post('external/list')
    public async userCustomersForIds(
        @Request() request: express.Request,
        @Body() requestBody: number[]
    ): Promise<ApiResponse<ChainUserCustomer[]>> {
        return handleApiResponse(
            this.chaincode.userCustomersForIds(requestBody)
        )
    }

    /**
     * Returns user customer according to external database id.
     * @param linkId external database product id
     */
    @Get("external/{linkId}")
    public async getUserCustomerByAFId(
        @Request() request: express.Request,
        @Path() linkId: number,
    ): Promise<ApiResponse<ChainUserCustomer>> {
        return handleApiResponse(
            this.chaincode.getUserCustomerByUserCustomerId(linkId)
        )
    }

    /**
     * Inserts or updates a user customer. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('')
    public async postUserCustomer(
        @Request() request: express.Request,
        @Body() requestBody: ChainUserCustomer
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertUserCustomer(requestBody)
        )
    }

    /**
     * Paginated list of user customers for a given organization
     * @param organizationId _id of a given organization
     * @param query query by name
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list/organization/{organizationId}")
    public async listUserCustomersForOrganization(
        @Request() request: express.Request,
        @Path() organizationId: string,
        @Query() query?: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainUserCustomer>>> {
        return handleApiResponse(
            this.chaincode.listUserCustomersForOrganization(organizationId, query, { sort, limit, offset })
        )
    }

    /**
     * Paginated list of user customers for a given organization
     * @param role desire role (FARMER or COLLECTOR)
     * @param query query by name
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list/role/{role}")
    public async listUserCustomersByRole(
        @Request() request: express.Request,
        @Path() role: string,
        @Query() query?: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainUserCustomer>>> {
        return handleApiResponse(
            this.chaincode.listUserCustomersByRole(role, query, { sort, limit, offset })
        )
    }

    /**
     * Paginated list of user customers for a given organization and role
     * @param organizationId _id of a given organization
     * @param query query by name
     * @param queryBY BY_NAME or BY_SURNAME or BY_USER_CUSTOMER_ID
     * @param role desired user customer role (FARMER or COLLECTOR)
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list/organization/{organizationId}/role/{role}")
    public async listUserCustomersForOrganizationAndRole(
        @Request() request: express.Request,
        @Path() organizationId: string,
        @Path() role: string,
        @Query() query?: string,
        @Query() queryBy?: 'BY_NAME' | 'BY_SURNAME' | 'BY_USER_CUSTOMER_ID' | 'ALL',
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainUserCustomer>>> {
        return handleApiResponse(
            this.chaincode.listUserCustomersForOrganizationAndRole(organizationId, role, query, queryBy, { sort, limit, offset })
        )
    }

    /**
     * Paginated list of user customers for a given organization
     * @param organizationId _id of a given organization
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list/product/{productId}/organization/{organizationId}")
    public async listUserCustomersForProductAndOrganization(
        @Request() request: express.Request,
        @Path() productId: string,
        @Path() organizationId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainUserCustomer>>> {
        return handleApiResponse(
            this.chaincode.listUserCustomersForProductAndOrganization(productId, organizationId, { sort, limit, offset })
        )
    }

    /**
     * Paginated list of purchase orders (stock ordrs) for a given user customer
     * @param productId
     * @param organizationId
     * @param sort
     * @param limit
     * @param offset
     * @param startDate
     * @param endDate
     */
    @Get("list/stock-orders/{userCustomerId}")
    public async listStockOrdersForUserCustomer(
        @Request() request: express.Request,
        @Path() userCustomerId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number,
        @Query() startDate?: string,
        @Query() endDate?: string,
    ): Promise<ApiResponse<PaginatedList<ChainStockOrder>>> {
        return handleApiResponse(
            this.chaincode.listStockOrdersForUserCustomer(userCustomerId, { sort, limit, offset }, startDate, endDate)
        )
    }

    /**
     * Paginated list of payments for a given user customer
     * @param productId
     * @param organizationId
     * @param sort
     * @param limit
     * @param offset
     * @param startDate
     * @param endDate
     */
    @Get("list/payments/{userCustomerId}")
    public async listPaymentsorUserCustomer(
        @Request() request: express.Request,
        @Path() userCustomerId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number,
        @Query() startDate?: string,
        @Query() endDate?: string,
    ): Promise<ApiResponse<PaginatedList<ChainPayment>>> {
        return handleApiResponse(
            this.chaincode.listPaymentsForUserCustomer(userCustomerId, { sort, limit, offset }, startDate, endDate)
        )
    }


    /**
     * Deletes user custoemr
     * @param requestBody
     */
    @Post('delete')
    public async deleteUserCustomer(
        @Request() request: express.Request,
        @Body() requestBody: ChainUserCustomer
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteUserCustomer(requestBody)
        )
    }

}