import express from "express";
import { Body, Controller, Get, Path, Post, Query, Route, Security, Tags, Request  } from "tsoa";
import { Inject } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainSemiProduct } from "../models/chain/ChainSemiProduct";
import { PaginatedList } from "../models/chain/PaginatedList";

@Security("jwt")
@Tags('Semi product')
@Route("chain-api/data/semi-product")
export class SemiProductController extends Controller {

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
    public async listSemiProducts(
        @Request() request: express.Request,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainSemiProduct>>> {
        return handleApiResponse(
            this.chaincode.listSemiProducts({sort, limit, offset})
        )
    }

    /**
     * Fetches semi product by its _id.
     * @param dbId database _id of the product
     */
    @Get("{dbId}")
    public async getSemiProduct(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainSemiProduct>> {
        return handleApiResponse(
            this.chaincode.getSemiProduct(dbId)
        )
    }

    /**
     * Inserts or updates a semi product. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('')
    public async postSemiProduct(
        @Request() request: express.Request,
        @Body() requestBody: ChainSemiProduct
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertSemiProduct(requestBody)
        )
    }

    /**
     * Paginated list of semi-products for product.
     * @param productId
     * @param isBuyable
     * @param isSKU (at producer)
     * @param isSKUEndCustomer (at end customer)
     * @param sort
     * @param limit
     * @param offset
     */
    @Get("list/product/{productId}")
    public async listSemiProductsForProduct (
        @Request() request: express.Request,
        @Path() productId: string,
        @Query() isBuyable?: boolean,
        @Query() isSKU?: boolean,
        @Query() isSKUEndCustomer?: boolean,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainSemiProduct>>> {
        return handleApiResponse(
            this.chaincode.listSemiProductsForProduct(productId, isBuyable, isSKU, isSKUEndCustomer, {sort, limit, offset})
        )
    }

    /**
     * Deletes semi-product.
     * @param requestBody
     */
    @Post('delete')
    public async deleteSemiProduct(
        @Request() request: express.Request,
        @Body() requestBody: ChainSemiProduct
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteSemiProduct(requestBody)
        )
    }


}