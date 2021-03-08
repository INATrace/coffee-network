import express from "express";
import { Body, Controller, Get, Path, Post, Query, Route, Security, Tags, Request  } from "tsoa";
import { Inject, Singleton } from "typescript-ioc";
import { ChainCode } from "../contracts/chaincode";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainUser } from "../models/chain/ChainUser";
import { PaginatedList } from "../models/chain/PaginatedList";

@Singleton
@Security("jwt")
@Tags('User')
@Route("chain-api/data/user")
export class UserController extends Controller {

    @Inject
    private chaincode: ChainCode;

    ////////////////////////////////////////////////
    /// USER
    ////////////////////////////////////////////////

    /**
     * Paginated list of users.
     * @param sort sort order ASC or DESC
     * @param limit query limit
     * @param offset query offset
     */
    @Get("list")
    public async listUsers(
        @Request() request: express.Request,
        @Query() sort?: 'ASC' | 'DESC',
        @Query() limit?: number,
        @Query() offset?: number
    ): Promise<ApiResponse<PaginatedList<ChainUser>>> {
        return handleApiResponse(
            this.chaincode.listUsers({sort, limit, offset})
        )
    }

    /**
     * Fetches user by its _id.
     * @param dbId database id of the product
     */
    @Get("{dbId}")
    public async getUser(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainUser>> {
        return handleApiResponse(
            this.chaincode.getUser(dbId)
        )
    }

    /**
     * Returns a list of users matching to the list of external ids.
     * Warning: Id lists and response list do not necessary match in length.
     * if invalid external id is provided in the request's list the response list is shorter.
     * @param requestBody list of external ids
     */
    @Post('external/list')
    public async usersForIds(
        @Request() request: express.Request,
        @Body() requestBody: number[]
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.usersForIds(requestBody)
        )
    }

    /**
     * Returns user according to external database id.
     * @param linkId external database product id
     */
    @Get("external/{linkId}")
    public async getUserByAFId(
        @Request() request: express.Request,
        @Path() linkId: number,
    ): Promise<ApiResponse<ChainUser>> {
        return handleApiResponse(
            this.chaincode.getUserByUserId(linkId)
        )
    }

    /**
     * Inserts or updates a user. When inserting fields _id, _rev and docType should not be present.
     * @param requestBody
     */
    @Post('')
    public async postUser(
        @Request() request: express.Request,
        @Body() requestBody: ChainUser
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.insertUser(requestBody)
        )
    }

}