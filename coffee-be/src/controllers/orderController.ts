import express from "express";
import { Body, Controller, Get, Path, Post, Query, Route, Security, Tags, Request  } from "tsoa";
import { Inject } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainProductOrder } from "../models/chain/ChainProductOrder";
import { ProcessingOrderHistory, QuoteRequirementConfirmation, QuoteRequirementConfirmationsWithMetaData } from "../models/chain/ChainStockOrder";
import { PaginatedList } from "../models/chain/PaginatedList";

@Security("jwt")
@Tags('Order')
@Route("chain-api/data/order")
export class OrderController extends Controller {

    @Inject
    private chaincode: ChainCode;

    ////////////////////////////////////////////////
    /// ORDER
    ////////////////////////////////////////////////

    @Get("facility/{facilityId}/list-open")
    public async listOpenOrdersForFacility(
        @Request() request: express.Request,
        @Path() facilityId: string,
        @Query() openOnly?: boolean,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() sortBy?: string,
        @Query() limit?: number,
        @Query() offset?: number,
    ): Promise<ApiResponse<PaginatedList<ChainProductOrder>>> {
        return handleApiResponse(
            this.chaincode.listOpenOrdersForFacility(facilityId,  { sort, sortBy, limit, offset }, openOnly)
        )
    }

    @Get("organization/{organizationId}/list-open")
    public async listOpenOrdersForOrganization(
        @Request() request: express.Request,
        @Path() organizationId: string,
        @Query() openOnly?: boolean,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() sortBy?: string,
        @Query() limit?: number,
        @Query() offset?: number,
    ): Promise<ApiResponse<PaginatedList<ChainProductOrder>>> {
        return handleApiResponse(
            this.chaincode.listOpenOrdersForOrganization(organizationId,  { sort, sortBy, limit, offset }, openOnly)
        )
    }

    @Get("aggregates-for-order/{orderId}")
    public async getAggregatesForOrder(
        @Request() request: express.Request,
        @Path() orderId: string,
    ): Promise<ApiResponse<ProcessingOrderHistory[]>> {
        return handleApiResponse(
            this.chaincode.aggregatesForOrderIdCached(orderId, true)
        )
    }

    @Get("quote-requrements-verify-for-order/{orderId}")
    public async getQuoteRequirementsVerification(
        @Request() request: express.Request,
        @Path() orderId: string,
    ): Promise<ApiResponse<QuoteRequirementConfirmationsWithMetaData>> {
        return handleApiResponse(
            this.chaincode.verifyQuoteRequirementsForOrderCached(orderId)
        )
    }

    /**
     * Fetches an order by its _id.
     * @param dbId
     */
    @Get("{dbId}")
    public async getOrder(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainProductOrder>> {
        return handleApiResponse(
            this.chaincode.getOrder(dbId)
        )
    }

    /**
     * Inserts or updates an order. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('')
    public async postOrder(
        @Request() request: express.Request,
        @Body() requestBody: ChainProductOrder
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertOrder(requestBody)
        )
    }

    /**
     * Deletes order.
     * @param requestBody
     */
    @Post('delete')
    public async deleteOrder(
        @Request() request: express.Request,
        @Body() requestBody: ChainProductOrder
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteOrder(requestBody)
        )
    }

}