import express from "express";
import { Controller, Get, Path, Query, Request, Route, Tags } from "tsoa";
import { Inject } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { B2CHistoryTimeline, ProcessingOrderHistory } from "../models/chain/ChainStockOrder";


@Tags('Public')
@Route("chain-api/data/public")
export class ChainPublicController extends Controller {

    @Inject
    private chaincode: ChainCode;


    /**
     * Returns aggregates for stock order
     * @param stockOrderId stock order dbID
     */
    @Get("aggregates/{stockOrderId}")
    public async getAggregatesForStockOrder(
        @Request() request: express.Request,
        @Path() stockOrderId: string,
    ): Promise<ApiResponse<B2CHistoryTimeline>> {
        return handleApiResponse(
            // this.chaincode.aggregatesForStockOrderId(stockOrderId)
            this.chaincode.aggregatesForStockOrderIdCachedFE(stockOrderId)
        )
    }


    /**
     * Returns B2C relevant data for stock order
     * @param stockOrderId stock order dbID
     * @param oderId
     * @param cooperative
     * @param cuppingGrade
     */
    @Get("b2c/{stockOrderId}")
    public async getB2CDataForStockOrder(
        @Request() request: express.Request,
        @Path() stockOrderId: string,
        @Query() orderId?: boolean,
        @Query() cooperative?: boolean,
        @Query() cuppingGrade?: boolean,
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.getB2CDataForStockOrderCached(stockOrderId, orderId, cooperative, cuppingGrade)
        )
    }
}