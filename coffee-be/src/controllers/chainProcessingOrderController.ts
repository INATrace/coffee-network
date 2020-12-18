import express from "express";
import { Body, Controller, Get, Path, Post, Query, Route, Security, Tags, Request } from "tsoa";
import { Inject } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainProcessingOrder } from "../models/chain/ChainProcessingOrder";
import { PaginatedList } from "../models/chain/PaginatedList";

@Security("jwt")
@Tags('Processing order')
@Route("chain-api/data/processing-order")
export class ProcessingOrderController extends Controller {

    @Inject
    private chaincode: ChainCode;

    ////////////////////////////////////////////////
    /// SEMI PRODUCT
    ////////////////////////////////////////////////

    /**
     * Paginated list of semi products.
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list")
    public async listProcessingOrders(
        @Request() request: express.Request,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainProcessingOrder>>> {
        return handleApiResponse(
            this.chaincode.listProcessingOrders({sort, limit, offset})
        )
    }

    /**
     * Returns a paginated list of all stock orders in a given facility
     * @param facilityId _id of a given facility
     * @param showPurchaseOrderOpenBalanceOnly show purhcase orders with open balance
     * @param purchaseOrderOnly show only purchase orders
     * @param query query by identifier
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("facility/{facilityId}/all")
    public async listProcessingOrdersForFacility(
        @Request() request: express.Request,
        @Path() facilityId: string,
        @Query() query? :string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainProcessingOrder>>> {
        return handleApiResponse(
            this.chaincode.listAllProcessingOrdersInFacility(facilityId, query, {sort, limit, offset})
        )
    }

    /**
     * Fetches semi product by its _id.
     * @param dbId database _id of the product
     */
    @Get("{dbId}")
    public async getProcessingOrder(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainProcessingOrder>> {
        return handleApiResponse(
            this.chaincode.getProcessingOrder(dbId)
        )
    }

    /**
     * Inserts or updates a semi product. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('')
    public async postProcessingOrder(
        @Request() request: express.Request,
        @Body() requestBody: ChainProcessingOrder
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertProcessingOrder(requestBody)
        )
    }

    /**
     * Deletes processing order.
     * @param requestBody
     */
    @Post('delete')
    public async deleteProcessingOrder(
        @Request() request: express.Request,
        @Body() requestBody: ChainProcessingOrder
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteProcessingOrder(requestBody)
        )
    }


}