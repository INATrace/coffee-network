import express from "express";
import { Controller, Get, Path, Route, Tags, Post, Body, Security, Request } from "tsoa";
import { Inject } from "typescript-ioc";
import { SystemConf } from "../contracts/systemconf";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainCode } from "../contracts/chaincode";
import { ChainOrganization } from "../models/chain/ChainOrganization";

@Security("jwt", ["ADMIN"])
@Tags('System')
@Route("chain-api/system")
export class SystemController extends Controller {

    @Inject
    private systemConf: SystemConf;

    @Inject
    private chaincode: ChainCode;

    // @Get('create-database/{dbname}')
    // public async createDatabase(
    //     @Path() dbname: string
    // ): Promise<ApiResponse<any>> {
    //     return this.systemConf.createDatabase(dbname).then(
    //         (resp: DatabaseCreateResponse) => {
    //             if (resp.ok) return new ApiResponse<any>(null)
    //             return new ApiResponse<any>(null, 'ERROR', resp.error)
    //         },
    //         (reason: any) => new ApiResponse<any>(null, 'ERROR', '' + reason)
    //     )
    // }

    constructor() {
        super()
    }

    // @Get('create-databases')
    // public async createDatabases(
    //     @Request() request: express.Request,): Promise<ApiResponse<any>> {
    //     return handleApiResponse(
    //         this.systemConf.createDatabases()
    //     )
    // }

    // @Get('delete-databases/{password}')
    // public async deleteDatabases(
    //     @Request() request: express.Request,
    //     @Path() password: string,
    // ): Promise<ApiResponse<any>> {
    //     return handleApiResponse(
    //         this.systemConf.deleteDatabases(password)
    //     )
    // }

    @Get('create-indices')
    public async createIndices(
        @Request() request: express.Request,
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.systemConf.createIndices()
        )
    }

    // @Get('prefilldb')
    // public async prefillDB(
    //     @Request() request: express.Request,): Promise<ApiResponse<any>> {
    //     return handleApiResponse(
    //         this.systemConf.prefillDB()
    //     )
    // }

    @Get('initialize')
    public async initialize(
        @Request() request: express.Request,): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.systemConf.initialize()
        )
    }

    @Get('blockchain-initialize')
    public async initializeBlockchain(
        @Request() request: express.Request,): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.systemConf.initializeBlockchain()
        )
    }

    @Get('blockchain-test')
    public async testBlockchain(
        @Request() request: express.Request,): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.systemConf.testBlockchain()
        )
    }

    @Get('check-connection/{date}')
    public async checkConnection(
        @Request() request: express.Request,
        @Path() date: string,
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.checkConnection()
        )
    }

    ////////////////////////////////////////////////
    /// TEST
    ////////////////////////////////////////////////

    @Get('test')
    public async test(
        @Request() request: express.Request,
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.test()
        )
    }

    @Post('bc-organization-test')
    public async postOrganization(
        @Request() request: express.Request,
        @Body() requestBody: ChainOrganization
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.systemConf.testOrganization(requestBody._id, requestBody)
        )
    }

    @Get("bc-organization-test/{dbId}")
    public async getOrganization(
        @Request() request: express.Request,
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainOrganization>> {
        return handleApiResponse(
            this.systemConf.getObject(dbId)
        )
    }

    @Get('copy-db')
    public async copyDB(
        @Request() request: express.Request,
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.copyDB()
        )
    }

}