import express from "express";
import { Controller, Post, Route, Security, Tags, Request  } from "tsoa";
import { Inject } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";

@Security("jwt")
@Tags('Migrations')
@Route("chain-api/data/migrations")
export class MigrationsController extends Controller {

    @Inject
    private chaincode: ChainCode;

    @Post('fix-quote-company-id')
    public async fixQuoteCompanyId(
        @Request() request: express.Request,
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.migrateQuoteStockOrdersByAddingOrganizationId()
        )
    }

    @Post('fix-all-stock-order-company-id')
    public async fixAllStockOrderCompanyId(
        @Request() request: express.Request,
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.migrateAllStockOrdersByAddingOrganizationId()
        )
    }

}