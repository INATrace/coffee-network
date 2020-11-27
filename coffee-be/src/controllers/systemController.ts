import { Controller, Get, Path, Route, Tags, Post, Body } from "tsoa";
import { Inject } from "typescript-ioc";
import { SystemConf } from "../contracts/systemconf";
import { ApiResponse, handleApiResponse } from "../models/chain/ApiResponse";
import { ChainCode } from "../contracts/chaincode";
import { ChainOrganization } from "../models/chain/ChainOrganization";

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

    @Get('create-databases')
    public async createDatabases(): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.systemConf.createDatabases()
        )
    }

    @Get('delete-databases/{password}')
    public async deleteDatabases(
        @Path() password: string,
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.systemConf.deleteDatabases(password)
        )
    }

    @Get('create-indices')
    public async createIndices(): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.systemConf.createIndices()
        )
    }

    @Get('prefilldb')
    public async prefillDB(): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.systemConf.prefillDB()
        )
    }

    @Get('initialize')
    public async initialize(): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.systemConf.initialize()
        )
    }

    @Get('blockchain-initialize')
    public async initializeBlockchain(): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.systemConf.initializeBlockchain()
        )
    }

    @Get('blockchain-test')
    public async testBlockchain(): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.systemConf.testBlockchain()
        )
    }

    ////////////////////////////////////////////////
    /// TEST
    ////////////////////////////////////////////////

    @Get('test')
    public async test(): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.chaincode.test()
        )
    }

    @Post('bc-organization-test')
    public async postOrganization(
        @Body() requestBody: ChainOrganization
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.systemConf.testOrganization(requestBody._id, requestBody)
        )
    }

    @Get("bc-organization-test/{dbId}")
    public async getOrganization(
        @Path() dbId: string,
    ): Promise<ApiResponse<ChainOrganization>> {
        return handleApiResponse(
            this.systemConf.getObject(dbId)
        )
    }



}