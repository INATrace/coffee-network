import express from "express";
import { Body, Controller, Get, Path, Post, Query, Route, Security, Tags, Request  } from "tsoa";
import { Inject, Singleton } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainProduct } from "../models/chain/ChainProduct";
import { PaginatedList } from "../models/chain/PaginatedList";

@Singleton
@Security("jwt")
@Tags('Product')
@Route("chain-api/data/product")
export class ProductController extends Controller {

    @Inject
    private chaincode: ChainCode;

    ////////////////////////////////////////////////
    /// PRODUCT
    ////////////////////////////////////////////////

    /**
     * Paginated list of product.
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list")
    public async listProducts(
        @Request() request: express.Request,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainProduct>>> {
        return handleApiResponse(
            this.chaincode.listProducts({sort, limit, offset})
        )
    }

    /**
     * Paginated list of products for organization.
     * @param organizationId
     * @param sort
     * @param limit
     * @param offset
     */
    @Get("list/organization/{organizationId}")
    public async listProductsForOrganization(
        @Request() request: express.Request,
        @Path() organizationId: string,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainProduct>>> {
        return handleApiResponse(
            this.chaincode.listProductsForOrganization(organizationId, {sort, limit, offset})
        )
    }

    /**
     * Fetches product by its _id.
     * @param dbId database _id of the product
     */
    @Get("{dbId}")
    public async getProduct(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainProduct>> {
        return handleApiResponse(
            this.chaincode.getProduct(dbId)
        )
    }

    /**
     * Returns product according to external database id.
     * @param linkId external database product id
     */
    @Get("external/{linkId}")
    public async getProductByAFId(
        @Request() request: express.Request,
        @Path() linkId: number,
    ): Promise<ApiResponse<ChainProduct>> {
        return handleApiResponse(
            this.chaincode.getProductByProductId(linkId)
        )
    }

    /**
     * Returns a list of products matching to the list of external ids.
     * Warning: Id lists and response list do not necessary match in length.
     * if invalid external id is provided in the request's list the response list is shorter.
     * @param requestBody list of external ids
     */
    @Post('external/list')
    public async productsForIds(
        @Request() request: express.Request,
        @Body() requestBody: number[]
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.productsForIds(requestBody)
        )
    }

    /**
     * Inserts or updates product. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('')
    public async postProduct(
        @Request() request: express.Request,
        @Body() requestBody: ChainProduct
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertProduct(requestBody)
        )
    }

    /**
     * Deletes product.
     * @param requestBody
     */
    @Post('delete')
    public async deleteProduct(
        @Request() request: express.Request,
        @Body() requestBody: ChainProduct
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.deleteProduct(requestBody)
        )
    }

}