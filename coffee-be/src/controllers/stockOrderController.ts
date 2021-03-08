import express from "express";
import { Body, Controller, Get, Path, Post, Query, Route, Security, Tags, Request  } from "tsoa";
import { Inject, Singleton } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainHistory } from "../models/chain/ChainHistory";
import { AvailabilityInFacilitiesRequest, ChainSemiProductAvailability } from "../models/chain/ChainSemiProduct";
import { ChainStockOrder, ProcessingOrderHistory, QuoteRequirementConfirmation, StockOrderAggregates, WeightedAggregate } from "../models/chain/ChainStockOrder";
import { PaginatedList } from "../models/chain/PaginatedList";

@Singleton
@Security("jwt")
@Tags('Stock order')
@Route("chain-api/data/stock-order")
export class StockOrderController extends Controller {

    @Inject
    private chaincode: ChainCode;

    ////////////////////////////////////////////////
    /// STOCK ORDER
    ////////////////////////////////////////////////

    /**
     * Returns a paginated list of all stock orders in a given facility
     * @param facilityId _id of a given facility
     * @param showPurchaseOrderOpenBalanceOnly show purhcase orders with open balance
     * @param purchaseOrderOnly show only purchase orders
     * @param wayOfPayment CASH_VIA_COOPERATIVE or CASH_VIA_COLLECTOR or BANK_TRANSFER or UNKNOWN
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     * @param womensCoffee
     * @param productionDateStart
     * @param productionDateEnd
     * @param query by farmer name or surname
     */
    @Get("facility/{facilityId}/all")
    public async listStockForFacility(
        @Request() request: express.Request,
        @Path() facilityId: string,
        @Query() showPurchaseOrderOpenBalanceOnly?: boolean,
        @Query() purchaseOrderOnly?: boolean,
        @Query() availableOnly?: boolean,
        @Query() semiProductId?: string,
        @Query() wayOfPayment?: 'CASH_VIA_COOPERATIVE' | 'CASH_VIA_COLLECTOR' | 'BANK_TRANSFER' | 'UNKNOWN',
        @Query() sort?: 'ASC' | 'DESC',
        @Query() sortBy?: string,
        @Query() limit?: number,
        @Query() offset?: number,
        @Query() womensCoffee?: boolean,
        @Query() productionDateStart?: string,
        @Query() productionDateEnd?: string,
        @Query() query?: string,
    ): Promise<ApiResponse<PaginatedList<ChainStockOrder>>> {
        return handleApiResponse(
            this.chaincode.listAllStockOrdersInFacility(facilityId, { showPurchaseOrderOpenBalanceOnly, purchaseOrderOnly, availableOnly, semiProductId, wayOfPayment, womensCoffee, productionDateStart, productionDateEnd, query }, { sort, sortBy, limit, offset })
        )
    }

    /**
     * Returns a list of all stock orders for organizationId
     * @param organizationId organizationId
     * @param showPurchaseOrderOpenBalanceOnly show purhcase orders with open balance
     * @param purchaseOrderOnly show only purchase orders
     * @param wayOfPayment CASH_VIA_COOPERATIVE or CASH_VIA_COLLECTOR or BANK_TRANSFER or UNKNOWN
     * @param farmerId
     * @param womensCoffee
     * @param limit
     * @param offset
     * @param productionDateStart
     * @param productionDateEnd
     * @param query by farmer name or surname
     */
    @Get("organization/{organizationId}/all")
    public async listStockOrdersForOrganization(
        @Request() request: express.Request,
        @Path() organizationId: string,
        @Query() showPurchaseOrderOpenBalanceOnly?: boolean,
        @Query() purchaseOrderOnly?: boolean,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() farmerId?: string,
        @Query() wayOfPayment?: 'CASH_VIA_COOPERATIVE' | 'CASH_VIA_COLLECTOR' | 'BANK_TRANSFER' | 'UNKNOWN',
        @Query() womensCoffee?: boolean,
        @Query() limit?: number,
        @Query() offset?: number,
        @Query() productionDateStart?: string,
        @Query() productionDateEnd?: string,
        @Query() query?: string,
    ): Promise<ApiResponse<PaginatedList<ChainStockOrder>>> {
        return handleApiResponse(
            this.chaincode.listAllStockOrdersForOrganization(organizationId, purchaseOrderOnly, showPurchaseOrderOpenBalanceOnly, wayOfPayment, farmerId, womensCoffee, productionDateStart, productionDateEnd, query, { sort, limit, offset })
        )
    }

    /**
     * Lists stock orders in facility filtered optionaly by specific customer and possibly only open
     * @param facilityId
     * @param companyCustomerId
     * @param openOnly
     * @param sort
     * @param sortBy
     * @param limit
     * @param offset
     */
    @Get("facility/{facilityOrOrganizationId}/orders-for-customers")
    public async listStockInFacilityForCustomers(
        @Request() request: express.Request,
        @Path() facilityOrOrganizationId: string,
        @Query() companyCustomerId?: string,
        @Query() openOnly?: boolean,
        @Query() mode?: 'facility' | 'organization' | null,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() sortBy?: string,
        @Query() limit?: number,
        @Query() offset?: number,
    ): Promise<ApiResponse<PaginatedList<ChainStockOrder>>> {
        return handleApiResponse(
            this.chaincode.listAllStockOrdersInFacilityForCustomer(facilityOrOrganizationId, { companyCustomerId, openOnly}, { sort, sortBy, limit, offset }, mode)
        )
    }

    /**
     * Returns a paginated list of all stock orders
     * @param showPurchaseOrderOpenBalanceOnly show purhcase orders with open balance
     * @param purchaseOrderOnly show only purchase orders
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("all")
    public async listStockOrders(
        @Request() request: express.Request,
        @Query() showPurchaseOrderOpenBalanceOnly?: boolean,
        @Query() purchaseOrderOnly?: boolean,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainStockOrder>>> {
        return handleApiResponse(
            this.chaincode.listAllStockOrders(purchaseOrderOnly, showPurchaseOrderOpenBalanceOnly, { sort, limit, offset })
        )
    }

    /**
     *  Returns a paginated list of all stock orders
     * @param farmerId userCustomerId
     * @param showOpenBalanceOnly
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("farmer/{farmerId}/purchase-orders")
    public async listPurchaseOrderForUserCustomer(
        @Request() request: express.Request,
        @Path() farmerId: string,
        @Query() showOpenBalanceOnly?: boolean,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainStockOrder>>> {
        return handleApiResponse(
            this.chaincode.listPurchaseOrderForUserCustomer(farmerId, showOpenBalanceOnly, { sort, limit, offset })
        )
    }

    /**
     * Lists semi-product availability in a facility
     * @param facilityId
     * @param semiProductId
     */
    @Get("availability/facility/{facilityId}/semi-product/{semiProductId}")
    public async availableQuantityOfSemiProductInFacility(
        @Request() request: express.Request,
        @Path() facilityId: string,
        @Path() semiProductId: string,
    ): Promise<ApiResponse<ChainSemiProductAvailability>> {
        return handleApiResponse(
            this.chaincode.semiProductAvailabilityInFacility(facilityId, semiProductId)
        )
    }

    @Post("availability")
    public async availableQuantityOfSemiProductInFacilities(
        @Request() request: express.Request,
        @Body() requestBody: AvailabilityInFacilitiesRequest
    ): Promise<ApiResponse<ChainSemiProductAvailability[]>> {
        return handleApiResponse(
            this.chaincode.semiProductAvailabilityInFacilities(requestBody.facilityIds, requestBody.semiProductId)
        )
    }

    /**
     * Returns a paginated list of stock orders in a given facility
     * @param facilityId _id of a given facility
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("facility/{facilityId}/available")
    public async listAvailableStockForFacility(
        @Request() request: express.Request,
        @Path() facilityId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainStockOrder>>> {
        return handleApiResponse(
            this.chaincode.listAvailableStockOrdersInFacility(facilityId, { sort, limit, offset })
        )
    }

    /**
     * Returns a paginated list of stock orders with certain semi-product id in a given facility
     * @param facilityId _id of a given facility
     * @param semiProductId _id of a desired semi-product
     * @param womensCoffee
     * @param productionDateStart
     * @param productionDateEnd
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("facility/{facilityId}/semi-product/{semiProductId}/available")
    public async listAvailableStockForSemiProductInFacility(
        @Request() request: express.Request,
        @Path() facilityId: string,
        @Path() semiProductId: string,
        @Query() womensCoffee?: boolean,
        @Query() productionDateStart?: string,
        @Query() productionDateEnd?: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainStockOrder>>> {
        return handleApiResponse(
            this.chaincode.listAvailableStockForSemiProductInFacility(facilityId, semiProductId, womensCoffee, productionDateStart, productionDateEnd, { sort, limit, offset })
        )
    }


    /**
     * Fetches a stock order by its _id.
     * @param dbId
     */
    @Get("{dbId}")
    public async getStockOrderById(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainStockOrder>> {
        return handleApiResponse(
            this.chaincode.getStockOrder(dbId)
        )
    }

    /**
     * Fetches a stock order by its _id.
     * @param dbId
     */
    @Get("{dbId}/with-input-orders")
    public async getStockOrderByIdWithInputOrders(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainStockOrder>> {
        return handleApiResponse(
            this.chaincode.getStockOrder(dbId, false, false, true)
        )
    }

    /**
     * Inserts or updates a stock order. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('')
    public async postStockOrder(
        @Request() request: express.Request,
        @Body() requestBody: ChainStockOrder
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertStockOrder(requestBody)
        )
    }

    /**
     * Deletes stock order.
     * @param requestBody
     */
    @Post('delete')
    public async deleteStockOrder(
        @Request() request: express.Request,
        @Body() requestBody: ChainStockOrder
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteStockOrder(requestBody)
        )
    }

    /**
     * Deletes stock orders.
     * @param requestBody
     */
    @Post('delete-stock-orders')
    public async deleteStockOrders(
        @Request() request: express.Request,
        @Body() requestBody: ChainStockOrder[]
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteStockOrders(requestBody)
        )
    }

    // /**
    //  * Returns history
    //  * @param dbId
    //  */
    // @Get("history/{dbId}")
    // public async getHistoryForStockOrder(
    //     @Path() dbId: string,
    // ): Promise<ApiResponse<ChainHistory>> {
    //     return handleApiResponse(
    //         this.chaincode.stockOrderHistory(dbId)
    //     )
    // }

    /**
     * Returns aggregates for stock order
     * @param stockOrderId stock order dbID
     */
    @Get("aggregates/{stockOrderId}")
    public async getAggregatesForStockOrder(
        @Request() request: express.Request,
        @Path() stockOrderId: string,
    ): Promise<ApiResponse<ProcessingOrderHistory[]>> {
        return handleApiResponse(
            // this.chaincode.aggregatesForStockOrderId(stockOrderId)
            this.chaincode.aggregatesForStockOrderIdCached(stockOrderId, null, true)
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

    /**
     * Returns seasonal statistics
     * @param organizationId stock order dbID
     * @param fromDate
     * @param toDate
     * @param specificOrder
     */
    @Get("seasonalStatistics/{organizationId}")
    public async getSeasonalStatisticsForOrganization(
        @Request() request: express.Request,
        @Path() organizationId: string,
        @Query() fromDate: string,
        @Query() toDate: string,
        @Query() specificOrder?: string,
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.getSeasonalStatisticsForOrganization(organizationId, fromDate, toDate, specificOrder)
        )
    }

    // /**
    //  * Returns aggregate array for a fieldID
    //  * @param stockOrderId stock order dbID
    //  * @param fieldID field id as in required field definition for processing actions
    //  */
    // @Get("aggregate/{stockOrderId}/field/{fieldID}/purchase")
    // public async getAggregateArrayForFieldPurchaseProperty(
    //     @Path() stockOrderId: string,
    //     @Path() fieldID: string,
    // ): Promise<ApiResponse<WeightedAggregate<any>[]>> {
    //     return handleApiResponse(
    //         this.chaincode.calculateAggregateForField(stockOrderId, fieldID, true)
    //     )
    // }

    // /**
    //  * Returns aggregate array for a fieldID
    //  * @param stockOrderId stock order dbID
    //  * @param fieldID field id as in required field definition for processing actions
    //  */
    // @Get("aggregate/{stockOrderId}/field/{fieldID}")
    // public async getAggregateArrayForField(
    //     @Path() stockOrderId: string,
    //     @Path() fieldID: string,
    // ): Promise<ApiResponse<WeightedAggregate<any>[]>> {
    //     return handleApiResponse(
    //         this.chaincode.calculateAggregateForField(stockOrderId, fieldID, false)
    //     )
    // }

    @Get("facility/{facilityOrOrganizationId}/list-quotes")
    public async listQuoteOrders(
        @Request() request: express.Request,
        @Path() facilityOrOrganizationId: string,
        @Query() openOnly: boolean,
        @Query() semiProductId?: string,
        @Query() mode?: 'facility' | 'organization',
        @Query() sort?: 'ASC' | 'DESC',
        @Query() sortBy?: string,
        @Query() limit?: number,
        @Query() offset?: number,
        @Query() productionDateStart?: string,
        @Query() productionDateEnd?: string,
    ): Promise<ApiResponse<PaginatedList<ChainStockOrder>>> {
        return handleApiResponse(
            this.chaincode.listOpenQuoteOrders(facilityOrOrganizationId, semiProductId, openOnly, { sort, limit, offset, sortBy }, mode, productionDateStart, productionDateEnd)
        )
    }

    // @Get("facility/{facilityId}/all-quotes")
    // public async listAllQuoteOrders(
    //     @Path() facilityId: string,
    //     @Query() semiProductId?: string,
    //     @Query() sort?: 'ASC' | 'DESC',
    //     @Query() sortBy?: string,
    //     @Query() limit?: number,
    //     @Query() offset?: number
    // ): Promise<ApiResponse<PaginatedList<ChainStockOrder>>> {
    //     return handleApiResponse(
    //         this.chaincode.listOpenQuoteOrders(facilityId, semiProductId, false, { sort, limit, offset, sortBy })
    //     )
    // }

}