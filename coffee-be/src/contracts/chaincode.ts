import { DocumentListParams } from "nano";
import { Inject, Singleton } from "typescript-ioc";
import { v4 as uuid } from 'uuid';
import { getResponseValue } from "../models/chain/ApiResponse";
import { ChainActionType, ChainActionTypeDB } from "../models/chain/ChainActionType";
import { ChainBulkPayment, ChainBulkPaymentDB } from "../models/chain/ChainBulkPayment";
import { ChainCompanyCustomer, ChainCompanyCustomerDB } from "../models/chain/ChainCompanyCustomer";
import { ChainDocumentRequirement, ChainDocumentRequirementDB, FieldDefinition } from "../models/chain/ChainDocumentRequirement";
import { ChainDocumentRequirementList, ChainDocumentRequirementListDB } from "../models/chain/ChainDocumentRequirementList";
import { ChainFacility, ChainFacilityDB } from "../models/chain/ChainFacility";
import { ChainFacilityType, ChainFacilityTypeDB } from "../models/chain/ChainFacilityType";
import { ChainFileInfo, ChainFileInfoDB } from "../models/chain/ChainFileInfo";
import { ChainGradeAbbreviation, ChainGradeAbbreviationDB } from "../models/chain/ChainGradeAbbreviation";
import { ChainHistory } from "../models/chain/ChainHistory";
import { ChainMeasureUnitType, ChainMeasureUnitTypeDB } from "../models/chain/ChainMeasureUnitType";
import { ChainOrderAction, ChainOrderActionDB } from "../models/chain/ChainOrderAction";
import { ChainOrderEvidenceType, ChainOrderEvidenceTypeDB } from "../models/chain/ChainOrderEvidenceType";
import { ChainOrganization, ChainOrganizationDB } from "../models/chain/ChainOrganization";
import { ChainPayment, ChainPaymentDB } from "../models/chain/ChainPayment";
import { ChainProcessingAction, ChainProcessingActionDB, DocTypeIdsWithRequired } from "../models/chain/ChainProcessingAction";
import { ChainProcessingEvidenceType, ChainProcessingEvidenceTypeDB } from "../models/chain/ChainProcessingEvidenceType";
import { ChainProcessingOrder, ChainProcessingOrderDB } from "../models/chain/ChainProcessingOrder";
import { ChainProduct, ChainProductDB } from "../models/chain/ChainProduct";
import { ChainProductOrder, ChainProductOrderDB } from "../models/chain/ChainProductOrder";
import { ChainSemiProduct, ChainSemiProductAvailability, ChainSemiProductDB } from "../models/chain/ChainSemiProduct";
import { B2CHistoryItem, B2CHistoryTimeline, ChainStockOrder, ChainStockOrderDB, KeyAggregates, ProcessingOrderHistory, QuoteRequirementConfirmation, QuoteRequirementConfirmationsWithMetaData, StockOrderAgg, StockOrderAggregates, WeightedAggregate } from "../models/chain/ChainStockOrder";
import { ChainTransaction, ChainTransactionDB } from "../models/chain/ChainTransaction";
import { ChainUser, ChainUserDB } from "../models/chain/ChainUser";
import { ChainUserCompanyCustomerCounter, ChainUserCompanyCustomerCounterDB } from "../models/chain/ChainUserCompanyCustomerCounter";
import { ChainUserCustomer, ChainUserCustomerDB } from "../models/chain/ChainUserCustomer";
import { DBDocument, DocType, ViewFilterParams } from "../models/chain/DBDocument";
import { PaginatedList } from "../models/chain/PaginatedList";
import { BlockchainService } from "../services/blockchainService";
import { DatabaseService } from "../services/databaseService";
import { ElasticsearchService } from "../services/elasticsearchService";
import { HistoryCacheService } from "../services/historyCacheService";


const HISTORY_CUTTOFF_SIZE = 2000000
const HISTORY_CUTOFF_DEPTH = 4  // cut on depth - 1

export interface StockOrderFilters {
    showPurchaseOrderOpenBalanceOnly?: boolean;
    purchaseOrderOnly?: boolean;
    availableOnly?: boolean;
    semiProductId?: string;
    wayOfPayment?: string;
    womensCoffee?: boolean;
    companyCustomerId?: string;
    openOnly?: boolean;
    productionDateStart?: string;
    productionDateEnd?: string;
    query?: string;
}

function queryMin(query: string) {
    return query && query.length > 0
        ? query
        : null
}

function queryMax(query: string) {
    return query && query.length > 0
        ? query + "\ufff0"
        : {}
}

function addQueryKeys(query: string, startkeyDef: any[], endkeyDef: any[]) {
    if (query && query.length > 0) {
        const pos = startkeyDef.length
        const q = query.toLowerCase()
        startkeyDef.push(q);
        endkeyDef.splice(pos, 0, q + "\ufff0")
    }
}

function addKeys(key: any, startkeyDef: any[], endkeyDef: any[]) {
    const pos = startkeyDef.length
    startkeyDef.push(key);
    endkeyDef.splice(pos, 0, key)
}

function getNestedObjectRec<T>(obj: any, path: string[]): T {
    if (!path || path.length === 0) throw Error("Invalid nested path.")
    if (!obj) return null
    if (path.length === 1) return obj[path[0]] as T
    return getNestedObjectRec(obj[path[0]], path.slice(1)) as T
}

function setNestedObjectRec(obj: any, path: string[], value: any) {
    if (!path || path.length === 0) throw Error("Invalid nested path.")
    if (path.length === 1) {
        obj[path[0]] = value
        return
    }
    setNestedObjectRec(obj[path[0]], path.slice(1), value)
}

const codeToFieldInfoList = [
    {
        id: 'CUSTOMER',
        field: 'consumerCompanyCustomer',
    },
    {
        id: 'PRICE_PER_UNIT',
        field: 'pricePerUnit',
    },
    {
        id: 'GRADE',
        field: 'gradeAbbreviation',
    },
    {
        id: 'LOT_EXPORT_NUMBER',
        field: 'lotNumber',
    },
    {
        id: 'SCREEN_SIZE',
        field: 'screenSize',
    },
    {
        id: 'LOT_LABEL',
        field: 'lotLabel',
    },
    {
        id: 'START_OF_DRYING',
        field: 'startOfDrying',
    },
    {
        id: 'CLIENT_NAME',
        field: 'clientId',
        valueCallback: (fieldValue: any) => {
            return {
                id: fieldValue.id,
                name: fieldValue.name,
                status: 'ACTIVE'
            }
        }
    },
    {
        id: 'CERTIFICATES_IDS',
        field: 'certificates',
    },
    {
        id: 'TRANSACTION_TYPE',
        field: 'actionType',
    },
    {
        id: 'FLAVOUR_PROFILE',
        field: 'flavourProfile',
    },
    {
        id: 'REQUIRED_WOMENS_COFFEE',
        field: 'requiredWomensCoffee',
    },
    {
        id: 'REQUIRED_GRADE',
        field: 'requiredQuality',
    },
    {
        id: 'TRIGGER_ORDERS',
        field: 'triggerOrders',
    },
    {
        id: 'WOMENS_COFFEE',
        field: 'womenShare',
    },
    {
        id: 'COMMENT',
        field: 'comment',
    },
    {
        id: 'PRICE_FOR_OWNER',
        field: 'pricePerUnitForOwner',
    },
    {
        id: 'PRICE_FOR_BUYER',
        field: 'pricePerUnitForBuyer',
    },
    {
        id: 'EXC_RATE_AT_BUYER',
        field: 'exchangeRateAtBuyer',
    },
    {
        id: 'PRICE_FOR_END_CUSTOMER',
        field: 'pricePerUnitForEndCustomer',
    },
    {
        id: 'EXC_RATE_AT_END_CUSTOMER',
        field: 'exchangeRateAtEndCustomer',
    },
    {
        id: 'CUPPING_RESULT',
        field: 'cuppingResult',
    },
    {
        id: 'CUPPING_GRADE',
        field: 'cuppingGrade',
    },
    {
        id: 'CUPPING_FLAVOUR',
        field: 'cuppingFlavour',
    },
    {
        id: 'ROASTING_DATE',
        field: 'roastingDate',
    },
    {
        id: 'ROASTING_PROFILE',
        field: 'roastingProfile',
    },
    {
        id: 'SHIPPER_DETAILS',
        field: 'shipperDetails',
    },
    {
        id: 'CARRIER_DETAILS',
        field: 'carrierDetails',
    },
    {
        id: 'PORT_OF_LOADING',
        field: 'portOfLoading',
    },
    {
        id: 'PORT_OF_DISCHARGE',
        field: 'portOfDischarge',
    },
    {
        id: 'LOCATION_OF_END_DELIVERY',
        field: 'locationOfEndDelivery',
    },
    {
        id: 'SHIPPED_AT_DATE_FROM_ORIGIN_PORT',
        field: 'shippedAtDateFromOriginPort',
    },
    {
        id: 'ARRIVED_AT_DATE_TO_DESTINATION_PORT',
        field: 'arrivedAtDateToDestinationPort',
    },
]


const fieldIDToFieldNameDict: any = {}
codeToFieldInfoList.forEach(x => {
    fieldIDToFieldNameDict[x.id] = x
})

// {
//     'GRADE': 'gradeAbbreviation',
//     'LOT_EXPORT_NUMBER': 'lotNumber',
//     'PRICE_PER_UNIT': 'pricePerUnit',
//     'SCREEN_SIZE': 'screenSize',
//     'LOT_LABEL': 'lotLabel',
//     'START_OF_DRYING': 'startOfDrying',
//     'CLIENT_NAME': 'client',
//     'CERTIFICATES_IDS': 'certificates',
//     'TRANSACTION_TYPE': 'actionType',
//     'FLAVOUR_PROFILE': 'flavourProfile',
//     'WOMENS_COFFEE': 'womenShare',
//     'COMMENT': 'comment'
// }


@Singleton
// @Factory(() => new ChainCode())
export class ChainCode {
    @Inject
    public dbService: DatabaseService

    @Inject
    public elasticsearchService: ElasticsearchService

    @Inject
    public bcService: BlockchainService

    @Inject
    public historyCache: HistoryCacheService

    timestamp(obj: any, leaveAsIs = false) {
        if (leaveAsIs) return null
        return {
            created: (obj.created ? obj.created : (new Date()).toISOString()) as string,
            lastChange: (new Date()).toISOString()
        }
    }

    get isBlockchainApp() {
        return process.env.APP_MODE === 'BLOCKCHAIN'
    }

    get isNodeApp() {
        return process.env.APP_MODE === 'NODE'
    }

    extractKey(obj: any) {
        if (obj.dbKey) return obj.dbKey
        if (obj._id) return obj._id
        return null
    }

    extractOrGenerateKey(obj: any, strict = true) {
        if (obj.dbKey) return { dbKey: obj.dbKey }
        if (!strict && obj._id) return { dbKey: obj._id }
        return { dbKey: uuid() }
    }

    mode(obj: any) {
        if (obj.mode__) {
            const mode = obj.mode__
            if (['insert', 'update'].indexOf(mode) >= 0) return mode
            if (mode === 'insert_as_is') return 'insert'
        }
        const key = this.extractKey(obj)
        if (key) return "update"
        return "insert"
    }

    prepareForSave(obj: any): any {
        const leaveAsIs = obj.mode__ === 'insert_as_is'
        const tmp = {
            ...obj,
            ...this.timestamp(obj, leaveAsIs),
            ...this.extractOrGenerateKey(obj, false)
        }
        // strip hyperledger specific keys
        delete tmp["~version"]
        delete tmp.mode__
        delete tmp._id
        delete tmp._rev
        delete tmp.mode__
        return tmp
    }

    async insertOrUpdateBC(asset: any) {
        const mode = this.mode(asset);  // should be called before prepareForSave
        const obj = this.prepareForSave(asset)
        const key = obj.dbKey
        await this.bcService.manageState(mode, obj)
        return await this.bcService.getFromStorage(key);
    }

    async deleteBC(asset: any) {
        return await this.bcService.manageState("delete", "{}", this.extractKey(asset))
    }


    applyRevFromLastVersion(item: any, lastVersionItem: any) {
        item._rev = lastVersionItem._rev
    }

    docTypeHierarchy: string[] = [
        // "c_process_evidence_type",
        // "c_grade_abbreviation",
        // "c_measure_unit_type",
        // "c_action_type",
        // "c_facility_type",
        // "user_company_customer_counter",
        // "user",
        // "organization",
        // "product",
        // "semi_product",
        // "facility",
        // "process_action",
        // "user_customer",
        // "company_customer",
        // "processing_order",
        "stock_order",
        // "payment",
        // "transaction",
        // "order"
    ]

    docTypeInsertMethods: any = {
        "c_process_evidence_type": (obj: any) => this.insertProcessingEvidenceType(obj),
        "c_grade_abbreviation": (obj: any) => this.insertGradeAbbreviation(obj),
        "c_measure_unit_type": (obj: any) => this.insertMeasureUnitType(obj),
        "c_action_type": (obj: any) => this.insertActionType(obj),
        "c_facility_type": (obj: any) => this.insertFacilityType(obj),
        "user_company_customer_counter": (obj: any) => this.insertFacilityType(obj),
        "user": (obj: any) => this.insertUser(obj),
        "organization": (obj: any) => this.insertOrganization(obj),
        "product": (obj: any) => this.insertProduct(obj),
        "semi_product": (obj: any) => this.insertSemiProduct(obj),
        "facility": (obj: any) => this.insertFacility(obj),
        "process_action": (obj: any) => this.insertProcessingAction(obj),
        "user_customer": (obj: any) => this.insertUserCustomer(obj),
        "company_customer": (obj: any) => this.insertCompanyCustomer(obj),
        "stock_order": (obj: any) => this.insertStockOrder(obj),
        "processing_order": (obj: any) => this.insertProcessingOrder(obj),
        "payment": (obj: any) => this.insertPayment(obj),
        "transaction": (obj: any) => this.insertTransaction(obj),
        "order": (obj: any) => this.insertOrder(obj)
    }

    prepareObjectForMigration(value: any) {
        const newVal = {
            ...value
        }
        newVal.mode__ = "insert_as_is"
        return newVal
    }

    public async copyDB() {
        let offset = 0;
        let count = -1;
        const limit = 3000;
        let allObjects: any[] = []
        while (count < 0 || offset < count) {
            // console.log("XX", offset, limit, count, allObjects.length)
            const res = await this.dbService.writeDatabase.list({ limit, offset, include_docs: true } as DocumentListParams)
            count = res.total_rows
            offset += limit
            // console.log("YY", offset, limit, count, res.rows.length, allObjects.length)
            allObjects = [...allObjects, ...(res.rows.map(x => x.doc).filter(x => !x._id.startsWith("_")))]
            // allObjects = [...allObjects, ...(res.rows.map(x => {
            //     return x.doc._id
            // }))]
        }
        const docTypeMap = new Map<string, any>()
        allObjects.forEach(x => {
            const docType = x.docType
            const value = docTypeMap.get(docType) || []
            value.push(x)
            docTypeMap.set(docType, value)
        })
        let responses: any[] = []
        for (const docType of this.docTypeHierarchy) {
            const values = docTypeMap.get(docType) as any[]
            const insertFunction = this.docTypeInsertMethods[docType]
            const t0 = (new Date()).getTime()

            let subOffset = 0;
            const subLimit = 1;
            while (subOffset < values.length) {
                const vals = values.slice(subOffset, subOffset + subLimit)
                const resps = await Promise.all(vals.map(async (value) => {
                    const valueFix = this.prepareObjectForMigration(value)
                    let status = "DONE"
                    console.log(valueFix._id, valueFix.docType, docType, insertFunction)
                    const res = await insertFunction(valueFix).catch((e: any) => {
                        if (e.responses && e.responses.length > 0) {
                            status = e.responses[0].response.message
                        } else {
                            status = '' + e
                        }

                    })
                    return {
                        id: value._id,
                        response: status
                    }
                }))
                const t1 = (new Date()).getTime()
                console.log("OK", t1 - t0)
                responses = [...responses, ...resps]
                subOffset += subLimit;
                console.log("OFFSET:", subOffset, vals.length, values.length)
                // if(subOffset > 50)
                // break;
            }
            // for (const value of values) {
            //     // SEQUENTIAL
            //     const valueFix = this.prepareObjectForMigration(value)
            //     const t0 = (new Date()).getTime()
            //     let status = "DONE"
            //     console.log(valueFix._id, valueFix.docType, docType, insertFunction)
            //     // try {
            //         const res = await insertFunction(valueFix).catch((e: any) => {
            //             console.log("ERRRRRRRORRR", e)
            //             status = e.responses[0].response.message
            //             // return e.message
            //             // let message = e.message
            //             // console.log(typeof message)
            //             // if(message.indexOf("Object already exists. Insert not possible") >= 0) console.log("exists")
            //             // else {
            //             //     console.log(e.message)
            //             // }
            //             //
            //         })
            //     // } catch (e) {
            //     //     console.log("2ROR")
            //     // }
            //     const t1 = (new Date()).getTime()
            //     console.log("OK", t1 - t0, status)
            //     responses.push({
            //         id: value._id,
            //         response: status
            //     })
            // }
        }
        return responses
    }

    //////////////////////////////////////////////////////////
    /// ORGANIZATION
    //////////////////////////////////////////////////////////

    public async insertOrganization(organization: ChainOrganization) {
        if (this.isNodeApp) {
            const newOrganization = { ...organization, ...this.timestamp(organization) } as ChainOrganization
            const org = new ChainOrganizationDB(newOrganization);
            return await getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return await this.insertOrUpdateBC(organization)
        }
    }

    public async getOrganizationByCompanyId(id: number): Promise<ChainOrganization> {
        const org = new ChainOrganizationDB()
        return getResponseValue(org.readByLinkId(this.dbService, id))
    }

    public async listOrganizations(filters?: ViewFilterParams): Promise<PaginatedList<ChainOrganization>> {
        const org = new ChainOrganizationDB()
        return org.readAll(this.dbService, null, null, filters)
    }

    public async organizationsForIds(ids: number[]): Promise<ChainOrganization[]> {
        const org = new ChainOrganizationDB()
        return org.readForLinkIds(this.dbService, ids)
    }

    public async getOrganization(id: string): Promise<ChainOrganization> {
        const org = new ChainOrganizationDB()
        return getResponseValue(org.read(this.dbService, id))
    }

    public async deleteOrganization(organization: ChainOrganization): Promise<any> {
        if (this.isNodeApp) {
            const org = new ChainOrganizationDB(organization);
            const response = await this.listFacilitiesForOrganization(organization._id, null, { limit: 1, offset: 0 })
            if (response.count > 0) throw Error("Cannot delete organization. Organization contains facilities.")
            const response2 = await this.listProductsForOrganization(organization._id, { limit: 1, offset: 0 })
            if (response2.count > 0) throw Error("Cannot delete organization. Organization contains products.")
            const response3 = await this.listUserCustomersForOrganization(organization._id, null, { limit: 1, offset: 0 })
            if (response3.count > 0) throw Error("Cannot delete organization. Organization contains user customers.")
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return await this.deleteBC(organization)
        }
    }

    //////////////////////////////////////////////////////////
    /// FACILITY
    //////////////////////////////////////////////////////////

    public async listFacilities(filters?: ViewFilterParams): Promise<PaginatedList<ChainFacility>> {
        const org = new ChainFacilityDB()
        return org.readAll(this.dbService, null, null, filters)
    }

    public insertFacility(facility: ChainFacility) {
        const newFacility = { ...facility, ...this.timestamp(facility) } as ChainFacility
        if (!newFacility.semiProducts) {
            newFacility.semiProductIds = [];
        } else {
            newFacility.semiProductIds = newFacility.semiProducts.map(x => x._id)
        }
        delete newFacility.semiProducts
        if (this.isNodeApp) {
            const org = new ChainFacilityDB(newFacility);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(newFacility)
        }
    }

    public async getFacility(id: string, writeDatabase = false): Promise<ChainFacility> {
        const org = new ChainFacilityDB()
        const facility = await getResponseValue(org.read(this.dbService, id, writeDatabase));
        const sp = new ChainSemiProductDB()
        facility.semiProducts = await sp.readForIds(this.dbService, facility.semiProductIds)
        if (facility.organizationId) {
            facility.organization = await this.getOrganization(facility.organizationId);
        }
        return facility;
    }

    public async listFacilitiesForOrganization(organizationId: string, query?: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainFacility>> {
        const org = new ChainFacilityDB()
        return org.readAll(this.dbService, 'organization_id_name', 'organization_id_name', filters, [organizationId, queryMin(query)], [organizationId, queryMax(query)])
    }

    public async listFacilitiesForOrganizationAndSemiProduct(organizationId: string, semiProductId: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainFacility>> {
        const desc: boolean = filters && filters.sort === 'DESC' ? true : false
        const response = await this.dbService.readDatabase.view('customs', 'facilities_by_organization_and_semi_product', {
            key: [organizationId, semiProductId],
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: filters && filters.limit ? filters.limit : undefined,
            skip: filters && filters.offset ? filters.offset : undefined
        })
        const countResponse = await this.dbService.readDatabase.view('customs', 'facilities_by_organization_and_semi_product', {
            key: [organizationId, semiProductId],
            sorted: true,
            descending: desc,
        })
        const count = countResponse.rows && countResponse.rows.length;
        const items = response.rows.map(doc => (new DBDocument<ChainFacility>((doc as any).doc)).value as ChainFacility)
        return new PaginatedList<ChainFacility>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)
    }


    public async listSellingFacilitiesForOrganizationAndSemiProduct(organizationId: string, semiProductId: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainFacility>> {
        const semiProduct = await this.getSemiProduct(semiProductId);
        const organization = await this.getOrganization(organizationId);
        const product = await this.getProduct(semiProduct.productId)
        const allRoles = product.organizationRoles;
        const organizationRoles = allRoles.filter(x => x.companyId === organization.id)
        const facilities = []
        for (const role of organizationRoles) {
            if (role.role === 'BUYER') {
                const candidates = allRoles.filter(x => x.role === 'OWNER');
                for (const candidate of candidates) {
                    const org = await this.getOrganizationByCompanyId(candidate.companyId)
                    const facs = await this.listFacilitiesForOrganization(org._id)
                    for (const fac of facs.items) {
                        if (fac.isPublic && fac.semiProductIds.some(semi => semi === semiProductId)) {
                            facilities.push(fac)
                        }
                    }
                }
            }
            if (role.role === 'OWNER') {
                const candidates = allRoles.filter(x => x.role === 'PRODUCER');
                for (const candidate of candidates) {
                    const org = await this.getOrganizationByCompanyId(candidate.companyId)
                    const facs = await this.listFacilitiesForOrganization(org._id)
                    for (const fac of facs.items) {
                        if (fac.isPublic && fac.semiProductIds.some(semi => semi === semiProductId)) {
                            facilities.push(fac)
                        }
                    }
                }
            }
        }
        await this.extractForIds<ChainOrganization>(facilities, new ChainOrganizationDB(), 'organizationId', 'organization', { id: null, entityType: null, name: null })
        return new PaginatedList<ChainFacility>(facilities, facilities.length, filters ? filters.limit : undefined, filters ? filters.offset : undefined)
    }



    public async listOfCollectingFacilitiesForOrganization(organizationId: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainFacility>> {
        const desc: boolean = filters && filters.sort === 'DESC' ? true : false
        const response = await this.dbService.readDatabase.view('customs', 'collecting_facilities_by_organization', {
            key: [organizationId],
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: filters && filters.limit ? filters.limit : undefined,
            skip: filters && filters.offset ? filters.offset : undefined
        })
        const countResponse = await this.dbService.readDatabase.view('customs', 'collecting_facilities_by_organization', {
            key: [organizationId],
            sorted: true,
            descending: desc,
        })
        const count = countResponse.rows && countResponse.rows.length;
        const items = response.rows.map(doc => (new DBDocument<ChainFacility>((doc as any).doc)).value as ChainFacility)
        return new PaginatedList<ChainFacility>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)
    }

    public async deleteFacility(facility: ChainFacility): Promise<any> {
        if (this.isNodeApp) {
            const org = new ChainFacilityDB(facility);
            const orders = await this.listAllStockOrdersInFacility(facility._id, {}, { limit: 1, offset: 0 })
            if (orders.count > 0) throw Error("Cannot delete facility. Facility contains stock orders.")
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return await this.deleteBC(facility)
        }
    }


    //////////////////////////////////////////////////////////
    /// PRODUCT
    //////////////////////////////////////////////////////////

    public async listProducts(filters?: ViewFilterParams): Promise<PaginatedList<ChainProduct>> {
        const org = new ChainProductDB()
        return org.readAll(this.dbService, null, null, filters)
    }

    public async insertProduct(product: ChainProduct) {
        const newProduct = { ...product, ...this.timestamp(product) } as ChainProduct;
        if (newProduct.companyId != null) {
            const organization = await this.getOrganizationByCompanyId(newProduct.companyId);
            console.log("organiz", organization)
            newProduct.organizationId = organization._id
        }
        if (this.isNodeApp) {
            const org = new ChainProductDB(newProduct);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(newProduct)
        }
    }

    public async getProductByProductId(id: number): Promise<ChainProduct> {
        const prod = new ChainProductDB()
        const product = await getResponseValue(prod.readByLinkId(this.dbService, id))
        if (product.companyId) {
            const org = new ChainOrganizationDB();
            const organization = await this.getOrganizationByCompanyId(product.companyId);
            product.organization = organization;
        }
        return product;
    }

    public async getProduct(id: string): Promise<ChainProduct> {
        const org = new ChainProductDB()
        return getResponseValue(org.read(this.dbService, id))
    }

    public stripedProduct(product: ChainProduct): ChainProduct {
        // return product
        if (!product) return null
        return {
            _id: product._id,
            id: product.id,
            name: product.name
        } as ChainProduct
    }

    public async productsForIds(ids: number[]): Promise<ChainProduct[]> {
        const prod = new ChainProductDB()
        const products = await prod.readForLinkIds(this.dbService, ids);
        const org = new ChainOrganizationDB();
        const companyIds = products.map(x => x.companyId);
        const companies = await org.readForLinkIds(this.dbService, companyIds);
        const map = new Map<number, ChainOrganization>();
        companies.forEach(company => map.set(company.id, company));
        products.forEach(product => { product.organization = map.get(product.companyId) });
        return products;
    }

    public async listProductsForOrganization(organizationId: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainProduct>> {
        const org = new ChainProductDB()
        return org.readAll(this.dbService, 'organization_id', 'organization_id', filters, [organizationId])
    }

    public async deleteProduct(product: ChainProduct): Promise<any> {
        if (this.isNodeApp) {
            const org = new ChainProductDB(product);
            const orders = await this.listSemiProductsForProduct(product._id, false, false, false, { limit: 1, offset: 0 })
            if (orders.count > 0) throw Error("Cannot delete product. Product contains semi-products.")
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return await this.deleteBC(product)
        }
    }

    //////////////////////////////////////////////////////////
    /// PROCESSING ACTION
    //////////////////////////////////////////////////////////


    public async insertProcessingAction(action: ChainProcessingAction) {
        if (this.isNodeApp) {
            const newAction = { ...action, ...this.timestamp(action) } as ChainProcessingAction;
            const org = new ChainProcessingActionDB(newAction);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(action)
        }
    }

    public async getProcessingAction(id: string, writeDatabase = false, lastVersionPurpose = false): Promise<ChainProcessingAction> {
        const org = new ChainProcessingActionDB()
        const processingAction = await getResponseValue(org.read(this.dbService, id, writeDatabase))
        if (!lastVersionPurpose) {
            if (processingAction.inputSemiProductId) {
                processingAction.inputSemiProduct = await this.getSemiProduct(processingAction.inputSemiProductId, writeDatabase);
            }
            if (processingAction.outputSemiProductId) {
                processingAction.outputSemiProduct = await this.getSemiProduct(processingAction.outputSemiProductId, writeDatabase);
            }
        }
        if (processingAction.requiredDocTypeIds && processingAction.requiredDocTypeIds.length > 0) {
            const procEv = new ChainProcessingEvidenceTypeDB()
            processingAction.requiredDocTypes = await procEv.readForIds(this.dbService, processingAction.requiredDocTypeIds, writeDatabase);
        }
        return processingAction;
    }

    public async listProcessingActionsForProductAndOrganization(productId: string, organizationId: string, filters?: ViewFilterParams, skuOnly = false): Promise<PaginatedList<ChainProcessingAction>> {
        const org = new ChainProcessingActionDB()
        const res = await org.readAll(this.dbService, 'product_and_organization_id_name', 'product_and_organization_id_name', filters, [productId, organizationId])
        await this.extractForIds<ChainSemiProduct>(res.items, new ChainSemiProductDB(), 'inputSemiProductId', 'inputSemiProduct')
        if (skuOnly) {
            // console.log("SKU_ONLY", res.items.map(x => '' + x.inputSemiProduct.name + '--' + x.inputSemiProduct.isSKU))
            res.items = res.items.filter(pa => pa.type === 'SHIPMENT' && pa.inputSemiProduct.isSKUEndCustomer)    // NOT CORRECT COUNT AND LISTING. USE ONLY TO FETCH ALL!!!
        }
        await this.extractForIds<ChainSemiProduct>(res.items, new ChainSemiProductDB(), 'outputSemiProductId', 'outputSemiProduct')
        await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'outputSemiProduct.measurementUnitType._id', 'outputSemiProduct.measurementUnitType')
        return res
    }

    public async deleteProcessingAction(product: ChainProcessingAction): Promise<any> {
        if (this.isNodeApp) {
            throw Error("Processing actions cannot be deleted.")
            // const org = new ChainProcessingActionDB(product);
            // return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(product)
        }
    }


    //////////////////////////////////////////////////////////
    /// ORDER ACTION
    //////////////////////////////////////////////////////////


    public async insertOrderAction(action: ChainOrderAction) {
        if (this.isNodeApp) {
            const newAction = { ...action, ...this.timestamp(action) } as ChainOrderAction;
            const org = new ChainOrderActionDB(newAction);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(action)
        }
    }

    public async getOrderAction(id: string): Promise<ChainOrderAction> {
        const org = new ChainOrderActionDB()
        const orderAction = await getResponseValue(org.read(this.dbService, id))
        orderAction.inputSemiProduct = await this.getSemiProduct(orderAction.inputSemiProductId);
        orderAction.outputSemiProduct = await this.getSemiProduct(orderAction.outputSemiProductId);
        if (orderAction.requiredDocTypeIds && orderAction.requiredDocTypeIds.length > 0) {
            const procEv = new ChainOrderEvidenceTypeDB()
            orderAction.requiredDocTypes = await procEv.readForIds(this.dbService, orderAction.requiredDocTypeIds);
        }
        return orderAction;
    }

    public async listOrderActionsForProductAndOrganization(productId: string, organizationId: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainOrderAction>> {
        const org = new ChainOrderActionDB()
        return org.readAll(this.dbService, 'product_and_organization_id_name', 'product_and_organization_id_name', filters, [productId, organizationId])
    }

    public async deleteOrderAction(product: ChainOrderAction): Promise<any> {
        if (this.isNodeApp) {
            const org = new ChainOrderActionDB(product);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(product)
        }
    }


    //////////////////////////////////////////////////////////
    /// SEMI PRODUCT
    //////////////////////////////////////////////////////////

    public async listSemiProducts(filters?: ViewFilterParams): Promise<PaginatedList<ChainSemiProduct>> {
        const org = new ChainSemiProductDB()
        const res = await org.readAll(this.dbService, null, null, filters)
        await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'measurementUnitType._id', 'measurementUnitType')
        return res
    }

    public insertSemiProduct(semiProduct: ChainSemiProduct) {
        if (this.isNodeApp) {
            const newSemiProduct = { ...semiProduct, ...this.timestamp(semiProduct) } as ChainSemiProduct;
            const org = new ChainSemiProductDB(newSemiProduct);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(semiProduct)
        }
    }

    public async getSemiProduct(id: string, writeDatabase = false): Promise<ChainSemiProduct> {
        const org = new ChainSemiProductDB()
        const semi = await getResponseValue(org.read(this.dbService, id, writeDatabase))
        if (semi.productId) {
            const product = await this.getProduct(semi.productId)
            semi.product = this.stripedProduct(product)
        }
        if (semi.measurementUnitType) {
            semi.measurementUnitType = await this.getMeasureUnitType(semi.measurementUnitType._id)
        }
        return semi;
    }

    public async semiProductAvailabilityInFacility(facilityId: string, semiProductId: string): Promise<ChainSemiProductAvailability> {
        const query = {
            group: true,
            group_level: 2,
            startkey: [facilityId, semiProductId],
            endkey: [facilityId, semiProductId, {}],
            reduce: true
        }
        const response = await this.dbService.readDatabase.view('aggregates', 'semi_product_availability_in_facility', {
            ...query,
        })
        return {
            facilityId,
            semiProductId,
            availableQuantity: response.rows.length > 0 ? response.rows[0].value as number : 0
        }
    }

    public async semiProductAvailabilityInFacilities(facilityIds: string[], semiProductId: string): Promise<ChainSemiProductAvailability[]> {
        const promises = facilityIds.map(x => this.semiProductAvailabilityInFacility(x, semiProductId))
        return await Promise.all(promises)
    }

    public async listSemiProductsForProduct(productId: string, isBuyable: boolean, isSKU: boolean, isSKUEndCustomer: boolean, filters?: ViewFilterParams): Promise<PaginatedList<ChainSemiProduct>> {
        let view = 'semi_product_by_product';
        if (isBuyable && isSKU && isSKUEndCustomer) view = 'semi_product_by_product_is_sku_and_is_buyable_and_is_sku_end_customer';
        else if (isBuyable && isSKU) view = 'semi_product_by_product_is_sku_and_is_buyable';
        else if (isSKU && isSKUEndCustomer) view = 'semi_product_by_product_is_sku_and_is_sku_end_customer';
        else if (isBuyable && isSKUEndCustomer) view = 'semi_product_by_product_is_sku_end_customer_and_is_buyable';
        else if (isBuyable) view = 'semi_product_by_product_is_buyable';
        else if (isSKU) view = 'semi_product_by_product_is_sku';
        else if (isSKUEndCustomer) view = 'semi_product_by_product_is_sku_end_customer';

        const desc: boolean = filters && filters.sort === 'DESC' ? true : false

        const startkeyDef = [productId];
        const endkeyDef = [productId, {}];
        const response = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: filters && filters.limit ? filters.limit : undefined,
            skip: filters && filters.offset ? filters.offset : undefined
        })
        const countResponse = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
        })
        const count = countResponse.rows && countResponse.rows.length;
        const items = response.rows.map(doc => (new DBDocument<ChainSemiProduct>((doc as any).doc)).value as ChainSemiProduct)
        await this.extractForIds<ChainMeasureUnitType>(items, new ChainMeasureUnitTypeDB(), 'measurementUnitType._id', 'measurementUnitType')
        return new PaginatedList<ChainSemiProduct>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)
    }

    public async deleteSemiProduct(semiProduct: ChainSemiProduct): Promise<any> {
        if (this.isNodeApp) {
            const org = new ChainSemiProductDB(semiProduct);
            const orders = await this.listStockOrdersForSemiProduct(semiProduct._id, { limit: 1, offset: 0 })
            if (orders.count > 0) throw Error("Cannot delete semi-product. Semi-product contains stock-orders.")
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(semiProduct)
        }
    }

    public async countPurchaseOrders(): Promise<string> {
        const response = await this.dbService.readDatabase.view('aggregates', 'purchase_order_count', {
            reduce: true
        })
        let count = 0;
        if (response.rows.length > 0) count = response.rows[0].value as number;
        return count.toString();
    }
    //////////////////////////////////////////////////////////
    /// USER
    //////////////////////////////////////////////////////////

    public async listUsers(filters?: ViewFilterParams): Promise<PaginatedList<ChainUser>> {
        const org = new ChainUserDB()
        return org.readAll(this.dbService, null, null, filters)
    }

    public insertUser(user: ChainUser) {
        if (this.isNodeApp) {
            const newUser = { ...user, ...this.timestamp(user) } as ChainUser;
            const org = new ChainUserDB(newUser);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(user)
        }
    }

    public async getUserByUserId(id: number): Promise<ChainUser> {
        const org = new ChainUserDB()
        const response = await this.dbService.readDatabase.view('id_link', 'id_link', {
            key: ["user", id],
            reduce: false,
            include_docs: true,
        })
        const items = response.rows.map(doc => (new DBDocument<ChainUser>((doc as any).doc)).value as ChainUser)
        if (items.length === 0) return {} as ChainUser;

        return items[0];
    }

    public async getUser(id: string): Promise<ChainUser> {
        const org = new ChainUserDB()
        return getResponseValue(org.read(this.dbService, id))
    }

    public async usersForIds(ids: number[]): Promise<ChainUser[]> {
        const org = new ChainUserDB()
        return org.readForLinkIds(this.dbService, ids)
    }

    public async deleteUser(user: ChainUser): Promise<any> {
        if (this.isNodeApp) {
            // TODO: check dependencies before delete.
            const org = new ChainUserDB(user);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(user)
        }
    }

    //////////////////////////////////////////////////////////
    /// USER CUSTOMER
    //////////////////////////////////////////////////////////

    public async listAllUserCustomers(filters?: ViewFilterParams): Promise<PaginatedList<ChainUserCustomer>> {
        const org = new ChainUserCustomerDB()
        return org.readAll(this.dbService, null, null, filters)
    }

    public async insertUserCustomer(userCustomer: ChainUserCustomer) {

        const newCustomer = { ...userCustomer, ...this.timestamp(userCustomer) } as ChainUserCustomer;
        // customer id
        if (!newCustomer._id) {
            const customerCounter = await this.userCompanyCustomerIdCounter();
            if (customerCounter) {
                newCustomer.id = customerCounter.userCustomerCounter + 1;
                this.insertUserCompanyCustomerIdCounter(customerCounter, true)
            } else {
                throw Error("Cannot insert. No ID.");
            }

            if (!newCustomer.userCustomerId) {
                const extId = newCustomer.id.toString();
                newCustomer.userCustomerId = 'FAR' + extId.padStart(4, "0")
            }
        }
        if (this.isNodeApp) {
            if (newCustomer.companyId != null) {
                const organization = await this.getOrganizationByCompanyId(newCustomer.companyId);
                newCustomer.organizationId = organization._id;
            }
            if (!newCustomer.organizationId) throw Error("No organizationId");

            if (newCustomer.productId != null) {
                const product = await this.getProductByProductId(newCustomer.productId);
                newCustomer.chainProductId = product._id;
            }
            if (!newCustomer.chainProductId) throw Error("No chainProductId");


            const org = new ChainUserCustomerDB(newCustomer);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(newCustomer)
        }
    }

    public async getUserCustomerByUserCustomerId(id: number): Promise<ChainUserCustomer> {
        const userCust = new ChainUserCustomerDB()
        const userCustomer = await getResponseValue(userCust.readByLinkId(this.dbService, id));
        const org = new ChainOrganizationDB();
        if (userCustomer.organizationId) {
            userCustomer.organization = await this.getOrganization(userCustomer.organizationId);
        }
        return userCustomer;
    }

    public async getUserCustomer(id: string, writeDatabase = false): Promise<ChainUserCustomer> {
        const org = new ChainUserCustomerDB()
        return getResponseValue(org.read(this.dbService, id, writeDatabase))
    }

    public async userCustomersForIds(ids: number[]): Promise<ChainUserCustomer[]> {
        const org = new ChainUserCustomerDB()
        return org.readForLinkIds(this.dbService, ids)
    }

    public async listUserCustomersForOrganization(organizationId: string, query: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainUserCustomer>> {
        const desc: boolean = filters && filters.sort === 'DESC' ? true : false
        const startkeyDef = [organizationId];
        const endkeyDef = [organizationId, {}];
        if (query && query.length > 0) {
            startkeyDef.push(query);
            endkeyDef.splice(2, 0, query + "\ufff0")
        }

        const response = await this.dbService.readDatabase.view('customs', 'userCustomer_by_organization', {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: filters && filters.limit ? filters.limit : undefined,
            skip: filters && filters.offset ? filters.offset : undefined
        })
        const countResponse = await this.dbService.readDatabase.view('customs', 'userCustomer_by_organization', {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
        })
        const count = countResponse.rows && countResponse.rows.length;
        const items = response.rows.map(doc => (new DBDocument<ChainUserCustomer>((doc as any).doc)).value as ChainUserCustomer)
        return new PaginatedList<ChainUserCustomer>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)
    }

    public async listUserCustomersByRole(role: string, query: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainUserCustomer>> {
        const desc: boolean = filters && filters.sort === 'DESC' ? true : false
        const startkeyDef = [role];
        const endkeyDef = [role, {}];
        if (query && query.length > 0) {
            startkeyDef.push(query);
            endkeyDef.splice(1, 0, query + "\ufff0")
        }

        const response = await this.dbService.readDatabase.view('customs', 'userCustomer_by_role', {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: filters && filters.limit ? filters.limit : undefined,
            skip: filters && filters.offset ? filters.offset : undefined,
        })
        const countResponse = await this.dbService.readDatabase.view('customs', 'userCustomer_by_role', {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
        })

        const count = countResponse.rows && countResponse.rows.length;
        const items = response.rows.map(doc => (new DBDocument<ChainUserCustomer>((doc as any).doc)).value as ChainUserCustomer)
        return new PaginatedList<ChainUserCustomer>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)

    }

    public async listUserCustomersForOrganizationAndRole(organizationId: string, role: string, query: string, queryBy: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainUserCustomer>> {
        const desc: boolean = filters && filters.sort === 'DESC' ? true : false
        let selectedView;
        switch (queryBy) {
            case 'BY_NAME':
                selectedView = 'userCustomer_by_organization_id_and_role_query_by_name'
                break;
            case 'BY_SURNAME':
                selectedView = 'userCustomer_by_organization_id_and_role_query_by_surname'
                break;
            case 'BY_USER_CUSTOMER_ID':
                selectedView = 'userCustomer_by_organization_id_and_role_query_by_userCustomerId'
                break;
            case 'ALL':
                selectedView = 'userCustomer_by_organization_id_and_role_query_by_all'
                break;
            default:
                selectedView = 'userCustomer_by_organization_id_and_role_query_by_name'
        }

        const startkeyDef = [organizationId, role];
        const endkeyDef = [organizationId, role, {}];
        if (query && query.length > 0) {
            startkeyDef.push(query);
            endkeyDef.splice(2, 0, query + "\ufff0")
        }

        const response = await this.dbService.readDatabase.view('customs', selectedView, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: filters && filters.limit ? filters.limit : undefined,
            skip: filters && filters.offset ? filters.offset : undefined
        })
        const countResponse = await this.dbService.readDatabase.view('customs', selectedView, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
        })
        let count = countResponse.rows && countResponse.rows.length;
        const items = response.rows.map(doc => (new DBDocument<ChainUserCustomer>((doc as any).doc)).value as ChainUserCustomer);
        let itemsAll = items;
        if (queryBy === 'ALL') {
            itemsAll = items.filter((v, i, a) => a.findIndex(t => (t._id === v._id)) === i);
            count = itemsAll.length;
        }

        return new PaginatedList<ChainUserCustomer>(itemsAll, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)
    }

    public async listUserCustomersForProductAndOrganization(productId: string, organizationId: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainUserCustomer>> {
        const org = new ChainUserCustomerDB()
        return org.readAll(this.dbService, 'product_and_organization_id', 'product_and_organization_id', filters, [productId, organizationId])
    }

    public async listStockOrdersForUserCustomer(userCustomerId: string, filters?: ViewFilterParams, startDate?: string, endDate?: string): Promise<PaginatedList<ChainStockOrder>> {
        const org = new ChainStockOrderDB()
        const startKeys = [userCustomerId, startDate ? startDate : null]
        const endKeys = [userCustomerId, endDate ? endDate : {}]
        const res = await org.readAll(this.dbService, 'producer_user_id_formal_creation_time', 'producer_user_id_formal_creation_time', filters, startKeys, endKeys)
        await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'measurementUnitType._id', 'measurementUnitType')
        return res
    }

    public async listPaymentsForUserCustomer(userCustomerId: string, filters?: ViewFilterParams, startDate?: string, endDate?: string): Promise<PaginatedList<ChainPayment>> {
        const org = new ChainPaymentDB()
        const startKeys = [userCustomerId, startDate ? startDate : null]
        const endKeys = [userCustomerId, endDate ? endDate : {}]
        return org.readAll(this.dbService, 'recipient_customer_id_formal_creation_time', 'recipient_customer_id_formal_creation_time', filters, startKeys, endKeys)
    }

    public async deleteUserCustomer(userCustomer: ChainUserCustomer): Promise<any> {
        if (this.isNodeApp) {
            // TODO: check payment dependencies
            const org = new ChainUserCustomerDB(userCustomer);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(userCustomer)
        }
    }

    //////////////////////////////////////////////////////////
    /// COMPANY CUSTOMER
    //////////////////////////////////////////////////////////

    public async listAllCompanyCustomers(filters?: ViewFilterParams): Promise<PaginatedList<ChainCompanyCustomer>> {
        const org = new ChainCompanyCustomerDB()
        return org.readAll(this.dbService, null, null, filters)
    }

    public async insertCompanyCustomer(companyCustomer: ChainCompanyCustomer) {

        const newCompanyCustomer = { ...companyCustomer, ...this.timestamp(companyCustomer) } as ChainCompanyCustomer;

        // customer id
        const customerCounter = await this.userCompanyCustomerIdCounter();
        if (customerCounter) {
            newCompanyCustomer.cccid = customerCounter.companyCustomerCounter + 1;
            this.insertUserCompanyCustomerIdCounter(customerCounter, false)
        } else {
            throw Error("Cannot insert. No ID.");
        }

        if (this.isNodeApp) {

            if (newCompanyCustomer.companyId != null) {
                const organization = await this.getOrganizationByCompanyId(newCompanyCustomer.companyId);
                newCompanyCustomer.organizationId = organization._id;
            }
            if (!newCompanyCustomer.organizationId) throw Error("No organizationId");

            if (newCompanyCustomer.productId != null) {
                const product = await this.getProductByProductId(newCompanyCustomer.productId);
                newCompanyCustomer.chainProductId = product._id;
            }
            if (!newCompanyCustomer.chainProductId) throw Error("No chainProductId");

            const org = new ChainCompanyCustomerDB(newCompanyCustomer);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(newCompanyCustomer)
        }
    }

    public async getCompanyCustomerByCompanyCustomerId(id: number): Promise<ChainCompanyCustomer> {
        const org = new ChainCompanyCustomerDB()
        return getResponseValue(org.readByLinkId(this.dbService, id))
    }

    public async getCompanyCustomer(id: string, writeDatabase = false): Promise<ChainCompanyCustomer> {
        const org = new ChainCompanyCustomerDB();
        return getResponseValue(org.read(this.dbService, id, writeDatabase))
    }

    public async companyCustomersForIds(ids: number[]): Promise<ChainCompanyCustomer[]> {
        const org = new ChainCompanyCustomerDB()
        return org.readForLinkIds(this.dbService, ids)
    }

    public async listCompanyCustomersForOrganization(organizationId: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainCompanyCustomer>> {
        const org = new ChainCompanyCustomerDB()
        return org.readAll(this.dbService, 'organization_id', 'organization_id', filters, [organizationId])
    }

    public async listCompanyCustomersForProductAndOrganization(productId: string, organizationId: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainCompanyCustomer>> {
        const org = new ChainCompanyCustomerDB()
        return org.readAll(this.dbService, 'product_and_organization_id', 'product_and_organization_id', filters, [productId, organizationId])
    }

    public async deleteCompanyCustomer(customer: ChainCompanyCustomer): Promise<any> {
        if (this.isNodeApp) {
            // TODO: check payment dependencies
            const org = new ChainCompanyCustomerDB(customer);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(customer)
        }
    }


    //////////////////////////////////////////////////////////
    /// STOCK ORDER
    //////////////////////////////////////////////////////////

    public async insertStockOrder(stockOrder: ChainStockOrder, noCheck = false) {
        if (this.isNodeApp) {
            let newStockOrder = { ...stockOrder } as ChainStockOrder;

            if (!newStockOrder.gradeAbbreviationId && newStockOrder.gradeAbbreviation && newStockOrder.gradeAbbreviation._id) {
                newStockOrder.gradeAbbreviationId = newStockOrder.gradeAbbreviation._id
            }
            if (!newStockOrder.requiredQualityId && newStockOrder.requiredQuality && newStockOrder.requiredQuality._id) {
                newStockOrder.requiredQualityId = newStockOrder.requiredQuality._id
            }

            if (!noCheck && !stockOrder.isPurchaseOrder) {
                const duplicateMessage = await this.checkForDuplicateNamesInStockOrderInsideOrganization(stockOrder._id, stockOrder.identifier, stockOrder.facilityId);
                if (duplicateMessage != null) throw Error(duplicateMessage)
            }

            newStockOrder = { ...newStockOrder, ...this.timestamp(newStockOrder) }

            if (!stockOrder.semiProductId) {
                throw Error("Invalid semiProductId")
            }

            const semiProduct = await this.getSemiProduct(stockOrder.semiProductId);
            if (!semiProduct) {
                throw Error("Wrong semiProductId.")
            }

            newStockOrder.measurementUnitType = semiProduct.measurementUnitType;

            if (stockOrder.producerUserCustomerId) {
                newStockOrder.producerUserCustomer = await this.getUserCustomer(stockOrder.producerUserCustomerId)
            }
            if (stockOrder.consumerCompanyCustomer) { // override consumerCompanyCustomerId
                newStockOrder.consumerCompanyCustomerId = stockOrder.consumerCompanyCustomer._id
            }
            if (stockOrder.pricePerUnit && stockOrder.totalQuantity) {
                newStockOrder.cost = stockOrder.pricePerUnit * stockOrder.totalQuantity;
            }
            if (stockOrder.triggerOrders) {
                newStockOrder.triggerOrderIds = stockOrder.triggerOrders.map(x => x._id);
            }

            if (stockOrder.facilityId) {
                const facility = await this.getFacility(stockOrder.facilityId)
                newStockOrder.organizationId = facility.organizationId
            }
            newStockOrder.balance = await this.balanceForPurchaseOrder(newStockOrder);
            if (newStockOrder._id) {
                if (newStockOrder.orderType === 'SALES_ORDER' || newStockOrder.orderType === 'GENERAL_ORDER') {
                    newStockOrder.fullfilledQuantity = await this.fullfilledQuantity(newStockOrder._id)
                } else {
                    newStockOrder.fullfilledQuantity = newStockOrder.totalQuantity
                }
                if (newStockOrder.orderType !== 'SALES_ORDER') { // available means "not delivered" for sales order
                    const outputQuantity = await this.usedQuantity(newStockOrder._id)
                    newStockOrder.availableQuantity = newStockOrder.fullfilledQuantity - outputQuantity
                }
                console.log("QQ:", newStockOrder.availableQuantity, newStockOrder.availableQuantity < 0)
                if (newStockOrder.availableQuantity < 0) {
                    console.log(newStockOrder._id, newStockOrder.identifier )
                    throw Error("Negative stock availability")
                }
                if (newStockOrder.fullfilledQuantity < newStockOrder.availableQuantity) throw Error(`Too big available quantity (${ newStockOrder.availableQuantity }) in regard to fullfilmentQuantity (${ newStockOrder.fullfilledQuantity })`)
            }

            // auto settings
            delete newStockOrder.quoteOrganizationId
            if (newStockOrder.quoteFacilityId) {
                const quoteFacility = await this.getFacility(newStockOrder.quoteFacilityId)
                newStockOrder.quoteOrganizationId = quoteFacility.organizationId;
            }
            newStockOrder.isAvailable = newStockOrder.availableQuantity > 0 ? '1' : '0';
            newStockOrder.isOpenOrder = newStockOrder.orderType === 'GENERAL_ORDER' && newStockOrder.totalQuantity > newStockOrder.fullfilledQuantity ? '1' : '0'
            const org = new ChainStockOrderDB(newStockOrder);
            const res = await getResponseValue(org.save(this.dbService));
            if (newStockOrder.orderId) {
                const productOrder = await this.getOrder(newStockOrder.orderId)
                await this.insertOrder(productOrder) // reinsert to refresh availability
                // let openIds = productOrder.openOrderIds || []
                // let saveProductOrder = false;
                // if(newStockOrder.isAvailable === '1') {
                //     if(!openIds.indexOf(res._id)) {
                //         openIds.push(res._id)
                //         saveProductOrder = true;
                //     }
                // }
                // if(newStockOrder.isAvailable === '0') {
                //     if(openIds.indexOf(res._id)) {
                //         openIds = openIds.filter(x => x != res._id)
                //         saveProductOrder = true;
                //     }
                // }
            }

            return res
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(stockOrder)
        }
    }

    public async fullfilledQuantity(stockOrderId: string) {
        const pagedInputTxs = await this.listInputTransactions(stockOrderId, null, true)
        return pagedInputTxs.items.map(tx => tx.outputQuantity).reduce((a, b) => a + b, 0)
    }

    public async usedQuantity(stockOrderId: string) {
        const pagedInputTxs = await this.listOutputTransactions(stockOrderId, null, true)
        return pagedInputTxs.items.map(tx => tx.inputQuantity).reduce((a, b) => a + b, 0)
    }

    public async getStockOrder(id: string, writeDatabase = false, lastVersionPurpose = false, withInputOrders = false): Promise<ChainStockOrder> {
        const org = new ChainStockOrderDB()
        const stockOrder = await getResponseValue(org.read(this.dbService, id, writeDatabase))
        if (stockOrder.gradeAbbreviationId) { // exception - complex field
            stockOrder.gradeAbbreviation = await this.getGradeAbbreviation(stockOrder.gradeAbbreviationId)
        }
        if (stockOrder.requiredQualityId) { // exception - complex field
            stockOrder.requiredQuality = await this.getGradeAbbreviation(stockOrder.requiredQualityId)
        }

        if (stockOrder.clientId) {
            stockOrder.client = await this.getOrganizationByCompanyId(stockOrder.clientId)
        }
        if (!lastVersionPurpose) {
            if (stockOrder.facilityId) {
                stockOrder.facility = await this.getFacility(stockOrder.facilityId, writeDatabase)
            }
            if (stockOrder.semiProductId) {
                stockOrder.semiProduct = await this.getSemiProduct(stockOrder.semiProductId, writeDatabase)
            }
            if (stockOrder.representativeOfProducerUserCustomerId) {
                stockOrder.representativeOfProducerUserCustomer = await this.getUserCustomer(stockOrder.representativeOfProducerUserCustomerId, writeDatabase)
            }
            if (stockOrder.processingOrderId) {
                stockOrder.processingOrder = await this.getProcessingOrder(stockOrder.processingOrderId, writeDatabase)
            }
            if (stockOrder.consumerCompanyCustomerId) {
                stockOrder.consumerCompanyCustomer = await this.getCompanyCustomer(stockOrder.consumerCompanyCustomerId, writeDatabase)
            }
            if (stockOrder.orderId) {
                stockOrder.productOrder = await this.getOrder(stockOrder.orderId, writeDatabase)
            }

            if (stockOrder.triggerOrderIds) {
                if (stockOrder.triggerOrderIds.length === 0) {
                    stockOrder.triggerOrders = []
                } else {
                    const ord2 = new ChainStockOrderDB()
                    stockOrder.triggerOrders = await ord2.readForIds(this.dbService, stockOrder.triggerOrderIds)
                }
            }

            const pagedInputTxs = await this.listInputTransactions(id, null, writeDatabase)
            stockOrder.inputTransactions = pagedInputTxs.items
            const pagedOutputTxs = await this.listOutputTransactions(id, null, writeDatabase)
            stockOrder.outputTransactions = pagedOutputTxs.items
            if (withInputOrders) {
                stockOrder.inputOrders = await org.readForIds(this.dbService, stockOrder.inputTransactions.map(tx => tx.sourceStockOrderId), writeDatabase)
            }
            if (stockOrder.processingActionId) {
                stockOrder.processingAction = await this.getProcessingAction(stockOrder.processingActionId, writeDatabase).catch(e => null)
            }

            if (stockOrder.measurementUnitType) {
                stockOrder.measurementUnitType = await this.getMeasureUnitType(stockOrder.measurementUnitType._id)
            }

            if (stockOrder.orderType === 'GENERAL_ORDER') {
                stockOrder.triggeredOrders = await this.listTriggeredOrders(stockOrder._id)
            }
            stockOrder.balance = await this.balanceForPurchaseOrder(stockOrder);
        }
        return stockOrder;
    }


    // public async listStockKeepingUnitsInFacility(facilityId: string, filterParams?: ViewFilterParams): Promise<PaginatedList<any>> {
    //     // const org = new ChainStockKeepingtUnitDB()
    //     // let result = await org.readAll(this.dbService, 'stock_order_facility', 'stock_order_facility', filters, [facilityId]);
    //     const desc: boolean = filterParams && filterParams.sort === 'DESC' ? true : false
    //     const query = {
    //         group: true,
    //         group_level: 2,
    //         // key: ddoc ? undefined : [this.docType],
    //         // keys: [this.docType],
    //         startkey: [facilityId],
    //         endkey: [facilityId, {}, {}],
    //         // sorted: true,
    //         // descending: desc,
    //     }
    //     const response = await this.dbService.database.view('transactions_sums', 'transactions_sums', {
    //         ...query,
    //         reduce: true,
    //         // include_docs: true,
    //         // limit: filterParams && filterParams.limit ? filterParams.limit : undefined,
    //         // skip: filterParams && filterParams.offset ? filterParams.offset : undefined
    //     })

    //     // const countResponse = await dbService.database.view(ddoc ? ddoc : 'doc_type', indexName ? indexName : 'doc_type', {
    //     //     ...query,
    //     //     reduce: true,
    //     // })
    //     // const count = countResponse.rows && countResponse.rows.length === 1 ? countResponse.rows[0].value as number : 0
    //     const count = 0;
    //     const items = response.rows.map(doc => (new DBDocument<ChainStockKeepingtUnitSummary>((doc as any).doc)).value as ChainStockKeepingtUnitSummary)
    //     // console.log("filter:", countResponse)
    //     return new PaginatedList<any>(response.rows, count, filterParams ? filterParams.limit : undefined, filterParams ? filterParams.offset : undefined)

    // }

    public async listAllStockOrdersInFacility(facilityId: string, stockOrderFilters: StockOrderFilters, filters?: ViewFilterParams): Promise<PaginatedList<ChainStockOrder>> {
        // the filters (setting on true) can be used in group only, no mixing
        // GROUP 1
        const showPurchaseOrderOpenBalanceOnly = stockOrderFilters.showPurchaseOrderOpenBalanceOnly
        const purchaseOrderOnly = stockOrderFilters.purchaseOrderOnly
        const wayOfPayment = stockOrderFilters.wayOfPayment
        const womensCoffee = stockOrderFilters.womensCoffee
        const productionDateStart = stockOrderFilters.productionDateStart
        const productionDateEnd = stockOrderFilters.productionDateEnd
        const query = stockOrderFilters.query
        // GROUP 2
        const availableOnly = stockOrderFilters.availableOnly
        const semiProductId = stockOrderFilters.semiProductId;

        const startkeyDef = [facilityId];
        const endkeyDef = [facilityId, {}];

        let sortBySuffix = 'last_change'
        switch (filters.sortBy) {
            case 'date':
                sortBySuffix = 'production_date'; break;
            case 'lastChange':
                sortBySuffix = 'last_change'; break
            case 'deliveryTime':
                sortBySuffix = 'delivery_time'; break
            default:
                break;
        }

        let view = 'stock_order_by_facility';
        if (purchaseOrderOnly || showPurchaseOrderOpenBalanceOnly) {
            if (wayOfPayment && womensCoffee != null) {
                if (query) {
                    if (purchaseOrderOnly) view = 'purchase_order_by_facility_by_preferred_way_of_payment_womens_coffee_query';
                    if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_womens_coffee_query';
                    addKeys(wayOfPayment, startkeyDef, endkeyDef)
                    if (womensCoffee) addKeys(1, startkeyDef, endkeyDef)
                    else addKeys(0, startkeyDef, endkeyDef)
                    const pos = startkeyDef.length
                    startkeyDef.push(query);
                    endkeyDef.splice(pos, 0, query + "\ufff0")
                } else {
                    if (purchaseOrderOnly) view = 'purchase_order_by_facility_by_preferred_way_of_payment_womens_coffee';
                    if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_womens_coffee';
                    addKeys(wayOfPayment, startkeyDef, endkeyDef)
                    if (womensCoffee) addKeys(1, startkeyDef, endkeyDef)
                    else addKeys(0, startkeyDef, endkeyDef)
                }
            } else if (wayOfPayment) {
                if (query) {
                    if (purchaseOrderOnly) view = 'purchase_order_by_facility_by_preferred_way_of_payment_query';
                    if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_query';
                    addKeys(wayOfPayment, startkeyDef, endkeyDef)
                    const pos = startkeyDef.length
                    startkeyDef.push(query);
                    endkeyDef.splice(pos, 0, query + "\ufff0")
                } else {
                    if (purchaseOrderOnly) view = 'purchase_order_by_facility_by_preferred_way_of_payment';
                    if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment';
                    addKeys(wayOfPayment, startkeyDef, endkeyDef)
                }
            } else if (womensCoffee != null) {
                if (query) {
                    if (purchaseOrderOnly) view = 'purchase_order_by_facility_womens_coffee_query';
                    if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_womens_coffee_query';
                    if (womensCoffee) addKeys(1, startkeyDef, endkeyDef)
                    else addKeys(0, startkeyDef, endkeyDef)
                    const pos = startkeyDef.length
                    startkeyDef.push(query);
                    endkeyDef.splice(pos, 0, query + "\ufff0")
                } else {
                    if (purchaseOrderOnly) view = 'purchase_order_by_facility_womens_coffee';
                    if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_womens_coffee';
                    if (womensCoffee) addKeys(1, startkeyDef, endkeyDef)
                    else addKeys(0, startkeyDef, endkeyDef)
                }
            } else {
                if (query) {
                    if (purchaseOrderOnly) view = 'purchase_order_by_facility_query';
                    if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_query';
                    const pos = startkeyDef.length
                    startkeyDef.push(query);
                    endkeyDef.splice(pos, 0, query + "\ufff0")
                } else {
                    if (purchaseOrderOnly) view = 'purchase_order_by_facility';
                    if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance';
                }
            }

            if (productionDateStart && productionDateEnd) {
                const pos = startkeyDef.length
                startkeyDef.push(productionDateStart);
                endkeyDef.splice(pos, 0, productionDateEnd)
            } else if (productionDateStart) {
                const pos = startkeyDef.length
                startkeyDef.push(productionDateStart);
                endkeyDef.splice(pos, 0, productionDateStart + "\ufff0")
            }
        }
        else if (availableOnly) {
            if (semiProductId) {
                view = "stock_order_by_facility_by_semi_product_available_with_" + sortBySuffix
                addKeys(semiProductId, startkeyDef, endkeyDef)
            }
            else {
                view = "stock_order_by_facility_available_with_" + sortBySuffix
            }
        } else {
            if (semiProductId) {
                view = "stock_order_by_facility_by_semi_product_with_" + sortBySuffix
                addKeys(semiProductId, startkeyDef, endkeyDef)
            } else {
                view = "stock_order_by_facility_with_" + sortBySuffix
            }
        }
        // console.log("VIEW:", view)
        // console.log("START_KEY:", startkeyDef)
        // console.log("END_KEY:", endkeyDef)

        const desc: boolean = filters && filters.sort === 'DESC' ? true : false

        const response = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: filters && filters.limit ? filters.limit : undefined,
            skip: filters && filters.offset ? filters.offset : undefined
        })
        const countResponse = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
        })
        let count = countResponse.rows && countResponse.rows.length;
        let items = response.rows.map(doc => (new DBDocument<ChainStockOrder>((doc as any).doc)).value as ChainStockOrder)
        if (query) {
            items = items.filter((v, i, a) => a.findIndex(t => (t._id === v._id)) === i);
            count = items.length;
        }

        const semiProductIds = [... new Set(items.map(val => val.semiProductId))]
        const sp = new ChainSemiProductDB()
        const semiProducts = await sp.readForIds(this.dbService, semiProductIds)
        const mp = new Map<string, ChainSemiProduct>();
        semiProducts.forEach(val => mp.set(val._id, val))
        for (const item of items) {
            item.semiProduct = mp.get(item.semiProductId)
            item.balance = await this.balanceForPurchaseOrder(item);
        }
        await this.extractForIds<ChainMeasureUnitType>(items, new ChainMeasureUnitTypeDB(), 'measurementUnitType._id', 'measurementUnitType')
        return new PaginatedList<ChainStockOrder>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)

    }

    // this is a test version of listAllStockOrdersInFacility using elasticsearch
    public async elistAllStockOrdersInFacility(facilityId: string, stockOrderFilters: StockOrderFilters, filters?: ViewFilterParams): Promise<PaginatedList<ChainStockOrder>> {
        const showPurchaseOrderOpenBalanceOnly = stockOrderFilters.showPurchaseOrderOpenBalanceOnly;
        const purchaseOrderOnly = stockOrderFilters.purchaseOrderOnly;
        const wayOfPayment = stockOrderFilters.wayOfPayment;
        const womensCoffee = stockOrderFilters.womensCoffee;
        const availableOnly = stockOrderFilters.availableOnly;
        const semiProductId = stockOrderFilters.semiProductId;

        const filter = [];
        if (facilityId) {
            filter.push({ match: { "doc.facilityId": facilityId } });
        }
        if (wayOfPayment) {
            filter.push({ match: { "doc.preferredWayOfPayment": wayOfPayment } });
        }
        if (purchaseOrderOnly) {
            filter.push({ term: { "doc.isPurchaseOrder": true } });
        }
        if (showPurchaseOrderOpenBalanceOnly) {
            filter.push({ range: { "doc.balance": { gt: 0 } } });
        }
        if (womensCoffee) {
            filter.push({ exists: { field: "doc.documentRequirements.targets.womenShare" } });
            // must.push({ range: { "doc.documentRequirements.targets.womenShare": { gt: 0 } } });
        }
        if (availableOnly) {
            filter.push({ match: { "doc.isAvailable": "1" } })
        }
        if (semiProductId) {
            filter.push({ match: { "doc.semiProductId": semiProductId } });
        }
        const query = { bool: { filter } };

        if (filters && filters.sortBy === "date") {
            filters.sortBy = "productionDate";
        }

        return await this.elasticsearch("stock_order", query, filters);
    }

    private async elasticsearch<T>(docType: string, query: any, filters?: ViewFilterParams): Promise<PaginatedList<T>> {
        let sort;
        let size = 10000;
        let from = 0;
        if (filters) {
            if (filters.sortBy) {
                sort = [];
                const sortBy = `doc.${ filters.sortBy }`;
                if (filters.sort) {
                    const order = filters.sort === 'DESC' ? "desc" : "asc";
                    sort.push({ sortBy: order });
                } else {
                    sort.push(sortBy);
                }
            }
            if (filters.limit) {
                size = filters.limit;
            }
            if (filters.offset) {
                from = filters.offset;
            }
        }

        const result = await this.elasticsearchService.search({
            index: `index_${ docType }`,
            body: {
                query,
                sort,
                size,
                from
            }
        });

        const items = result.hits.hits.map((doc: any) => (new DBDocument<T>((doc._source as any).doc)).value as T);
        const count = result.hits.total.value;

        return new PaginatedList<T>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined);
    }

    public async listAllStockOrdersInFacilityForCustomer(facilityOrOrganizationId: string, stockOrderFilters: StockOrderFilters, filters?: ViewFilterParams, mode: 'facility' | 'organization' = 'facility'): Promise<PaginatedList<ChainStockOrder>> {

        const companyCustomerId = stockOrderFilters.companyCustomerId;
        const openOnly = stockOrderFilters.openOnly

        const startkeyDef = [facilityOrOrganizationId];
        const endkeyDef = [facilityOrOrganizationId, {}];

        const facilityOrOrganization = mode === 'facility' ? 'facility' : 'organization'

        let sortBySuffix = 'last_change'
        switch (filters.sortBy) {
            case 'lastChange':
                sortBySuffix = 'last_change'; break
            case 'deliveryTime':
                sortBySuffix = 'delivery_time'; break
            default:
                break;
        }
        sortBySuffix = '_' + sortBySuffix

        let companyCustomerSuffix = companyCustomerId ? 'by_company_customer' : ''

        if (companyCustomerId) {
            addKeys(companyCustomerId, startkeyDef, endkeyDef)
            companyCustomerSuffix = '_' + companyCustomerSuffix
        }
        const openOnlySuffix = openOnly ? '_open' : ''
        const view = 'stock_order_for_customer_by_' + facilityOrOrganization + companyCustomerSuffix + openOnlySuffix + sortBySuffix

        // console.log("VIEW:", view)
        // console.log("START_KEY:", startkeyDef)
        // console.log("END_KEY:", endkeyDef)

        const desc: boolean = filters && filters.sort === 'DESC' ? true : false

        const response = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: filters && filters.limit ? filters.limit : undefined,
            skip: filters && filters.offset ? filters.offset : undefined
        })
        const countResponse = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
        })
        const count = countResponse.rows && countResponse.rows.length;
        const items = response.rows.map(doc => (new DBDocument<ChainStockOrder>((doc as any).doc)).value as ChainStockOrder)
        await this.extractForIds<ChainSemiProduct>(items, new ChainSemiProductDB(), 'semiProductId', 'semiProduct')
        await this.extractForIds<ChainMeasureUnitType>(items, new ChainMeasureUnitTypeDB(), 'semiProduct.measurementUnitType._id', 'semiProduct.measurementUnitType')
        await this.extractForIds<ChainCompanyCustomer>(items, new ChainCompanyCustomerDB(), 'consumerCompanyCustomerId', 'consumerCompanyCustomer', { productId: null, companyId: null, type: null, name: null })
        await this.extractForIds<ChainProductOrder>(items, new ChainProductOrderDB(), 'orderId', 'productOrder', { id: null, facilityId: null })
        await this.extractForIds<ChainMeasureUnitType>(items, new ChainMeasureUnitTypeDB(), 'measurementUnitType._id', 'measurementUnitType')
        await this.extractForIds<ChainFacility>(items, new ChainFacilityDB(), 'quoteFacilityId', 'quoteFacility', { name: null, organizationId: null })
        await this.extractForIds<ChainOrganization>(items, new ChainOrganizationDB(), 'quoteFacility.organizationId', 'quoteFacility.organization', { name: null, id: null })
        return new PaginatedList<ChainStockOrder>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)

    }

    public async listAllStockOrdersForOrganization(organizationId: string, purchaseOrderOnly: boolean, showPurchaseOrderOpenBalanceOnly: boolean, wayOfPayment: string, farmerId: string, womensCoffee: boolean, productionDateStart: string, productionDateEnd: string, query: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainStockOrder>> {
        let countAll: number = 0;
        let itemsAll: ChainStockOrder[] = [];

        let view = 'stock_order_by_facility';
        if (wayOfPayment && womensCoffee != null) {
            if (query) {
                if (farmerId && showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_for_farmer_womens_coffee_query';
                else if (farmerId && purchaseOrderOnly) view = 'purchase_order_by_facility_by_preferred_way_of_payment_for_farmer_womens_coffee_query';
                else if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_womens_coffee_query';
                else if (purchaseOrderOnly) view = 'purchase_order_by_facility_by_preferred_way_of_payment_womens_coffee_query';
            } else {
                if (farmerId && showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_for_farmer_womens_coffee';
                else if (farmerId && purchaseOrderOnly) view = 'purchase_order_by_facility_by_preferred_way_of_payment_for_farmer_womens_coffee';
                else if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_womens_coffee';
                else if (purchaseOrderOnly) view = 'purchase_order_by_facility_by_preferred_way_of_payment_womens_coffee';
            }
        } else if (wayOfPayment) {
            if (query) {
                if (farmerId && showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_for_farmer_query';
                else if (farmerId && purchaseOrderOnly) view = 'purchase_order_by_facility_by_preferred_way_of_payment_for_farmer_query';
                else if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_query';
                else if (purchaseOrderOnly) view = 'purchase_order_by_facility_by_preferred_way_of_payment_query';
            } else {
                if (farmerId && showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment_for_farmer';
                else if (farmerId && purchaseOrderOnly) view = 'purchase_order_by_facility_by_preferred_way_of_payment_for_farmer';
                else if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_by_preferred_way_of_payment';
                else if (purchaseOrderOnly) view = 'purchase_order_by_facility_by_preferred_way_of_payment';
            }
        } else if (womensCoffee != null) {
            if (query) {
                if (farmerId && showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_for_farmer_womens_coffee_query';
                else if (farmerId && purchaseOrderOnly) view = 'purchase_order_by_facility_for_farmer_womens_coffee_query';
                else if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_womens_coffee_query';
                else if (purchaseOrderOnly) view = 'purchase_order_by_facility_womens_coffee_query';
            } else {
                if (farmerId && showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_for_farmer_womens_coffee';
                else if (farmerId && purchaseOrderOnly) view = 'purchase_order_by_facility_for_farmer_womens_coffee';
                else if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_womens_coffee';
                else if (purchaseOrderOnly) view = 'purchase_order_by_facility_womens_coffee';
            }
        } else {
            if (query) {
                if (farmerId && showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_for_farmer_query';
                else if (farmerId && purchaseOrderOnly) view = 'purchase_order_by_facility_for_farmer_query';
                else if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_query';
                else if (purchaseOrderOnly) view = 'purchase_order_by_facility_query';
            } else {
                if (farmerId && showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance_for_farmer';
                else if (farmerId && purchaseOrderOnly) view = 'purchase_order_by_facility_for_farmer';
                else if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_by_facility_with_open_balance';
                else if (purchaseOrderOnly) view = 'purchase_order_by_facility';
            }
        }


        const facilities = await this.listFacilitiesForOrganization(organizationId);

        if (facilities && facilities.items.length > 0) {
            for (const facility of facilities.items) {

                const startkeyDef: any[] = [facility._id];
                const endkeyDef: any[] = [facility._id, {}];
                if (farmerId) {
                    startkeyDef.push(farmerId);
                    endkeyDef.splice(1, 0, farmerId);
                    if (wayOfPayment) {
                        startkeyDef.push(wayOfPayment);
                        endkeyDef.splice(2, 0, wayOfPayment);
                        if (womensCoffee != null) {
                            if (womensCoffee) {
                                startkeyDef.push(1);
                                endkeyDef.splice(3, 0, 1);
                            } else {
                                startkeyDef.push(0);
                                endkeyDef.splice(3, 0, 0);
                            }
                            if (query != null) {
                                startkeyDef.push(query);
                                endkeyDef.splice(4, 0, query + "\ufff0");
                            }
                        } else if (query != null) {
                            startkeyDef.push(query);
                            endkeyDef.splice(3, 0, query + "\ufff0");
                        }
                    } else if (query != null) {
                        startkeyDef.push(query);
                        endkeyDef.splice(2, 0, query + "\ufff0");
                    }
                } else if (wayOfPayment) {
                    startkeyDef.push(wayOfPayment);
                    endkeyDef.splice(1, 0, wayOfPayment);
                    if (womensCoffee != null) {
                        if (womensCoffee) {
                            startkeyDef.push(1);
                            endkeyDef.splice(2, 0, 1);
                        } else {
                            startkeyDef.push(0);
                            endkeyDef.splice(2, 0, 0);
                        }
                        if (query != null) {
                            startkeyDef.push(query);
                            endkeyDef.splice(3, 0, query + "\ufff0");
                        }
                    } else if (query != null) {
                        startkeyDef.push(query);
                        endkeyDef.splice(2, 0, query + "\ufff0");
                    }
                } else if (womensCoffee != null) {
                    if (womensCoffee) {
                        startkeyDef.push(1);
                        endkeyDef.splice(1, 0, 1);
                    } else {
                        startkeyDef.push(0);
                        endkeyDef.splice(1, 0, 0);
                    }
                    if (query != null) {
                        startkeyDef.push(query);
                        endkeyDef.splice(2, 0, query + "\ufff0");
                    }
                } else if (query != null) {
                    startkeyDef.push(query);
                    endkeyDef.splice(1, 0, query + "\ufff0");
                }
                if (productionDateStart && productionDateEnd) {
                    const pos = startkeyDef.length
                    startkeyDef.push(productionDateStart);
                    endkeyDef.splice(pos, 0, productionDateEnd)
                } else if (productionDateStart) {
                    const pos = startkeyDef.length
                    startkeyDef.push(productionDateStart);
                    endkeyDef.splice(pos, 0, productionDateStart + "\ufff0")
                }


                const desc: boolean = false;
                const response = await this.dbService.readDatabase.view('customs', view, {
                    startkey: desc ? endkeyDef : startkeyDef,
                    endkey: desc ? startkeyDef : endkeyDef,
                    sorted: true,
                    descending: desc,
                    include_docs: true,
                    limit: undefined,
                    skip: undefined
                })
                const countResponse = await this.dbService.readDatabase.view('customs', view, {
                    startkey: desc ? endkeyDef : startkeyDef,
                    endkey: desc ? startkeyDef : endkeyDef,
                    sorted: true,
                    descending: desc,
                })

                const count = countResponse.rows && countResponse.rows.length;
                const items = response.rows.map(doc => (new DBDocument<ChainStockOrder>((doc as any).doc)).value as ChainStockOrder)

                countAll += count;
                itemsAll = [...itemsAll, ...items]

            }

            if (query) {
                itemsAll = itemsAll.filter((v, i, a) => a.findIndex(t => (t._id === v._id)) === i);
                countAll = itemsAll.length;
            }

            itemsAll.sort((a, b) => (a.productionDate > b.productionDate) ? 1 : -1)
            if (filters && filters.sort === "DESC") itemsAll.reverse();
            for (const item of itemsAll) {
                item.balance = await this.balanceForPurchaseOrder(item);
            }
            let slicedItems = itemsAll;
            const offset = filters && filters.offset ? filters.offset : 0;
            const limit = filters && filters.limit ? filters.limit : null;
            if (offset != null && limit != null) {
                slicedItems = slicedItems.slice(offset, offset + limit);
            }
            await this.extractForIds<ChainMeasureUnitType>(slicedItems, new ChainMeasureUnitTypeDB(), 'measurementUnitType._id', 'measurementUnitType')
            return new PaginatedList<ChainStockOrder>(slicedItems, countAll, limit, offset)
        }

    }

    public async listAllStockOrders(purchaseOrderOnly: boolean, showPurchaseOrderOpenBalanceOnly: boolean, filters?: ViewFilterParams): Promise<PaginatedList<ChainStockOrder>> {
        let view = null;
        if (purchaseOrderOnly) view = 'purchase_order';
        if (showPurchaseOrderOpenBalanceOnly) view = 'purchase_order_with_open_balance';

        if (view != null) {
            const desc: boolean = filters && filters.sort === 'DESC' ? true : false

            const response = await this.dbService.readDatabase.view('customs', view, {
                sorted: true,
                descending: desc,
                include_docs: true,
                limit: filters && filters.limit ? filters.limit : undefined,
                skip: filters && filters.offset ? filters.offset : undefined
            })
            const countResponse = await this.dbService.readDatabase.view('customs', view, {
                sorted: true,
                descending: desc,
            })
            const count = countResponse.rows && countResponse.rows.length;
            const items = response.rows.map(doc => (new DBDocument<ChainStockOrder>((doc as any).doc)).value as ChainStockOrder)
            await this.extractForIds<ChainMeasureUnitType>(items, new ChainMeasureUnitTypeDB(), 'measurementUnitType._id', 'measurementUnitType')
            return new PaginatedList<ChainStockOrder>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)
        }
        const org = new ChainStockOrderDB()
        const res = await org.readAll(this.dbService, null, null, filters);
        await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'measurementUnitType._id', 'measurementUnitType')
        return res
    }

    public async listPurchaseOrderForUserCustomer(farmerId: string, showOpenBalanceOnly: boolean, filters?: ViewFilterParams): Promise<PaginatedList<ChainStockOrder>> {
        let view = 'purchase_order_by_farmer_order_by_production_date';
        if (showOpenBalanceOnly) view = 'purchase_order_by_farmer_with_open_balance_order_by_production_date';

        const startkeyDef = [farmerId];
        const endkeyDef = [farmerId, {}];
        const desc: boolean = filters && filters.sort === 'DESC' ? true : false;

        const response = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: filters && filters.limit ? filters.limit : undefined,
            skip: filters && filters.offset ? filters.offset : undefined
        })
        const countResponse = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
        })
        const count = countResponse.rows && countResponse.rows.length;
        const items = response.rows.map(doc => (new DBDocument<ChainStockOrder>((doc as any).doc)).value as ChainStockOrder)
        await this.extractForIds<ChainMeasureUnitType>(items, new ChainMeasureUnitTypeDB(), 'measurementUnitType._id', 'measurementUnitType')
        return new PaginatedList<ChainStockOrder>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)
    }

    public async listAvailableStockOrdersInFacility(facilityId: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainStockOrder>> {
        const org = new ChainStockOrderDB()
        const res = await org.readAll(this.dbService, 'stock_order_facility', 'stock_order_facility', filters, [facilityId, '1']);
        await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'measurementUnitType._id', 'measurementUnitType')
        return res
    }

    public async listAvailableStockForSemiProductInFacility(facilityId: string, semiProductId: string, womensCoffee: boolean, productionDateStart: string, productionDateEnd: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainStockOrder>> {
        let view = 'available_stock_for_semi_product_in_facility';
        const startkeyDef: any[] = [facilityId, '1', semiProductId];
        const endkeyDef: any[] = [facilityId, '1', semiProductId, {}];

        if (womensCoffee != null) {
            view = 'available_stock_for_semi_product_in_facility_womens_share';

            if (womensCoffee) {
                startkeyDef.push(1);
                endkeyDef.splice(3, 0, 1)
            } else {
                startkeyDef.push(0);
                endkeyDef.splice(3, 0, 0)
            }
            if (productionDateStart && productionDateEnd) {
                startkeyDef.push(productionDateStart);
                endkeyDef.splice(4, 0, productionDateEnd)
            } else if (productionDateStart) {
                startkeyDef.push(productionDateStart);
                endkeyDef.splice(4, 0, productionDateStart + "\ufff0")
            }
        } else {
            if (productionDateStart && productionDateEnd) {
                startkeyDef.push(productionDateStart);
                endkeyDef.splice(3, 0, productionDateEnd)
            } else if (productionDateStart) {
                startkeyDef.push(productionDateStart);
                endkeyDef.splice(3, 0, productionDateStart + "\ufff0")
            }
        }

        const desc: boolean = filters && filters.sort === 'DESC' ? true : false

        const response = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: filters && filters.limit ? filters.limit : undefined,
            skip: filters && filters.offset ? filters.offset : undefined
        })
        const countResponse = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
        })
        const count = countResponse.rows && countResponse.rows.length;
        const items = response.rows.map(doc => (new DBDocument<ChainStockOrder>((doc as any).doc)).value as ChainStockOrder)

        await this.extractForIds<ChainMeasureUnitType>(items, new ChainMeasureUnitTypeDB(), 'measurementUnitType._id', 'measurementUnitType')
        return new PaginatedList<ChainStockOrder>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)
    }

    public async listOpenQuoteOrders(facilityOrOrganizationId: string, semiProductId?: string, openOnly?: boolean, filters?: ViewFilterParams, mode: 'facility' | 'organization' = 'facility', productionDateStart?: string, productionDateEnd?: string): Promise<PaginatedList<ChainStockOrder>> {
        if (!facilityOrOrganizationId) throw Error("Facility or organization ID is required")
        const startkeyDef: any[] = [facilityOrOrganizationId]
        const endkeyDef: any[] = [facilityOrOrganizationId]

        const facilityOrOrganization = mode === 'facility' ? 'quote_facility' : 'quote_organization'
        const sortBySuffix = filters && filters.sortBy === 'deliveryTime' ? 'delivery_time' : (filters && filters.sortBy === 'productionDate' ? 'production_date' : 'last_change')
        let view = `stock_order_by_${ facilityOrOrganization }_with_` + sortBySuffix
        if (openOnly) {
            view = `stock_order_by_${ facilityOrOrganization }_by_open_quote_with_` + sortBySuffix
            startkeyDef.push('1')
            endkeyDef.push('1')
        }
        if (semiProductId) {
            if (openOnly) {
                view = `stock_order_by_${ facilityOrOrganization }_by_open_quote_by_semi_product_with_` + sortBySuffix
            } else {
                view = `stock_order_by_${ facilityOrOrganization }_by_semi_product_with_` + sortBySuffix
            }
            startkeyDef.push(semiProductId)
            endkeyDef.push(semiProductId)
        }
        if (sortBySuffix === 'production_date' && (productionDateStart || productionDateEnd)) {
            const pos = startkeyDef.length
            startkeyDef.push(productionDateStart);
            endkeyDef.splice(pos, 0, productionDateEnd)
        } else {
            endkeyDef.push({})
        }
        const desc: boolean = filters && filters.sort === 'DESC' ? true : false

        // console.log("VIEW:", view)
        // console.log("ST:", startkeyDef)
        // console.log("EN:", endkeyDef)

        const response = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: filters && filters.limit ? filters.limit : undefined,
            skip: filters && filters.offset ? filters.offset : undefined
        })
        const countResponse = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
        })
        const count = countResponse.rows && countResponse.rows.length;
        // console.log("CNT:", count)
        const items = response.rows.map(doc => (new DBDocument<ChainStockOrder>((doc as any).doc)).value as ChainStockOrder)

        await this.extractForIds<ChainSemiProduct>(items, new ChainSemiProductDB(), 'semiProductId', 'semiProduct')
        await this.extractForIds<ChainMeasureUnitType>(items, new ChainMeasureUnitTypeDB(), 'semiProduct.measurementUnitType._id', 'semiProduct.measurementUnitType')
        await this.extractForIds<ChainFacility>(items, new ChainFacilityDB(), 'facilityId', 'facility', { name: null, organizationId: null })
        await this.extractForIds<ChainOrganization>(items, new ChainOrganizationDB(), 'facility.organizationId', 'facility.organization', { name: null, id: null, entityType: null })
        await this.extractForIds<ChainMeasureUnitType>(items, new ChainMeasureUnitTypeDB(), 'measurementUnitType._id', 'measurementUnitType')
        await this.extractForIds<ChainFacility>(items, new ChainFacilityDB(), 'quoteFacilityId', 'quoteFacility', { name: null, organizationId: null })
        await this.extractForIds<ChainOrganization>(items, new ChainOrganizationDB(), 'quoteFacility.organizationId', 'quoteFacility.organization', { name: null, id: null, entityType: null })
        await this.extractForIds<ChainProductOrder>(items, new ChainProductOrderDB(), 'orderId', 'productOrder')
        return new PaginatedList<ChainStockOrder>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)
    }

    public async listStockOrdersForSemiProduct(semiProductId: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainStockOrder>> {
        const org = new ChainStockOrderDB()
        const res = await org.readAll(this.dbService, 'semi_product_id', 'semi_product_id', filters, [semiProductId])
        await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'measurementUnitType._id', 'measurementUnitType')
        return res
    }



    async stockOrderDeleteTestInputs(stockOrder: ChainStockOrder) {
        const response = await this.listInputTransactions(stockOrder._id, { limit: 1, offset: 0 }, true)
        if (response.count > 0) throw Error("Cannot delete stock order. Stock order contains input transactions.")
    }

    async stockOrderDeleteTestOutputs(stockOrder: ChainStockOrder) {
        const response2 = await this.listOutputTransactions(stockOrder._id, { limit: 1, offset: 0 }, true)
        if (response2.count > 0) throw Error("Cannot delete stock order. Stock order contains output transactions.")
    }

    async stockOrderDeleteTestPayments(stockOrder: ChainStockOrder) {
        const response3 = await this.listPaymentsForStockOrder(stockOrder._id, { limit: 1, offset: 0 }, true)
        if (response3.count > 0) throw Error("Cannot delete stock order. Stock order contains payments.")
    }
    public async deleteStockOrder(stockOrder: ChainStockOrder): Promise<any> {
        if (this.isNodeApp) {
            await this.stockOrderDeleteTestInputs(stockOrder)
            await this.stockOrderDeleteTestOutputs(stockOrder)
            await this.stockOrderDeleteTestPayments(stockOrder)
            // const response = await this.listInputTransactions(stockOrder._id, { limit: 1, offset: 0 }, true)
            // if (response.count > 0) throw Error("Cannot delete stock order. Stock order contains input transactions.")
            // const response2 = await this.listOutputTransactions(stockOrder._id, { limit: 1, offset: 0 }, true)
            // if (response2.count > 0) throw Error("Cannot delete stock order. Stock order contains output transactions.")
            // const response3 = await this.listPaymentsForStockOrder(stockOrder._id, { limit: 1, offset: 0 }, true)
            // if (response3.count > 0) throw Error("Cannot delete stock order. Stock order contains payments.")

            const org = new ChainStockOrderDB(stockOrder);
            const res = await org.delete(this.dbService);
            const orderId = stockOrder.orderId
            if (orderId) { // recaluclate availability
                const productOrder = await this.getOrder(orderId, true, true)
                // console.log("PR:", productOrder)
                await this.insertOrder(productOrder) // reinsert to refresh availability
            }
            return res
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(stockOrder)
        }
    }

    public async deleteStockOrders(stockOrders: ChainStockOrder[]) {
        if (this.isNodeApp) {
            const resList = []
            for (const stockOrder of stockOrders) {
                const res = await this.deleteStockOrder(stockOrder)
                resList.push(res)
            }
            return resList
        }
        if (this.isBlockchainApp) {
            throw Error("Not yet implemented!")
        }
    }

    public async listTriggeredOrders(stockOrderId: string): Promise<ChainStockOrder[]> {
        const view = "triggered_orders"

        const startkeyDef = [stockOrderId];
        const endkeyDef = [stockOrderId, {}];

        const response = await this.dbService.readDatabase.view('customs', view, {
            startkey: startkeyDef,
            endkey: endkeyDef,
            // sorted: true,
            // descending: desc,
            include_docs: true,
            // limit: filters && filters.limit ? filters.limit : undefined,
            // skip: filters && filters.offset ? filters.offset : undefined
        })
        const items = response.rows.map(doc => (new DBDocument<ChainStockOrder>((doc as any).doc)).value as ChainStockOrder)
        return items
    }

    // nn = 0
    // soSet = new Set()
    // public async stockOrderHistory(stockOrderId: string, cache: Map<string, ChainHistory>, processingOrderCache: Map<string, ChainProcessingOrder>): Promise<ChainHistory> {
    //     // console.log("RUN:", this.nn, this.soSet.size)
    //     // const t0 = (new Date()).getTime()
    //     const tmpHistory = cache.get(stockOrderId)
    //     if (tmpHistory) {
    //         return tmpHistory;
    //     }
    //     // this.nn += 1
    //     // this.soSet.add(stockOrderId)

    //     const stockOrder = await this.getStockOrder(stockOrderId, false, true)
    //     if (stockOrder.orderType === 'PURCHASE_ORDER') {
    //         const hist = {
    //             stockOrder,
    //             ancestors: []
    //         } as ChainHistory
    //         cache.set(stockOrderId, hist)
    //         return hist
    //     }
    //     // const t1 = (new Date()).getTime()
    //     // console.log("TT:", t1 - t0)

    //     if (!stockOrder.processingOrderId) throw Error("Strange stock order without processing order, thati is not purchase order")

    //     let processingOrder = processingOrderCache.get(stockOrder.processingOrderId)
    //     if (!processingOrder) {
    //         processingOrder = await this.getProcessingOrder(stockOrder.processingOrderId, false, true, true)
    //         processingOrderCache.set(processingOrder._id, processingOrder)
    //     }

    //     const history = {
    //         stockOrder,
    //         processingOrder,
    //         ancestors: [] as ChainHistory[]
    //     }
    //     const action = processingOrder.processingAction// await this.getProcessingAction(processingOrder.processingActionId)
    //     // const t2 = (new Date()).getTime()
    //     // console.log("TT2:", t2 - t1)
    //     // processingOrder.processingAction = action
    //     if (action && (processingOrder.processingAction.type === 'TRANSFER' || processingOrder.processingAction.type === 'SHIPMENT')) {
    //         // const t0 = (new Date()).getTime()
    //         const pagedInputTxs = await this.listInputTransactions(stockOrder._id, null, false, true)
    //         // const t1 = (new Date()).getTime()
    //         // console.log("TTT:", t1 - t0, pagedInputTxs.count)
    //         const inputTransactions = pagedInputTxs.items
    //         // const lst = await Promise.all(inputTransactions.map(async (tx) => await this.stockOrderHistory(tx.sourceStockOrderId, cache)))
    //         const lst: ChainHistory[] = []
    //         for (const tx of inputTransactions) {
    //             lst.push(await this.stockOrderHistory(tx.sourceStockOrderId, cache, processingOrderCache))
    //         }
    //         lst.forEach(res => history.ancestors.push(res))
    //         // for (const tx of stockOrder.inputTransactions) {
    //         //     history.ancestors.push(await this.stockOrderHistory(tx.sourceStockOrderId))
    //         // }
    //     } else if (action && processingOrder.processingAction.type === 'PROCESSING') {
    //         // const t0 = (new Date()).getTime()
    //         const pagedInputTxs = await this.listInputTransactions(processingOrder._id, null, false, true)
    //         const inputTransactions = pagedInputTxs.items
    //         // const t1 = (new Date()).getTime()
    //         // console.log("TTT:", t1 - t0, pagedInputTxs.count)
    //         // const lst = await Promise.all(inputTransactions.map(async (tx) => await this.stockOrderHistory(tx.sourceStockOrderId, cache)))
    //         const lst: ChainHistory[] = []
    //         for (const tx of inputTransactions) {
    //             lst.push(await this.stockOrderHistory(tx.sourceStockOrderId, cache, processingOrderCache))
    //         }

    //         lst.forEach(res => history.ancestors.push(res))

    //         // for (const tx of processingOrder.inputTransactions) {
    //         //     history.ancestors.push(await this.stockOrderHistory(tx.sourceStockOrderId))
    //         // }
    //     } else if (action) throw Error("Strange processing action type")
    //     if (action && processingOrder.processingAction.type === 'SHIPMENT') {
    //         // const t0 = (new Date()).getTime()
    //         const triggeredOrders = await this.listTriggeredOrders(stockOrderId)
    //         // const t1 = (new Date()).getTime()
    //         // console.log("TTT:", t1 - t0)

    //         // const lst = await Promise.all(triggeredOrders.map(async (order) => await this.stockOrderHistory(order._id, cache)))
    //         const lst: ChainHistory[] = []
    //         for (const order of triggeredOrders) {
    //             lst.push(await this.stockOrderHistory(order._id, cache, processingOrderCache))
    //         }

    //         lst.forEach(res => history.ancestors.push(res))

    //     }
    //     cache.set(stockOrderId, history)
    //     return history
    // }

    fieldIDToFieldName(fieldID: string): string {
        const res = (fieldIDToFieldNameDict as any)[fieldID];
        if (!res) throw Error("Invalid fieldID")
        return res.field
    }

    // fieldIDToFieldName(fieldID: string): string {
    //     switch (fieldID) {
    //         case 'GRADE': return 'gradeAbbreviation'
    //         case 'LOT_EXPORT_NUMBER': return 'lotNumber'
    //         case 'PRICE_PER_UNIT': return 'pricePerUnit'
    //         case 'SCREEN_SIZE': return 'screenSize'
    //         case 'LOT_LABEL': return 'lotLabel'
    //         case 'START_OF_DRYING': return 'startOfDrying'
    //         case 'CLIENT_NAME': return 'clientId'
    //         case 'CERTIFICATES_IDS': return 'certificates'
    //         case 'TRANSACTION_TYPE': return 'actionType'
    //         case 'FLAVOUR_PROFILE': return 'flavourProfile'
    //         case 'WOMENS_COFFEE': return
    //         default:
    //             throw Error("Unknown fieldId: " + fieldID)
    //     }
    // }

    // get allFieldNames() {
    //     return Object.values(this.fieldIDToFieldNameDict)
    // }

    // public extractFieldAggregate<T>(history: ChainHistory, fieldID: string, purchaseOrderProperty = false): WeightedAggregate<T>[] {
    //     if (!history.processingOrder) {
    //         if (history.stockOrder.orderType === 'PURCHASE_ORDER') {
    //             if (purchaseOrderProperty) {
    //                 return [{
    //                     fieldID,
    //                     value: (history.stockOrder as any)[this.fieldIDToFieldName(fieldID)] as T,
    //                     quantity: history.stockOrder.totalQuantity
    //                 } as WeightedAggregate<T>]
    //             }
    //             throw Error("Non purchase order property required on purchase order")
    //         }
    //         throw Error("Processing order without processingOrder field.")
    //     }
    //     for (const fieldDef of history.processingOrder.processingAction.requiredFields) {
    //         if (fieldID !== fieldDef.label) continue
    //         return [{
    //             fieldID,
    //             value: (history.stockOrder as any)[this.fieldIDToFieldName(fieldID)] as T,
    //             quantity: history.stockOrder.totalQuantity
    //         } as WeightedAggregate<T>]
    //     }
    //     // this stock order does not require specific fieldID. Look deeper
    //     let res: WeightedAggregate<T>[] = []
    //     for (const ancestor of history.ancestors) {
    //         const tmpAgg = this.extractFieldAggregate<T>(ancestor, fieldID, purchaseOrderProperty)
    //         res = [...res, ...tmpAgg]
    //     }
    //     return res
    // }

    public extractBestFieldAggregate<T>(history: ChainHistory, fieldId: string): WeightedAggregate<any>[] {
        const stockOrder = history.stockOrder
        const value = (stockOrder as any)[fieldId];
        if (value) {
            return [{
                fieldID: fieldId,
                value: this.getFieldValue(stockOrder, fieldId),
                stockOrderId: stockOrder._id,
                identifier: stockOrder.internalLotNumber,
                quantity: stockOrder.totalQuantity,
                measurementUnit: stockOrder.measurementUnitType,
            } as WeightedAggregate<any>]
        }
        // if no accesors, then what we have iz best or empty
        if (!history.ancestors || history.ancestors.length === 0) {
            return [{
                fieldID: fieldId,
                value: null,
                stockOrderId: stockOrder._id,
                identifier: stockOrder.internalLotNumber,
                quantity: stockOrder.totalQuantity,
                measurementUnit: stockOrder.measurementUnitType,
            } as WeightedAggregate<any>]
        }
        // if the field is required for the action and empty, return
        // const action = actionMap.get(stockOrder.processingActionId)
        const action = this.historyCache.getForKey<ChainProcessingAction>(stockOrder.processingActionId)
        if (action) {
            const res = action.requiredFields.find(x => x.label === fieldId)
            if (res && res.required) {
                return [{
                    fieldID: fieldId,
                    value: null,
                    stockOrderId: stockOrder._id,
                    identifier: stockOrder.internalLotNumber,
                    quantity: stockOrder.totalQuantity,
                    measurementUnit: stockOrder.measurementUnitType,
                } as WeightedAggregate<any>]
            }
        }
        // if no action, continue
        // we have at least one ancestor
        const outAggs: WeightedAggregate<any>[] = []
        for (const ancestor of history.ancestors) {
            const aggs = this.extractBestFieldAggregate(ancestor, fieldId);
            for (const agg of aggs) {
                const found = outAggs.find(x => x.value === null && x.stockOrderId === agg.stockOrderId)
                if (found) {   // remove duplicates
                    continue;
                }
                outAggs.push(agg)
            }
        }
        return outAggs
    }

    isEmptyDocument(val: FieldDefinition[]) {
        if (!val) return true
        if (val.length < 3) return true
        if (val[2].files.length === 0) return true
        return false
    }

    public extractBestDocumentAggregate<T>(history: ChainHistory, fieldId: string): WeightedAggregate<any>[] {
        const stockOrder = history.stockOrder
        const docReq = stockOrder.documentRequirements.requirements.find(x => x.description === fieldId)
        // console.log("DR:", docReq)
        if (docReq) {
            return [{
                fieldID: fieldId,
                value: this.isEmptyDocument(docReq.fields) ? null : docReq.fields,
                stockOrderId: stockOrder._id,
                identifier: stockOrder.internalLotNumber,
                quantity: stockOrder.totalQuantity,
                measurementUnit: stockOrder.measurementUnitType,
                isDocument: true
            } as WeightedAggregate<any>]
        }

        // if no accesors, then what we have iz best or empty
        if (!history.ancestors || history.ancestors.length === 0) {
            return [{
                fieldID: fieldId,
                value: null,
                stockOrderId: stockOrder._id,
                identifier: stockOrder.internalLotNumber,
                quantity: stockOrder.totalQuantity,
                measurementUnit: stockOrder.measurementUnitType,
                isDocument: true
            } as WeightedAggregate<any>]
        }
        // if the field is required for the action and empty, return
        // const action = actionMap.get(stockOrder.processingActionId)
        const action = this.historyCache.getForKey<ChainProcessingAction>(stockOrder.processingActionId)


        // Check if action requires the document
        const docIdToInfo = new Map<string, DocTypeIdsWithRequired>()
        if (action && action.requiredDocTypeIdsWithRequired) {
            action.requiredDocTypeIdsWithRequired.forEach(doc => {
                const evd = this.historyCache.getForKey<ChainProcessingEvidenceType>(doc.processingEvidenceTypeId)
                docIdToInfo.set(evd.id, doc)   // tukaj je group info
            })

            const theFieldReq = docIdToInfo.get(fieldId)
            if (theFieldReq && !(theFieldReq.requiredOnQuote || theFieldReq.requiredOneOfGroupIdForQuote)) {
                // console.log("DR:", theFieldReq)
                return [{
                    fieldID: fieldId,
                    value: null,
                    stockOrderId: stockOrder._id,
                    identifier: stockOrder.internalLotNumber,
                    quantity: stockOrder.totalQuantity,
                    measurementUnit: stockOrder.measurementUnitType,
                    isDocument: true
                } as WeightedAggregate<any>]
            }
        }
        // if no action, proceed
        // we have at least one ancestor
        const outAggs: WeightedAggregate<any>[] = []
        for (const ancestor of history.ancestors) {
            const aggs = this.extractBestDocumentAggregate(ancestor, fieldId);
            for (const agg of aggs) {
                const found = outAggs.find(x => x.value === null && x.stockOrderId === agg.stockOrderId)
                if (found) {   // remove duplicates
                    continue;
                }
                outAggs.push(agg)
            }
        }
        return outAggs
    }

    // public async calculateAggregateForField<T>(stockOrderId: string, fieldID: string, purchaseOrderProperty = false): Promise<WeightedAggregate<T>[]> {
    //     const cache = new Map<string, ChainHistory>()
    //     const history = await this.stockOrderHistory(stockOrderId, cache)
    //     return this.extractFieldAggregate<T>(history, fieldID, purchaseOrderProperty)
    // }

    public async extractFacilitiesAndOrganizations(processingOrderHistory: ProcessingOrderHistory[]) {
        const facIds = new Set<string>()
        const orgIds = new Set<string>()
        for (const poh of processingOrderHistory) {
            for (const agg of poh.stockOrderAggs) {
                const facId = agg.stockOrder.facilityId;
                facIds.add(facId)
                const orgId = agg.stockOrder.organizationId
                orgIds.add(orgId)
            }
        }
        const fac = new ChainFacilityDB()
        const facilicties = await fac.readForIds(this.dbService, [...facIds])
        const facMap = new Map<string, ChainFacility>();
        for (const facility of facilicties) {
            facMap.set(facility._id, { organizationId: facility.organizationId, name: facility.name } as ChainFacility)
        }

        const org = new ChainOrganizationDB()
        const organizations = await org.readForIds(this.dbService, [...orgIds])
        const orgMap = new Map<string, ChainOrganization>();
        for (const organization of organizations) {
            orgMap.set(organization._id, { id: organization.id, entityType: organization.entityType, name: organization.name } as ChainOrganization)
        }

        for (const poh of processingOrderHistory) {
            for (const agg of poh.stockOrderAggs) {
                const facId = agg.stockOrder.facilityId;
                const orgId = agg.stockOrder.organizationId
                agg.stockOrder.facility = facMap.get(facId)
                agg.stockOrder.organization = orgMap.get(orgId)
            }
        }
    }

    // public async aggregatesForStockOrderId(stockOrderId: string, transferCache: Map<string, ChainHistory> = null): Promise<ProcessingOrderHistory[]> {
    //     const cache = transferCache ? transferCache : new Map<string, ChainHistory>()
    //     const processingOrderCache = new Map<string, ChainProcessingOrder>();
    //     const history = await this.stockOrderHistory(stockOrderId, cache, processingOrderCache)
    //     // const res = await this.extractAggregates(history)
    //     // let quoteStockOrder = await this.getStockOrder(stockOrderId)
    //     // if(quoteStockOrder.processingAction.type !== 'SHIPMENT') {
    //     //     quoteStockOrder = null;
    //     // }
    //     const res = await this.sortedTimeline([history])
    //     const rootAgg = res.find(x => x.depth === 0);
    //     const rootStockOrderId = rootAgg.stockOrderAggs[0].stockOrder._id
    //     rootAgg.stockOrderAggs[0].stockOrder = await this.getStockOrder(rootStockOrderId)
    //     await this.extractFacilitiesAndOrganizations(res);
    //     return res
    // }

    public async aggregatesForStockOrderIdCachedFE(stockOrderId: string, transferCache: Map<string, ChainHistory> = null): Promise<B2CHistoryTimeline> {
        const res = await this.aggregatesForStockOrderIdCached(stockOrderId, null, false)
        const processing: B2CHistoryItem[] = []
        const processingShorter: B2CHistoryItem[] = []
        let coopName;
        for (const item of res) {
            if (item.processingOrder && item.processingOrder.processingAction) {
                if (item.stockOrderAggs.length >= 1) {
                    const tmp = {
                        type: item.processingOrder.processingAction.type,
                        name: item.processingOrder.processingAction.name,
                        location: item.stockOrderAggs[0].stockOrder.facility.name,
                        date: item.stockOrderAggs[0].stockOrder.productionDate
                    } as B2CHistoryItem
                    processing.push(tmp);
                    if (item.processingOrder.processingAction.publicTimelineLabel) {
                        const defaultLocation = item.stockOrderAggs[0].stockOrder.facility.name
                        const publicTimelineLocation = item.processingOrder.processingAction.publicTimelineLocation
                        const tmp2 = {
                            type: item.processingOrder.processingAction.type,
                            name: item.processingOrder.processingAction.publicTimelineLabel,
                            location: publicTimelineLocation ? publicTimelineLocation : defaultLocation,
                            date: item.processingOrder.processingDate,
                            // iconClass: this.iconStyle(item)
                            iconEnumType: item.processingOrder.processingAction.publicTimelineIcon
                        } as B2CHistoryItem
                        // console.log(item.processingOrder.processingDate)
                        processingShorter.push(tmp2)
                    }
                }
            } else {
                if (item.stockOrderAggs.length >= 1) {
                    const tmp = {
                        type: null,
                        name: null,
                        location: item.stockOrderAggs[0].stockOrder.facility.name,
                        date: item.stockOrderAggs[0].stockOrder.productionDate
                    } as B2CHistoryItem
                    coopName = item.stockOrderAggs[0].stockOrder.organization.name;
                    processing.push(tmp);
                    processingShorter.push(tmp)
                }
            }
        }

        return {
            items: processing,
            shortItems: processingShorter,
            coopName
        } as B2CHistoryTimeline
    }

    public async aggregatesForStockOrderIdCached(stockOrderId: string, transferCache: Map<string, ChainHistory> = null, truncate = true): Promise<ProcessingOrderHistory[]> {
        const cache = transferCache ? transferCache : new Map<string, ChainHistory>()
        const history = await this.historyCache.stockOrderHistory(stockOrderId, cache)
        const res = await this.historyCache.sortedTimeline([history])
        const rootAgg = res.find(el => el.depth === 0);
        const rootStockOrderId = rootAgg.stockOrderAggs[0].stockOrder._id
        rootAgg.stockOrderAggs[0].stockOrder = {...this.historyCache.getForKey<ChainStockOrder>(rootStockOrderId)} // shallow copy due to triggerOrders!!
        this.historyCache.enrichStockOrder(rootAgg.stockOrderAggs[0].stockOrder)
        this.historyCache.extractFacilitiesAndOrganizations(res)
        res.forEach(poh => {
            delete poh.stockOrderIds
            if (poh.processingOrder && !poh.processingOrder.processingAction) {
                poh.processingOrder.processingAction = this.historyCache.getForKey<ChainProcessingAction>(poh.processingOrder.processingActionId)
            }
        })
        // console.log("STRINGIFY")
        // const stg = JSON.stringify(res)
        // console.log(stg.length)
        // const fs = require('fs')
        // fs.writeFile('resp-big.json', stg, (err: any) => {
        //     if (err) return console.log(err);
        //     console.log('Hello World > helloworld.txt');
        //   });
        if (truncate) {
            let size = 0
            const outRes: ProcessingOrderHistory[] = []
            let depth = 0
            for (let i = 0; i < res.length; i++) {
                // console.log("BEFORE ST", i)
                const len = JSON.stringify(res[i]).length
                // console.log("AFTER ST", i   )
                if (i > 0 && size + len > HISTORY_CUTTOFF_SIZE) {
                    for(let j = i; j < res.length; j++) {
                        if(res[j].depth === 0) {
                            outRes.push(res[j]);
                            break;
                        }
                    }
                    outRes.push({
                        depth: depth + 1,
                        processingOrder: null,
                        stockOrderAggs: []
                    })
                    return outRes
                }
                size += len
                depth = res[i].depth
                outRes.push(res[i])
            }
            // const stg = JSON.stringify(res)
            // if (stg.length > HISTORY_CUTTOFF_SIZE) {
            //     const tmpRes = res.filter(x => x.depth < HISTORY_CUTOFF_DEPTH)
            //     tmpRes.push({
            //         depth: HISTORY_CUTOFF_DEPTH,
            //         processingOrder: null,
            //         stockOrderAggs: []
            //     })
            //     // console.log("LEN SHORT:", JSON.stringify(tmpRes).length)
            //     return tmpRes
            // }
        }
        // console.log("AFTER STRINGIFY")
        return res
        // return null
    }



    // Organizations on purchase orders
    private producerIdsFromHistory(history: ChainHistory): Set<string> {
        const producerIds = new Set<string>()
        if (history.stockOrder.isPurchaseOrder) {
            producerIds.add(history.stockOrder.organizationId)
        }
        for (const ancestor of history.ancestors) {
            const prds = this.producerIdsFromHistory(ancestor)
            for (const id of prds) producerIds.add(id)
        }
        return producerIds;
    }

    public async producersForHistories(histories: ChainHistory[]): Promise<ChainOrganization[]> {
        const producerIds = new Set<string>()
        for (const history of histories) {
            for (const id of this.producerIdsFromHistory(history)) producerIds.add(id)
        }
        const org = new ChainOrganizationDB()
        const res = await org.readForIds(this.dbService, [...producerIds])
        return res
    }

    public async producersForHistoriesCached(histories: ChainHistory[]): Promise<ChainOrganization[]> {
        const producerIds = new Set<string>()
        for (const history of histories) {
            for (const id of this.producerIdsFromHistory(history)) producerIds.add(id)
        }
        return [...producerIds].map(id => this.historyCache.getForKey(id))
        // const org = new ChainOrganizationDB()
        // const res = await org.readForIds(this.dbService, [...producerIds])
        // return res
    }

    // public async aggregatesForOrderId(orderId: string): Promise<ProcessingOrderHistory[]> {
    //     const cache = new Map<string, ChainHistory>()
    //     const processingOrderCache = new Map<string, ChainProcessingOrder>()
    //     const order = await this.getOrder(orderId)
    //     // console.log("ORD:", order.items.length)
    //     const histories = []
    //     for (const stockOrder of order.items) {
    //         // const t0 = (new Date()).getTime()
    //         const res1 = await this.stockOrderHistory(stockOrder._id, cache, processingOrderCache)
    //         // const t1 = (new Date()).getTime()
    //         // console.log("H-end", t1 - t0)
    //         histories.push(res1)
    //     }
    //     const res = await this.sortedTimeline(histories)
    //     // const rootAgg = res.find(x => x.depth === 0);
    //     // const rootStockOrderId = rootAgg.stockOrderAggs[0].stockOrder._id
    //     // rootAgg.stockOrderAggs[0].stockOrder = await this.getStockOrder(rootStockOrderId)
    //     await this.extractFacilitiesAndOrganizations(res);
    //     return res
    // }

    public async aggregatesForOrderIdCached(orderId: string, truncate = false): Promise<ProcessingOrderHistory[]> {
        const cache = new Map<string, ChainHistory>()
        const processingOrderCache = new Map<string, ChainProcessingOrder>()
        // const order = await this.getOrder(orderId)
        const order = this.historyCache.getForKey<ChainProductOrder>(orderId)
        this.historyCache.enrichProductOrder(order)
        // console.log("OO:", order.items)
        const histories = []
        for (const stockOrder of order.items) {
            const res1 = await this.historyCache.stockOrderHistory(stockOrder._id, cache)
            histories.push(res1)
        }
        // console.log("BEFORE TIMELINE")
        const res = await this.historyCache.sortedTimeline(histories)
        this.historyCache.extractFacilitiesAndOrganizations(res)
        // console.log("AFTER TIMELINE")
        res.forEach(poh => {
            delete poh.stockOrderIds
            if (poh.processingOrder && !poh.processingOrder.processingAction) {
                poh.processingOrder.processingAction = this.historyCache.getForKey<ChainProcessingAction>(poh.processingOrder.processingActionId)
            }
        })

        // if (truncate) {
        //     const stg = JSON.stringify(res)
        //     if (stg.length > HISTORY_CUTTOFF_SIZE) {
        //         const tmpRes = res.filter(x => x.depth < HISTORY_CUTOFF_DEPTH)
        //         tmpRes.push({
        //             depth: HISTORY_CUTOFF_DEPTH,
        //             processingOrder: null,
        //             stockOrderAggs: []
        //         })
        //         // console.log("LEN SHORT:", JSON.stringify(tmpRes).length)
        //         return tmpRes
        //     }
        // }

        if (truncate) {
            let size = 0
            const outRes: ProcessingOrderHistory[] = []
            let depth = 0
            for (let i = 0; i < res.length; i++) {
                const len = JSON.stringify(res[i]).length
                if (i > 0 && size + len > HISTORY_CUTTOFF_SIZE) {
                    for(let j = i; j < res.length; j++) {
                        if(res[j].depth === 0) {
                            outRes.push(res[j]);
                            break;
                        }
                    }
                    outRes.push({
                        depth: depth + 1,
                        processingOrder: null,
                        stockOrderAggs: []
                    })
                    return outRes
                }
                size += len
                depth = res[i].depth
                outRes.push(res[i])
            }
        }

        return res
    }

    // public async aggregatesForStockOrderId(stockOrderId: string): Promise<ProcessingOrderHistory[]> {
    //     const cache = new Map<string, ChainHistory>()
    //     const history = await this.stockOrderHistory(stockOrderId, cache)
    //     // const res = await this.extractAggregates(history)
    //     const res = this.sortedTimeline(history)
    //     const rootStockOrderId = res[0].stockOrderAggs[0].stockOrder._id
    //     res[0].stockOrderAggs[0].stockOrder = await this.getStockOrder(rootStockOrderId)
    //     return res
    // }

    getFieldValue(stockOrder: any, fieldId: string) {
        const res = (fieldIDToFieldNameDict as any)[fieldId];
        if (!res) throw Error("Invalid fieldID")

        const field = res.field
        let fieldValue = stockOrder[field]

        if (res.valueCallback) {
            fieldValue = res.valueCallback(fieldValue)
        }
        return fieldValue
    }


    public async stockOrderAgg(history: ChainHistory, fieldDefinitionMap: Map<string, FieldDefinition>, documentDefinitionMap: Map<string, DocTypeIdsWithRequired>): Promise<StockOrderAgg> {
        const agg = {
            stockOrder: history.stockOrder,
            fields: [],
            documents: []
        } as StockOrderAgg;

        const action = history.processingOrder && history.processingOrder.processingAction
        const fieldIdToInfo = new Map<string, FieldDefinition>()
        if (action && action.requiredFields) {
            action.requiredFields.forEach(field => {
                fieldIdToInfo.set(field.label, field)
            })
        }

        // console.log("DDMAP:", documentDefinitionMap)
        const existingFields = new Set<string>()
        for (const fieldId of Object.keys(fieldIDToFieldNameDict)) {
            const field = this.fieldIDToFieldName(fieldId)
            const fieldValue = (history.stockOrder as any)[field]
            const isValidField = fieldValue && (!Array.isArray(fieldValue) || (fieldValue as any[]).length > 0)
            if (isValidField) {
                const info = fieldIdToInfo.get(fieldId)
                const quoteOrdReqFieldDef = fieldDefinitionMap && fieldDefinitionMap.get(fieldId)
                // console.log("INFO:", fieldId, info, fieldValue)
                const fieldAgg = {
                    fieldID: fieldId,
                    value: this.getFieldValue(history.stockOrder, fieldId),
                    stockOrderId: history.stockOrder._id,
                    identifier: history.stockOrder.internalLotNumber,
                    quantity: history.stockOrder.totalQuantity,
                    measurementUnit: history.stockOrder.measurementUnitType,
                    required: info && info.required,
                    mandatory: info && info.mandatory,
                    requiredOnQuote: quoteOrdReqFieldDef && quoteOrdReqFieldDef.requiredOnQuote
                } as WeightedAggregate<any>
                agg.fields.push(fieldAgg)
                existingFields.add(fieldId)
            }
        }

        for (const key of fieldIdToInfo.keys()) {
            if (existingFields.has(key)) continue;
            const info = fieldIdToInfo.get(key)
            // console.log("INFO2:", key, info)
            if (!info.required) continue;
            const quoteOrdReqFieldDef = fieldDefinitionMap && fieldDefinitionMap.get(key)
            const fieldAgg = {
                fieldID: key,
                value: null,
                stockOrderId: history.stockOrder._id,
                identifier: history.stockOrder.internalLotNumber,
                quantity: history.stockOrder.totalQuantity,
                measurementUnit: history.stockOrder.measurementUnitType,
                required: info && info.required,
                mandatory: info && info.mandatory,
                requiredOnQuote: quoteOrdReqFieldDef && quoteOrdReqFieldDef.requiredOnQuote
            } as WeightedAggregate<any>
            agg.fields.push(fieldAgg)
        }

        const actionRequiredDocLabels = action && action.requiredDocTypes ? action.requiredDocTypes.map(x => x.label) : []

        const docIdToInfo = new Map<string, DocTypeIdsWithRequired>()
        if (action && action.requiredDocTypeIdsWithRequired) {
            const evt = new ChainProcessingEvidenceTypeDB()
            const evidenceIdToEvidence = new Map<string, ChainProcessingEvidenceType>()
            const evidenceTypeIds = action.requiredDocTypeIdsWithRequired.map(x => x.processingEvidenceTypeId)
            const evidenceTypes = await evt.readForIds(this.dbService, evidenceTypeIds)
            evidenceTypes.forEach(ev => {
                evidenceIdToEvidence.set(ev._id, ev)
            })
            action.requiredDocTypeIdsWithRequired.forEach(doc => {
                docIdToInfo.set(evidenceIdToEvidence.get(doc.processingEvidenceTypeId).id, doc)   // tukaj je group info
            })
            // console.log("DD:", docIdToInfo)
        }

        // compare to processing action requirement
        const existingDocs = new Set<string>()
        const oneOfGroupsMap = new Map<string, WeightedAggregate<any>[]>()
        // Existing ones
        for (const docReq of history.stockOrder.documentRequirements.requirements) {
            const info = docIdToInfo.get(docReq.description)
            if (info && !info.required && (info.requiredOnQuote || info.requiredOneOfGroupIdForQuote)) continue;
            // console.log("INFO3:", docReq.description, info)
            const quoteOrdReqDocDef = documentDefinitionMap && documentDefinitionMap.get(docReq.description)
            const docAggregate = {
                fieldID: docReq.description,
                value: this.isEmptyDocument(docReq.fields) ? null : docReq.fields,
                stockOrderId: history.stockOrder._id,
                quantity: history.stockOrder.totalQuantity,
                measurementUnit: history.stockOrder.measurementUnitType,
                required: !!info,
                mandatory: info && info.required,
                requiredOnQuote: quoteOrdReqDocDef && quoteOrdReqDocDef.requiredOnQuote,
                requiredOneOfGroupIdForQuote: quoteOrdReqDocDef && quoteOrdReqDocDef.requiredOneOfGroupIdForQuote,
                isDocument: true

                // requiredOneOfGroupIdForQuote: info && info.requiredOneOfGroupIdForQuote
                // mandatory:
            } as WeightedAggregate<any>
            agg.documents.push(docAggregate)
            existingDocs.add(docReq.description)

            if (quoteOrdReqDocDef) {
                const groupId = quoteOrdReqDocDef.requiredOneOfGroupIdForQuote
                if (groupId) {
                    const groupList = (oneOfGroupsMap.get(groupId) || []) as WeightedAggregate<any>[]
                    groupList.push(docAggregate)
                    oneOfGroupsMap.set(groupId, groupList)
                }
            }

        }
        // Present on particular processing action, missing
        // console.log("PACTION:", action && action.name, docIdToInfo.keys())
        for (const key of docIdToInfo.keys()) {
            if (existingDocs.has(key)) continue;
            const info = docIdToInfo.get(key)
            if (info && !info.required && (info.requiredOnQuote || info.requiredOneOfGroupIdForQuote)) continue;
            // console.log("INFO4:", key, info)
            const quoteOrdReqDocDef = documentDefinitionMap && documentDefinitionMap.get(key)
            const docAggregate = {
                fieldID: key,
                value: null,
                stockOrderId: history.stockOrder._id,
                quantity: history.stockOrder.totalQuantity,
                measurementUnit: history.stockOrder.measurementUnitType,
                required: !!info,
                mandatory: info && info.required,
                requiredOnQuote: quoteOrdReqDocDef && quoteOrdReqDocDef.requiredOnQuote,
                requiredOneOfGroupIdForQuote: quoteOrdReqDocDef && quoteOrdReqDocDef.requiredOneOfGroupIdForQuote,
                isDocument: true
            } as WeightedAggregate<any>
            agg.documents.push(docAggregate)

            if (quoteOrdReqDocDef) {
                const groupId = quoteOrdReqDocDef.requiredOneOfGroupIdForQuote
                if (groupId) {
                    const groupList: WeightedAggregate<any>[] = oneOfGroupsMap.get(groupId) || []
                    groupList.push(docAggregate)
                    oneOfGroupsMap.set(groupId, groupList)
                }
            }
        }

        // Fix required one-of test
        for (const groupId of oneOfGroupsMap.keys()) {
            const groupList = oneOfGroupsMap.get(groupId)
            const anyValue = groupList.some(x => !!x.value)
            groupList.forEach(wagg => {
                wagg.requiredOnQuoteOneOk = anyValue
            })
        }
        return agg
    }

    public async extractTimeline(history: ChainHistory, fieldDefinitionMap: Map<string, FieldDefinition>, documentDefinitionMap: Map<string, DocTypeIdsWithRequired>, depth = 0): Promise<ProcessingOrderHistory[]> {
        const proHistory = {
            depth,
            processingOrder: history.processingOrder,
            stockOrderAggs: [await this.stockOrderAgg(history, fieldDefinitionMap, documentDefinitionMap)]
        } as ProcessingOrderHistory;
        const timeline = [proHistory]
        for (const ancestor of history.ancestors) {
            (await this.extractTimeline(ancestor, fieldDefinitionMap, documentDefinitionMap, depth + 1)).forEach(entry => {
                const existingAgg = entry.processingOrder
                    ? timeline.find(x => (x.processingOrder && entry.processingOrder._id === x.processingOrder._id))
                    : null
                if (existingAgg) {
                    entry.stockOrderAggs.forEach(agg => {
                        // add non duplicates
                        const existingStockOrderAgg = existingAgg.stockOrderAggs.find(elt => agg.stockOrder._id === elt.stockOrder._id)
                        if (!existingStockOrderAgg) {
                            existingAgg.stockOrderAggs.push(agg)
                        }
                    })
                } else {
                    timeline.push(entry)
                }
            })
        }
        return timeline
    }

    // fieldDefinitionMap: Map<string, FieldDefinition>, documentDefinitionMap: Map<string, DocTypeIdsWithRequired>

    // public async sortedTimeline(histories: ChainHistory[]): Promise<ProcessingOrderHistory[]> {
    //     const timeline: ProcessingOrderHistory[] = []
    //     const processingHistoryMap = new Map<string, ProcessingOrderHistory[]>()
    //     for (const history of histories) {
    //         const action = await this.getProcessingAction(history.stockOrder.processingActionId)
    //         const quoteOrder = action.type === 'SHIPMENT' ? history.stockOrder : null
    //         const fieldDefinitionMap = new Map<string, FieldDefinition>()
    //         const documentDefinitionMap = new Map<string, DocTypeIdsWithRequired>()

    //         if (quoteOrder) {
    //             action.requiredFields.forEach(field => {
    //                 fieldDefinitionMap.set(field.label, field)
    //             })
    //             const evt = new ChainProcessingEvidenceTypeDB()
    //             const evidenceIdToEvidence = new Map<string, ChainProcessingEvidenceType>()
    //             const evidenceTypeIds = action.requiredDocTypeIdsWithRequired.map(x => x.processingEvidenceTypeId)
    //             const evidenceTypes = await evt.readForIds(this.dbService, evidenceTypeIds)
    //             evidenceTypes.forEach(ev => {
    //                 evidenceIdToEvidence.set(ev._id, ev)
    //             })
    //             action.requiredDocTypeIdsWithRequired.forEach(docReq => {
    //                 documentDefinitionMap.set(evidenceIdToEvidence.get(docReq.processingEvidenceTypeId).id, docReq)
    //             })
    //         }
    //         const historyTimeline = await this.extractTimeline(history, fieldDefinitionMap, documentDefinitionMap)
    //         for (const poh of historyTimeline) {
    //             const key = (poh.processingOrder && poh.processingOrder._id) || '__NULL__'
    //             const existingHistList: ProcessingOrderHistory[] = processingHistoryMap.get(key) || []
    //             // find one fully matching
    //             const existing = existingHistList.find(one => {
    //                 // check if all stockOrders match
    //                 if (one.stockOrderAggs.length !== poh.stockOrderAggs.length) return false
    //                 for (const oneOf of one.stockOrderAggs) {
    //                     if (!poh.stockOrderAggs.find(x => x.stockOrder._id === oneOf.stockOrder._id)) return false;
    //                 }
    //                 return true
    //             })
    //             if (existing) {
    //                 // console.log("FOUND FOR:", key)
    //                 continue;
    //             }
    //             existingHistList.push(poh)
    //             processingHistoryMap.set(key, existingHistList)
    //             timeline.push(poh)
    //         }
    //         // timeline = [...timeline, ...historyTimeline]
    //     }


    //     timeline.sort((a: ProcessingOrderHistory, b: ProcessingOrderHistory) => {
    //         if (!a.processingOrder) {
    //             if (!b.processingOrder) return 0
    //             return 1
    //         } else if (!b.processingOrder) return -1;
    //         return a.processingOrder.created > b.processingOrder.created
    //             ? -1
    //             : (a.processingOrder.created < b.processingOrder.created
    //                 ? 1
    //                 : 0
    //             )
    //     })
    //     const outTimeline = [] as ProcessingOrderHistory[]
    //     let i = 0
    //     let pending: ProcessingOrderHistory = null;

    //     // join stockOrderAggs under the same processing order
    //     while (i < timeline.length) {
    //         const poh = timeline[i]
    //         if (poh.processingOrder) {
    //             if (pending) {
    //                 pending.stockOrderAggs.sort((a: StockOrderAgg, b: StockOrderAgg) => {
    //                     return a.stockOrder.created > b.stockOrder.created
    //                         ? -1
    //                         : (a.stockOrder.created < b.stockOrder.created
    //                             ? 1
    //                             : 0
    //                         )
    //                 })
    //                 outTimeline.push(pending)
    //                 pending = null
    //             }
    //             outTimeline.push(poh)
    //             i++
    //             continue;
    //         }
    //         // no processing order
    //         if (!pending) {
    //             pending = poh;
    //             i++;
    //             continue;
    //         }
    //         // pending exists
    //         poh.stockOrderAggs.forEach(entry => {
    //             const found = pending.stockOrderAggs.find(x => entry.stockOrder._id === x.stockOrder._id)
    //             if (!found) {
    //                 pending.stockOrderAggs.push(entry)
    //             }
    //         })
    //         i++;
    //     }
    //     if (pending) {
    //         pending.stockOrderAggs.sort((a: StockOrderAgg, b: StockOrderAgg) => {
    //             return a.stockOrder.created > b.stockOrder.created
    //                 ? -1
    //                 : (a.stockOrder.created < b.stockOrder.created
    //                     ? 1
    //                     : 0
    //                 )
    //         })
    //         outTimeline.push(pending)
    //     }
    //     await this.addOrganizationsToStockOrders(outTimeline)
    //     return outTimeline
    // }


    public async addOrganizationsToStockOrders(poHistories: ProcessingOrderHistory[]) {
        const orgIdToOrganization = new Map<string, ChainOrganization>()
        for (const poh of poHistories) {
            for (const agg of poh.stockOrderAggs) {
                const orgId = agg.stockOrder.organizationId
                if (orgId) {
                    orgIdToOrganization.set(orgId, null)
                }
            }
        }
        const org = new ChainOrganizationDB()
        const organizations = await org.readForIds(this.dbService, [...orgIdToOrganization.keys()])
        organizations.forEach(organization => {
            orgIdToOrganization.set(organization._id, organization)
        })
        for (const poh of poHistories) {
            for (const agg of poh.stockOrderAggs) {
                const orgId = agg.stockOrder.organizationId
                const org2 = orgIdToOrganization.get(orgId)
                agg.stockOrder.organization = org2
            }
        }
    }
    // export interface QuoteRequirementConfirmation {
    //     fieldId?: string;
    //     fieldIds?: string[];
    //     targetValue?: any;
    //     aggregates: WeightedAggregate<any>[]
    // }


    // public verifyQuoteRequirementConfirmations(history: ChainHistory, actionMap: Map<string, ChainProcessingAction>, evidenceIdToEvidence: Map<string, ChainProcessingEvidenceType>): QuoteRequirementConfirmation[] {
    //     const action = actionMap.get(history.stockOrder.processingActionId)
    //     const quoteOrder = action.type === 'SHIPMENT' ? history.stockOrder : null
    //     const fieldDefinitionMap = new Map<string, FieldDefinition>()
    //     const documentDefinitionMap = new Map<string, DocTypeIdsWithRequired>()

    //     if (quoteOrder) {
    //         action.requiredFields.forEach(field => {
    //             fieldDefinitionMap.set(field.label, field)
    //         })
    //         const evt = new ChainProcessingEvidenceTypeDB()
    //         action.requiredDocTypeIdsWithRequired.forEach(docReq => {
    //             documentDefinitionMap.set(evidenceIdToEvidence.get(docReq.processingEvidenceTypeId).id, docReq)
    //         })
    //     }
    //     // imamo vse requiremente
    //     // let quoteRequirementMap = new Map<string, QuoteRequirementConfirmation>()
    //     const result: QuoteRequirementConfirmation[] = []
    //     for (const key of fieldDefinitionMap.keys()) {
    //         const def = fieldDefinitionMap.get(key)
    //         if (!(def.required || def.requiredOnQuote)) continue;   // such should not exist
    //         const aggs = this.extractBestFieldAggregate(history, key, actionMap)
    //         result.push({
    //             fieldId: key,
    //             aggregates: aggs,
    //         } as QuoteRequirementConfirmation)
    //     }
    //     for (const key of documentDefinitionMap.keys()) {
    //         // let def = documentDefinitionMap.get(key)
    //         const aggs = this.extractBestDocumentAggregate(history, key, actionMap, evidenceIdToEvidence)
    //         result.push({
    //             fieldId: key,
    //             aggregates: aggs,
    //         } as QuoteRequirementConfirmation)
    //     }
    //     return result
    // }

    public verifyQuoteRequirementConfirmationsCached(history: ChainHistory): QuoteRequirementConfirmation[] {
        // const action = actionMap.get(history.stockOrder.processingActionId)
        const action = this.historyCache.getForKey<ChainProcessingAction>(history.stockOrder.processingActionId)
        const quoteOrder = action.type === 'SHIPMENT' ? history.stockOrder : null
        const fieldDefinitionMap = new Map<string, FieldDefinition>()
        const documentDefinitionMap = new Map<string, DocTypeIdsWithRequired>()

        if (quoteOrder) {
            action.requiredFields.forEach(field => {
                fieldDefinitionMap.set(field.label, field)
            })
            // const evt = new ChainProcessingEvidenceTypeDB()
            action.requiredDocTypeIdsWithRequired.forEach(docReq => {
                // documentDefinitionMap.set(evidenceIdToEvidence.get(docReq.processingEvidenceTypeId).id, docReq)
                const evd = this.historyCache.getForKey<ChainProcessingEvidenceType>(docReq.processingEvidenceTypeId)
                documentDefinitionMap.set(evd.id, docReq)
            })
        }
        // imamo vse requiremente
        // let quoteRequirementMap = new Map<string, QuoteRequirementConfirmation>()
        const result: QuoteRequirementConfirmation[] = []
        for (const key of fieldDefinitionMap.keys()) {
            const def = fieldDefinitionMap.get(key)
            if (!(def.required || def.requiredOnQuote)) continue;   // such should not exist
            const aggs = this.extractBestFieldAggregate(history, key)
            result.push({
                fieldId: key,
                aggregates: aggs,
            } as QuoteRequirementConfirmation)
        }
        for (const key of documentDefinitionMap.keys()) {
            // let def = documentDefinitionMap.get(key)
            const aggs = this.extractBestDocumentAggregate(history, key)
            result.push({
                fieldId: key,
                aggregates: aggs,
            } as QuoteRequirementConfirmation)
        }
        return result
    }

    public processingActionIdsForHistory(history: ChainHistory): string[] {
        let res: string[] = [history.stockOrder.processingActionId]
        if (!history.ancestors || history.ancestors.length === 0) return res
        for (const ancestor of history.ancestors) {
            const tmp = this.processingActionIdsForHistory(ancestor)
            res = [...res, ...tmp]
        }
        return res
    }

    // public async processingActionMapForHistory(history: ChainHistory): Promise<Map<string, ChainProcessingAction>> {
    //     const ids = this.processingActionIdsForHistory(history)
    //     const org = new ChainProcessingActionDB()
    //     const actions = await org.readForIds(this.dbService, ids)
    //     const resMap = new Map<string, ChainProcessingAction>();
    //     for (const action of actions) {
    //         resMap.set(action._id, action)
    //     }
    //     return resMap
    // }

    // public async processingActionMapForHistoryCached(history: ChainHistory): Promise<Map<string, ChainProcessingAction>> {
    //     const ids = this.processingActionIdsForHistory(history)
    //     const resMap = new Map<string, ChainProcessingAction>();
    //     ids.forEach(actionId => {
    //         resMap.set(actionId, this.historyCache.getForKey(actionId))
    //     })
    //     return resMap
    // }


    // public async verifyQuoteRequirementsForStockOrder(stockOrderId: string, evidenceIdToEvidence: Map<string, ChainProcessingEvidenceType>, transferCache?: Map<string, ChainHistory>, fixFPQ = true): Promise<QuoteRequirementConfirmationsWithMetaData> {
    //     const cache = transferCache ? transferCache : new Map<string, ChainHistory>()
    //     const processingOrderCache = new Map<string, ChainProcessingOrder>();
    //     // console.log("START")
    //     // const history = await this.stockOrderHistory(stockOrderId, cache, processingOrderCache)
    //     const history = await this.historyCache.stockOrderHistory(stockOrderId, cache)
    //     // console.log("HISTORY")
    //     // const actionMap = await this.processingActionMapForHistory(history)
    //     const actionMap = await this.processingActionMapForHistoryCached(history)
    //     // console.log("ACTION MAP - start verify")
    //     const res = this.verifyQuoteRequirementConfirmations(history, actionMap, evidenceIdToEvidence)
    //     // console.log("DONE")
    //     if (fixFPQ) {
    //         this.fixFPQ(res)
    //     }
    //     const producers = await this.producersForHistoriesCached([history])
    //     return {
    //         requirements: res,
    //         producers
    //     }
    // }

    // public async verifyQuoteRequirementsForOrder(orderId: string): Promise<QuoteRequirementConfirmationsWithMetaData> {
    //     const cache = new Map<string, ChainHistory>()
    //     const order = await this.getOrder(orderId)
    //     // console.log("ORD:", order.items.length)

    //     const evidenceIdToEvidence = new Map<string, ChainProcessingEvidenceType>()
    //     const evt = new ChainProcessingEvidenceTypeDB()
    //     const evidenceTypes = await evt.readAll(this.dbService)
    //     evidenceTypes.items.forEach(ev => {
    //         evidenceIdToEvidence.set(ev._id, ev)
    //     })

    //     const producers: ChainOrganization[] = []
    //     const result: QuoteRequirementConfirmation[] = []
    //     for (const stockOrder of order.items) {
    //         const res1 = await this.verifyQuoteRequirementsForStockOrder(stockOrder._id, evidenceIdToEvidence, cache, false)
    //         for (const elt of res1.requirements) {
    //             const found = result.find(x => x.fieldId === elt.fieldId)
    //             if (!found) {
    //                 result.push(elt)
    //             } else {
    //                 for (const agg of elt.aggregates) {
    //                     const foundAgg = found.aggregates.find(x => x.stockOrderId === agg.stockOrderId)
    //                     if (foundAgg) continue
    //                     found.aggregates.push(agg)
    //                 }
    //             }
    //         }
    //         for (const producer of res1.producers) {
    //             const found = producers.find(x => x._id === producer._id)
    //             if (!found) {
    //                 producers.push(producer)
    //             }
    //         }
    //     }
    //     await this.fixFPQ(result)

    //     // let producers = this.producersForHistories(histories)
    //     return {
    //         requirements: result,
    //         producers
    //     }
    // }

    public async verifyQuoteRequirementsForStockOrderCached(stockOrderId: string, transferCache?: Map<string, ChainHistory>, fixFPQ = true): Promise<QuoteRequirementConfirmationsWithMetaData> {
        const cache = transferCache ? transferCache : new Map<string, ChainHistory>()
        const history = await this.historyCache.stockOrderHistory(stockOrderId, cache)
        // const actionMap = await this.processingActionMapForHistoryCached(history)
        const res = this.verifyQuoteRequirementConfirmationsCached(history)
        if (fixFPQ) {
            await this.fixFPQCached(res)
        }
        const producers = await this.producersForHistoriesCached([history])
        return {
            requirements: res,
            producers
        }
    }

    public async verifyQuoteRequirementsForOrderCached(orderId: string): Promise<QuoteRequirementConfirmationsWithMetaData> {
        const cache = new Map<string, ChainHistory>()
        const order = this.historyCache.getForKey<ChainProductOrder>(orderId)
        this.historyCache.enrichProductOrder(order)

        // const evidenceIdToEvidence = new Map<string, ChainProcessingEvidenceType>()


        // const evt = new ChainProcessingEvidenceTypeDB()
        // const evidenceTypes = await evt.readAll(this.dbService)
        // evidenceTypes.items.forEach(ev => {
        //     evidenceIdToEvidence.set(ev._id, ev)
        // })

        const producers: ChainOrganization[] = []
        const result: QuoteRequirementConfirmation[] = []
        for (const stockOrder of order.items) {
            const res1 = await this.verifyQuoteRequirementsForStockOrderCached(stockOrder._id, cache, false)
            for (const elt of res1.requirements) {
                const found = result.find(x => x.fieldId === elt.fieldId)
                if (!found) {
                    result.push(elt)
                } else {
                    for (const agg of elt.aggregates) {
                        const foundAgg = found.aggregates.find(x => x.stockOrderId === agg.stockOrderId)
                        if (foundAgg) continue
                        found.aggregates.push(agg)
                    }
                }
            }
            for (const producer of res1.producers) {
                const found = producers.find(x => x._id === producer._id)
                if (!found) {
                    producers.push(producer)
                }
            }
        }
        // await this.fixFPQ(result)
        await this.fixFPQCached(result)
        // let producers = this.producersForHistories(histories)
        return {
            requirements: result,
            producers
        }
    }

    // public async fixFPQ(qReqConf: QuoteRequirementConfirmation[]) {
    //     const pev = new ChainProcessingEvidenceTypeDB()
    //     const allEvidenceTypesPaginated = await pev.readAll(this.dbService)
    //     const allEvidenceTypes = allEvidenceTypesPaginated.items
    //     const idToEvType = new Map<string, ChainProcessingEvidenceType>()
    //     allEvidenceTypes.forEach(val => {
    //         idToEvType.set(val.id, val)
    //     })
    //     // console.log(idToEvType)
    //     qReqConf.forEach(qreq => {
    //         const evidence = idToEvType.get(qreq.fieldId)
    //         if (evidence) {
    //             qreq.fairness = evidence.fairness
    //             qreq.provenance = evidence.provenance
    //             qreq.quality = evidence.quality
    //         }
    //     })
    // }

    public async fixFPQCached(qReqConf: QuoteRequirementConfirmation[]) {
        qReqConf.forEach(qreq => {
            const evidence = this.historyCache.getForKey<ChainProcessingEvidenceType>(qreq.fieldId)
            if (evidence) {
                qreq.fairness = evidence.fairness
                qreq.provenance = evidence.provenance
                qreq.quality = evidence.quality
            }
        })
    }

    public async extractAggregates(history: ChainHistory, depth = 0): Promise<StockOrderAggregates> {
        const aggs = {
            stockOrder: history.stockOrder,
            fieldAggregates: [{
                key: "__CONFIG__",
                required: false,
                depth,
                // processingAction: action,
                created: history.stockOrder.created,
                lastChange: history.stockOrder.lastChange,
                processingOrder: history.processingOrder,
                aggregates: [{
                    fieldID: "__CONFIG__",
                    stockOrderId: history.stockOrder._id,
                    identifier: history.stockOrder.internalLotNumber,
                    quantity: history.stockOrder.totalQuantity,
                    measurementUnit: history.stockOrder.measurementUnitType
                } as WeightedAggregate<any>]
            } as KeyAggregates],
            documentAggregates: []
        } as StockOrderAggregates;
        const action = history.processingOrder && history.processingOrder.processingAction
        // if (action) {
        //     for (const field of action.requiredFields) {
        //         const fieldAggregate = {
        //             key: field.label,
        //             required: true,
        //             depth: depth,
        //             // processingAction: action,
        //             processingOrder: history.processingOrder,
        //             aggregates: [{
        //                 fieldID: field.label,
        //                 value: (history.stockOrder as any)[this.fieldIDToFieldName(field.label)],
        //                 stockOrderId: history.stockOrder._id,
        //                 quantity: history.stockOrder.totalQuantity,
        //             } as WeightedAggregate<any>]
        //         } as KeyAggregates
        //         aggs.fieldAggregates.push(fieldAggregate)
        //     }
        // } else {  // Backup for case on processing action on purchase orders
        for (const fieldId of Object.keys(fieldIDToFieldNameDict)) {
            const field = this.fieldIDToFieldName(fieldId)
            const fieldValue = (history.stockOrder as any)[field]
            const isValidField = fieldValue && (!Array.isArray(fieldValue) || (fieldValue as any[]).length > 0)
            if (isValidField) {
                const fieldAggregate = {
                    key: fieldId,
                    required: false,
                    depth,
                    created: history.stockOrder.created,
                    lastChange: history.stockOrder.lastChange,
                    // processingAction: action,
                    processingOrder: history.processingOrder,
                    aggregates: [{
                        fieldID: fieldId,
                        value: this.getFieldValue(history.stockOrder, fieldId),
                        stockOrderId: history.stockOrder._id,
                        identifier: history.stockOrder.internalLotNumber,
                        quantity: history.stockOrder.totalQuantity,
                        measurementUnit: history.stockOrder.measurementUnitType
                    } as WeightedAggregate<any>]
                } as KeyAggregates
                aggs.fieldAggregates.push(fieldAggregate)
            }
        }
        // }
        const actionRequiredDocLabels = action && action.requiredDocTypes ? action.requiredDocTypes.map(x => x.label) : []
        for (const docReq of history.stockOrder.documentRequirements.requirements) {
            const docAggregate = {
                key: docReq.description,
                required: actionRequiredDocLabels.indexOf(docReq.name) >= 0,
                // processingAction: action,
                depth,
                created: history.stockOrder.created,
                lastChange: history.stockOrder.lastChange,
                processingOrder: history.processingOrder,
                aggregates: [{
                    fieldID: docReq.description,
                    value: docReq.fields,
                    stockOrderId: history.stockOrder._id,
                    quantity: history.stockOrder.totalQuantity,
                    measurementUnit: history.stockOrder.measurementUnitType
                }]
            } as KeyAggregates
            const existingAgg = docAggregate.processingOrder ? aggs.documentAggregates.find(x => (x.processingOrder._id && docAggregate.processingOrder._id === x.processingOrder._id) && docAggregate.key === x.key) : null
            if (existingAgg) {
                existingAgg.aggregates = [...existingAgg.aggregates, ...docAggregate.aggregates]
            } else {
                aggs.documentAggregates.push(docAggregate)
            }
        }

        for (const ancestor of history.ancestors) {
            const aggregates = await this.extractAggregates(ancestor, depth + 1)
            for (const fieldAgg of aggregates.fieldAggregates) {
                const actionFieldAggregate = fieldAgg.processingOrder ? aggs.fieldAggregates.find(x => (x.processingOrder && fieldAgg.processingOrder._id === x.processingOrder._id) && fieldAgg.key === x.key) : null
                // if(actionFieldAggregate) {
                //     console.log("FOUNDX:", actionFieldAggregate.key, actionFieldAggregate.aggregates.length, depth)
                // }
                if (actionFieldAggregate) {
                    actionFieldAggregate.aggregates = [...actionFieldAggregate.aggregates, ...fieldAgg.aggregates]
                } else {
                    aggs.fieldAggregates.push(fieldAgg)
                }
            }
            for (const docAgg of aggregates.documentAggregates) {
                const actionDocAggregate = docAgg.processingOrder ? aggs.documentAggregates.find(x => (x.processingOrder._id && docAgg.processingOrder._id === x.processingOrder._id) && docAgg.key === x.key) : null
                if (actionDocAggregate) {
                    actionDocAggregate.aggregates = [...actionDocAggregate.aggregates, ...docAgg.aggregates]
                } else {
                    aggs.documentAggregates.push(docAgg)
                }
            }
        }
        return aggs
    }

    //////////////////////////////////////////////////////////
    /// TRANSACTION
    //////////////////////////////////////////////////////////

    public async insertTransaction(transaction: ChainTransaction) {
        if (this.isNodeApp) {
            let newTx = { ...transaction } as ChainTransaction;

            // const transactions = await this.listTransactionsForOrganization(transaction.organizationId);
            // if (await this.checkForDuplicateLotNumbersInTransactionInsideOrganization(transaction._id, transaction.internalLotNumber, transactions.items, true)) {
            //     throw Error("Internal lot number already exists")
            // }
            // if (await this.checkForDuplicateLotNumbersInTransactionInsideOrganization(transaction._id, transaction.lotNumber, transactions.items, false)) {
            //     throw Error("External lot number already exists")
            // }

            // POZOR: to na CouchDB ne dela pravilno zaradi concurencya.
            // NA CouchDB bo to lahko povzročilo nekonsistence.
            // Na smart contractu pa ne bo problemov
            // const sourceStockOrder = await this.getStockOrder(transaction.sourceStockOrderIds[0]);
            const sourceStockOrder = await this.getStockOrder(transaction.sourceStockOrderId, true, true);
            // const targetStockOrder = await this.getStockOrder(transaction.targetStockOrderIds[0]);
            const targetStockOrder = await this.getStockOrder(transaction.targetStockOrderId, true, true);
            // Auto settings
            newTx = { ...newTx, ...this.timestamp(newTx) }

            newTx.inputMeasureUnitType = sourceStockOrder.measurementUnitType;
            if (newTx.isProcessing) {
                newTx.outputMeasureUnitType = newTx.inputMeasureUnitType;
            } else {
                newTx.outputMeasureUnitType = targetStockOrder.measurementUnitType;
            }

            newTx.sourceFacilityId = sourceStockOrder.facilityId;
            newTx.targetFacilityId = targetStockOrder.facilityId;

            if (sourceStockOrder.semiProductId) {
                newTx.semiProductId = sourceStockOrder.semiProductId;
            }
            if (!newTx.isProcessing && targetStockOrder.semiProductId !== newTx.semiProductId) {
                throw Error("Target semi product does not match source semi product.")
            }

            const tx = new ChainTransactionDB(newTx);

            // Pre check
            // const soDB = new ChainStockOrderDB()
            // if (sourceStockOrder.availableQuantity < transaction.inputQuantity) throw Error("To low available quantity")
            // if (!newTx.isProcessing) {
            //     if (targetStockOrder.fullfilledQuantity + transaction.outputQuantity > targetStockOrder.totalQuantity) {
            //         throw Error("Transaction has to large quantity in regard to the order.")
            //     }
            //     targetStockOrder.fullfilledQuantity += transaction.outputQuantity;
            // }
            // sourceStockOrder.availableQuantity -= transaction.inputQuantity;


            // const sourceOrders = await soDB.readForIds(this.dbService, transaction.sourceStockOrderIds);
            // const sourceOrders = await soDB.readForIds(this.dbService, [transaction.sourceStockOrderId]);
            // if (sourceAvailableQuantity < transaction.inputQuantity) throw Error("To low available quantity")
            // const targetOrders = await soDB.readForIds(this.dbService, transaction.targetStockOrderIds);
            // const targetOrders = await soDB.readForIds(this.dbService, [transaction.targetStockOrderId]);
            // if (targetFulfilledQuantity + transaction.outputQuantity > targetTotalQuantity) throw Error("Transaction has to large quantity in regard to the order.")
            // TODO: check unit


            // for (const so of sourceOrders) {
            //     so.availableQuantity = 0;
            //     await this.insertStockOrder(so);
            // }
            // if (!transaction.isProcessing) {
            //     for (const so of targetOrders) {
            //         await this.insertStockOrder(so);
            //     }
            // }

            // Save orders after transaction is inserted to refresh availability
            const outRes = await getResponseValue(tx.save(this.dbService));
            // console.log("Saving transaction", outRes._id)
            const res1 = await this.insertStockOrder(sourceStockOrder, true)
            // console.log("Saving source order: ", res1._id)
            if (!newTx.isProcessing) {
                const res2 = await this.insertStockOrder(targetStockOrder, true)
                // console.log("Saving target order: ", res2._id)
            }
            return outRes
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(transaction)
        }
    }




    public async getTransaction(id: string): Promise<ChainTransaction> {
        const org = new ChainTransactionDB()
        const res = await getResponseValue(org.read(this.dbService, id))
        if (res.inputMeasureUnitType) {
            res.inputMeasureUnitType = await this.getMeasureUnitType(res.inputMeasureUnitType._id)
        }
        if (res.outputMeasureUnitType) {
            res.outputMeasureUnitType = await this.getMeasureUnitType(res.outputMeasureUnitType._id)
        }
        return res
    }
    // TODO check due to model change
    public async listInputTransactions(stockOrderId: string, filters?: ViewFilterParams, writeDatabase = false, lastVersionPurpose = false): Promise<PaginatedList<ChainTransaction>> {
        const org = new ChainTransactionDB()
        const res = await org.readAll(this.dbService, 'input_transactions', 'input_transactions', filters, [stockOrderId], null, writeDatabase)
        if (!lastVersionPurpose) {
            await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'inputMeasureUnitType._id', 'inputMeasureUnitType')
            await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'outputMeasureUnitType._id', 'outputMeasureUnitType')
            await this.extractForIds<ChainStockOrder>(res.items, new ChainStockOrderDB(), 'sourceStockOrderId', 'sourceStockOrder')
        }
        return res
    }
    // TODO check due to model change
    public async listOutputTransactions(stockOrderId: string, filters?: ViewFilterParams, writeDatabase = false): Promise<PaginatedList<ChainTransaction>> {
        const org = new ChainTransactionDB()
        const res = await org.readAll(this.dbService, 'output_transactions', 'output_transactions', filters, [stockOrderId], null, writeDatabase)
        await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'inputMeasureUnitType._id', 'inputMeasureUnitType')
        await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'outputMeasureUnitType._id', 'outputMeasureUnitType')
        return res
    }

    public async listTransactionsForOrganization(organizationId: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainTransaction>> {
        const org = new ChainTransactionDB()
        const res = await org.readAll(this.dbService, 'organization_id', 'organization_id', filters, [organizationId])
        await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'inputMeasureUnitType._id', 'inputMeasureUnitType')
        await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'outputMeasureUnitType._id', 'outputMeasureUnitType')
        return res
    }

    public async deleteTransaction(transaction: ChainTransaction): Promise<any> {
        if (this.isNodeApp) {
            // TODO: check dependencies
            // let response = await this.listInputTransactions(stockOrder._id, {limit: 1, offset: 0})
            // if(response.count > 0) throw Error("Cannot delete stock order. Stock order contains input transactions.")
            let sourceOrder = null
            let targetOrder = null
            if (transaction.sourceStockOrderId) {
                try {
                    sourceOrder = await this.getStockOrder(transaction.sourceStockOrderId, true, true).catch(e => null)
                    sourceOrder.availableQuantity = Math.min(sourceOrder.availableQuantity + transaction.inputQuantity, sourceOrder.totalQuantity)
                } catch (e) {
                    sourceOrder = null;
                }
            }
            if (!transaction.isProcessing && transaction.targetStockOrderId) {
                try {
                    targetOrder = await this.getStockOrder(transaction.targetStockOrderId, true, true).catch(e => null)
                    targetOrder.fullfilledQuantity = Math.max(targetOrder.fullfilledQuantity - transaction.outputQuantity, 0)
                } catch (e) {
                    targetOrder = null
                }
            }
            const org = new ChainTransactionDB(transaction);
            let res = await org.delete(this.dbService);
            if (sourceOrder) {
                res = await this.insertStockOrder(sourceOrder, true);
            }
            if (!transaction.isProcessing && targetOrder) {
                res = await this.insertStockOrder(targetOrder, true)
            }
            return res // maybe list of res?
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(transaction)
        }
    }

    public async deleteTransactions(transactions: ChainTransaction[]) {
        if (this.isNodeApp) {
            const resList = []
            for (const tx of transactions) {
                const res = await this.deleteTransaction(tx)
                resList.push(res)
            }
            return resList
        }
        if (this.isBlockchainApp) {
            throw Error("Not yet implemented!")
        }

    }

    public async cancelTransactions(transactionId: string, rejection: string) {
        const transaction = await this.getTransaction(transactionId);
        transaction.status = 'CANCELED';
        transaction.inputQuantity = 0;
        transaction.outputQuantity = 0;
        transaction.rejectComment = rejection;
        const res = await this.insertTransaction(transaction);
        return res;
    }

    public async approveTransactions(transactionId: string) {
        const transaction = await this.getTransaction(transactionId);
        transaction.status = 'EXECUTED';
        const res = await this.insertTransaction(transaction);
        return res;
    }

    public async listTransactionsForFacilitiesAndSemiproductAndLastChange(
        sourceFacilityId: string, targetFacilityId: string, semiProductId: string,
        startLastChange: string, endLastChange: string, query: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainTransaction>> {
        // let view = 'transaction_source_facility_target_facility_semiproduct_date';
        let view = ""
        if (sourceFacilityId && semiProductId) {
            view = "transaction_source_facility_semiproduct_date"
        } else if (targetFacilityId && semiProductId) {
            view = "transaction_target_facility_semiproduct_date"
        } else if (semiProductId) {
            view = "transaction_semiproduct_date"
        } else {
            view = "transaction_date"
        }

        const desc: boolean = filters && filters.sort === 'DESC' ? true : false
        const startkeyDef: any[] = [];
        const endkeyDef: any[] = [];

        if (sourceFacilityId) {
            startkeyDef.push(sourceFacilityId);
            endkeyDef.push(sourceFacilityId)
        } else if (targetFacilityId) {
            startkeyDef.push(targetFacilityId);
            endkeyDef.push(targetFacilityId)
        }
        if (semiProductId) {
            startkeyDef.push(semiProductId);
            endkeyDef.push(semiProductId)
        }
        if (startLastChange) {
            startkeyDef.push(startLastChange)
        } else {
            startkeyDef.push(null)
        }

        if (endLastChange) {
            endkeyDef.push(endLastChange)
        } else {
            endkeyDef.push({})
        }

        // if (query && query.length > 0) {
        //     const q = query.toLowerCase()
        //     startkeyDef.push(q);
        //     endkeyDef.splice(1, 0, q + "\ufff0")
        // }

        // console.log("startKey", startkeyDef)
        // console.log("endKey", endkeyDef)

        const response = await this.dbService.readDatabase.view('customs', view, {
            startkey: startkeyDef,
            endkey: endkeyDef,
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: filters && filters.limit ? filters.limit : undefined,
            skip: filters && filters.offset ? filters.offset : undefined
        })
        const countResponse = await this.dbService.readDatabase.view('customs', view, {
            startkey: startkeyDef,
            endkey: endkeyDef,
            sorted: true,
            descending: desc,
        })
        const count = countResponse.rows && countResponse.rows.length;
        const items = response.rows.map(doc => (new DBDocument<ChainTransaction>((doc as any).doc)).value as ChainTransaction)
        await this.extractForIds<ChainSemiProduct>(items, new ChainSemiProductDB(), 'semiProductId', 'semiProduct')
        await this.extractForIds<ChainMeasureUnitType>(items, new ChainMeasureUnitTypeDB(), 'semiProduct.measurementUnitType._id', 'semiProduct.measurementUnitType')
        await this.extractForIds<ChainFacility>(items, new ChainFacilityDB(), 'sourceFacilityId', 'sourceFacility')
        await this.extractForIds<ChainFacility>(items, new ChainFacilityDB(), 'targetFacilityId', 'targetFacility')
        await this.extractForIds<ChainMeasureUnitType>(items, new ChainMeasureUnitTypeDB(), 'inputMeasureUnitType._id', 'inputMeasureUnitType')
        await this.extractForIds<ChainMeasureUnitType>(items, new ChainMeasureUnitTypeDB(), 'outputMeasureUnitType._id', 'outputMeasureUnitType')

        return new PaginatedList<ChainTransaction>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)

    }

    public async insertOrUpdateStockOrdersWithInputTransactions(order: ChainStockOrder) {
        const transactions = order.inputTransactions;
        // Exists
        let currentOrder: ChainStockOrder;
        let inserted = false;
        if (order._id) {
            currentOrder = await this.getStockOrder(order._id, true)   // we need also inputTransactions
        } else {
            if (order.fullfilledQuantity && order.fullfilledQuantity > 0) throw Error("Fulfilled quantity must be 0")
            currentOrder = await this.insertStockOrder(order)
            inserted = true;
        }
        if (order.orderType !== 'GENERAL_ORDER' && order.orderType !== 'SALES_ORDER') {
            throw Error("Order must be of orderType GENERAL_ORDER or SALES_ORDER to allow input transactions")
        }
        order.totalQuantity = order.totalQuantity;
        // Do not mess with quantities - transactions will take care of it.
        order.availableQuantity = currentOrder.availableQuantity
        order.fullfilledQuantity = currentOrder.fullfilledQuantity
        transactions.forEach(x => {
            if (x._id && x.targetStockOrderId !== currentOrder._id) throw Error("Invalid transaction")
        })

        const currentInputTransactions = currentOrder.inputTransactions || []
        const newIds = new Set(transactions.map(x => x._id).filter(x => x));
        const toDeleteTxs = currentInputTransactions.filter(x => x._id && !newIds.has(x._id))
        const toUpdateTxs = transactions.filter(x => newIds.has(x._id))
        const newTxs = transactions.filter(x => !(x._id))

        newTxs.forEach(x => {
            x.targetStockOrderId = currentOrder._id
        })
        if (!inserted) {
            currentOrder = await this.insertStockOrder(order)
        }
        for (const tx of toDeleteTxs) {
            await this.deleteTransaction(tx)
        }
        for (const tx of toUpdateTxs) {
            await this.insertTransaction(tx)
        }
        for (const tx of newTxs) {
            await this.insertTransaction(tx)
        }
        return currentOrder
    }


    public async insertOrUpdateProcessingOrderWithWithInputTransactionsAndOutputStockOrders(processingOrders: ChainProcessingOrder[]) {
        for (const procOrder of processingOrders) {
            const transactions = procOrder.inputTransactions;
            // Exists
            let currentProcOrder: ChainProcessingOrder;
            let inserted = false;
            if (procOrder._id) {
                currentProcOrder = await this.getProcessingOrder(procOrder._id, true)
            } else {
                // delete order.inputTransactions
                currentProcOrder = await this.insertProcessingOrder(procOrder)
                inserted = true;
            }
            // determine transaction type
            const action = await this.getProcessingAction(procOrder.processingActionId)
            if (action.type === 'SHIPMENT') {
                const ord = procOrder.targetStockOrders[0]
                ord.processingOrderId = currentProcOrder._id;
                ord.processingActionId = procOrder.processingActionId
                const insOrd = await this.insertOrUpdateStockOrdersWithInputTransactions(ord)
                currentProcOrder.targetStockOrderIds = [insOrd._id]
                await this.insertProcessingOrder(
                    {
                        ...currentProcOrder,
                        processingDate: procOrder.processingDate
                    }
                )
                continue;
                // ends here!!!
            }
            if (action.type === 'PROCESSING') {
                transactions.forEach(x => {
                    if (x._id && x.targetStockOrderId !== currentProcOrder._id) {
                        throw Error("Invalid transaction")
                    }
                })
            }
            if (action.type === 'TRANSFER') {
                const trLen = transactions ? transactions.length : 0
                const soLen = procOrder.targetStockOrders.length
                if (trLen !== soLen) throw Error("Number of input transactions must match number of target orders")
                for (let i = 0; i < trLen; i++) {
                    if (procOrder.targetStockOrders[i]._id) {
                        if (transactions[i].targetStockOrderId !== procOrder.targetStockOrders[i]._id) throw Error(`Transaction on index ${ i } does not match to target order ${ procOrder.targetStockOrders[i]._id }`)
                    }
                    (transactions[i] as any).__position = i;
                }
            }


            const currentInputTransactions = currentProcOrder.inputTransactions ? currentProcOrder.inputTransactions : []
            const newIds = new Set(transactions.map(x => x._id).filter(x => x));
            const toDeleteTxs = currentInputTransactions.filter(x => !newIds.has(x._id))
            const toUpdateTxs = transactions.filter(x => newIds.has(x._id))
            const newTxs = transactions.filter(x => !(x._id))
            newTxs.forEach(x => {
                x.targetStockOrderId = currentProcOrder._id
            })
            // Check if one can decrease existing stock orders
            if (!procOrder._id) { // insert, no existing target stock orders yet in database. To be inserted
                currentProcOrder.targetStockOrders = [] as ChainStockOrder[]
            }
            const stockOrderIdsInPost = new Set(procOrder.targetStockOrders.map(x => x._id).filter(x => x))
            const stockOrdersToDelete = currentProcOrder.targetStockOrders.filter(x => !stockOrderIdsInPost.has(x._id))
            const stockOrdersToUpdate = currentProcOrder.targetStockOrders.filter(x => stockOrderIdsInPost.has(x._id))

            // for (const so of stockOrderIdsInPost) {
            //     console.log("PST", so)
            // }


            // for (const so of stockOrdersToDelete) {
            //     console.log("DEL", so._id, so.totalQuantity)
            // }
            // for (const so of stockOrdersToUpdate) {
            //     console.log("UPD", so._id, so.totalQuantity)
            // }

            // check if one can delete old stock orders

            // check if one can decrease non deleted stock orders if necessary

            for (const stockOrder of procOrder.targetStockOrders) {
                let currentStockOrder: ChainStockOrder;
                if (stockOrder._id) {
                    currentStockOrder = stockOrdersToUpdate.find(x => x._id === stockOrder._id)
                    if (currentStockOrder) {
                        const diff = currentStockOrder.totalQuantity - stockOrder.totalQuantity
                        if (diff < 0) {
                            const usedQuantity = currentStockOrder.fullfilledQuantity - currentStockOrder.availableQuantity
                            if (stockOrder.totalQuantity < usedQuantity) throw Error("Cannot decrease stock order")
                        }
                    }
                    currentStockOrder = stockOrdersToDelete.find(x => x._id === stockOrder._id)
                    if (currentStockOrder) {
                        const usedQuantity = currentStockOrder.fullfilledQuantity - currentStockOrder.availableQuantity
                        if (usedQuantity > 0) {
                            throw Error("Cannot delete used stock order")
                        }
                    }
                    // await this.getStockOrder(stockOrder._id, true)
                }
            }

            currentProcOrder.targetStockOrderIds = []
            for (const [index, stockOrder] of procOrder.targetStockOrders.entries()) {
                // if (stockOrder._id) {
                //     currentOrder.targetStockOrderIds.push(stockOrder._id)
                // } else {
                // console.log("SAVING:", index, stockOrder._id, stockOrder.totalQuantity)
                stockOrder.processingOrderId = currentProcOrder._id;
                stockOrder.processingActionId = procOrder.processingActionId
                const currentStockOrder = await this.insertStockOrder(stockOrder)
                // console.log("SAVED:", currentStockOrder._id)
                currentProcOrder.targetStockOrderIds.push(currentStockOrder._id)
                // }
            }

            for (const tx of toDeleteTxs) {   // transactions must be deleted before deleting stock order (for TRANSFER)
                await this.deleteTransaction(tx)
            }

            for (const stockOrder of stockOrdersToDelete) {
                // console.log("DELETING", stockOrder)
                const lastVersion = await this.getStockOrder(stockOrder._id, true, true)
                await this.deleteStockOrder(lastVersion)
            }
            // console.log("XXX4-del", toDeleteTxs)

            currentProcOrder = await this.insertProcessingOrder({
                ...currentProcOrder,
                processingDate: procOrder.processingDate
            })
            // for (const tx of toDeleteTxs) {
            //     await this.deleteTransaction(tx)
            // }
            if (action.type === 'PROCESSING') {
                for (const tx of toUpdateTxs) {
                    tx.targetStockOrderId = currentProcOrder._id;
                    await this.insertTransaction(tx)
                }

                for (const tx of newTxs) {
                    tx.targetStockOrderId = currentProcOrder._id;
                    await this.insertTransaction(tx)
                }
            }
            if (action.type === 'TRANSFER') {
                for (const tx of toUpdateTxs) {
                    const pos = (tx as any).__position
                    delete (tx as any).__position
                    tx.targetStockOrderId = currentProcOrder.targetStockOrderIds[pos]
                    await this.insertTransaction(tx)
                }
                // console.log("XXX5-new", newTxs)
                for (const tx of newTxs) {
                    const pos = (tx as any).__position
                    delete (tx as any).__position
                    tx.targetStockOrderId = currentProcOrder.targetStockOrderIds[pos]
                    await this.insertTransaction(tx)
                }
            }
        }
    }

    // public async getInputTransactions(productUnitId: string): Promise<ChainTransaction[]> {
    //     // const db = this.dbService.connection.use('transaction');
    //     return this.dbService.database.view('input_transactions', 'input_transactions', {
    //         // group: true,
    //         reduce: false,
    //         key: ['transaction', productUnitId],
    //         include_docs: true
    //     }).then(
    //         resp => resp.rows.map((x: any) => new DBDocument<ChainTransaction>(x.doc).value),
    //         reason => Promise.reject(reason)
    //     )
    // }

    // public async getOutputTransactions(productUnitId: string): Promise<ChainTransaction[]> {
    //     // const db = this.dbService.connection.use('transaction');
    //     return this.dbService.database.view('output_transactions', 'output_transactions', {
    //         // group: true,
    //         reduce: false,
    //         key: ['transaction', productUnitId],
    //         include_docs: true
    //     }).then(
    //         resp => resp.rows.map((x: any) => new DBDocument<ChainTransaction>(x.doc).value),
    //         reason => Promise.reject(reason)
    //     )
    // }

    // public async getStock(facilityId: string) {

    // }


    public async getB2CDataForStockOrderCached(stockOrderId: string, orderId: boolean, cooperative: boolean, cuppingGrade: boolean): Promise<any> {

        // const org = new ChainStockOrderDB()
        // const stockOrder = await getResponseValue(org.read(this.dbService, stockOrderId, false))

        const stockOrder = {...this.historyCache.getForKey<ChainStockOrder>(stockOrderId)}
        this.historyCache.enrichStockOrder(stockOrder)
        const result = [];
        // if (orderId && stockOrder.orderId) {
        //     stockOrder.productOrder = await this.getOrder(stockOrder.orderId, false)
        //     result.push({ orderId: stockOrder.productOrder.id })
        // }
        if (orderId && stockOrder.orderId) {
            stockOrder.productOrder = {...this.historyCache.getForKey<ChainProductOrder>(stockOrder.orderId)}
            this.historyCache.enrichProductOrder(stockOrder.productOrder)
            result.push({ orderId: stockOrder.productOrder.id })
        }

        let history = null;
        if (cooperative) {
            // history = await this.aggregatesForStockOrderId(stockOrderId);
            history = await this.aggregatesForStockOrderIdCached(stockOrderId, null, false);
            const len = history.length;
            if (len >= 1) {
                const purchaseOrders = history[len - 1];
                if (purchaseOrders.stockOrderAggs.length >= 1) {
                    result.push({ cooperativeAFId: purchaseOrders.stockOrderAggs[0].stockOrder.organization.id, cooperativeName: purchaseOrders.stockOrderAggs[0].stockOrder.organization.name })
                }
            }

        }

        if (cuppingGrade) {
            // if (!history) history = await this.aggregatesForStockOrderId(stockOrderId);
            if (!history) history = await this.aggregatesForStockOrderIdCached(stockOrderId);
            const len = history.length;
            let gradeFound: boolean = false;
            let flavourFound: boolean = false;
            if (len >= 1) {
                for (const item of history) {
                    for (const agg of item.stockOrderAggs) {
                        if (agg.fields.length > 0) {
                            for (const field of agg.fields) {
                                if (!gradeFound && field.fieldID === "CUPPING_GRADE") {
                                    result.push({ grade: parseFloat(field.value.toString()) })
                                    gradeFound = true;
                                }
                                if (!flavourFound && field.fieldID === "CUPPING_FLAVOUR") {
                                    result.push({ flavour: field.value.toString() })
                                    flavourFound = true;
                                }
                                if (gradeFound && flavourFound) {
                                    break;
                                }

                            }
                        }
                    }
                }
            }
        }

        return result;
    }


    async getSeasonalStatisticsForOrganization(organizationId: string, fromDate: string, toDate: string, specificOrder: string): Promise<any> {
        let ordersTotal = 0;
        let advancedPayment = 0;
        let cherryPayment = 0;
        let bonusPayment = 0;
        let premiumPayment = 0;
        let checkedStockOrderList: string[] = [];
        let productionDate = null;

        if (specificOrder) {
            const res = await this.getSeasonalPartialresults(specificOrder, checkedStockOrderList);
            checkedStockOrderList = res.checkedStockOrderList;
            ordersTotal += res.ordersTotal;
            advancedPayment += res.advancedPayment;
            cherryPayment += res.cherryPayment;
            bonusPayment += res.bonusPayment;
            premiumPayment += res.premiumPayment;
            if (productionDate === null) productionDate = res.productionDate;
        } else {
            const quoteOrders = await this.listOpenQuoteOrders(organizationId, null, false, { sort: null, limit: 1000, offset: 0, sortBy: 'productionDate' }, 'organization', fromDate, toDate);
            if (quoteOrders && quoteOrders.items) {
                for (const item of quoteOrders.items) {
                    const res = await this.getSeasonalPartialresults(item._id, checkedStockOrderList);
                    checkedStockOrderList = res.checkedStockOrderList;
                    ordersTotal += res.ordersTotal;
                    advancedPayment += res.advancedPayment;
                    cherryPayment += res.cherryPayment;
                    bonusPayment += res.bonusPayment;
                    premiumPayment += res.premiumPayment;
                    if (productionDate === null) productionDate = res.productionDate;
                }
            }
        }
        let sum = 0;
        if (productionDate && productionDate.length >= 4) {
            const year = productionDate.substring(0, 4);
            const stockOrderList = await this.listAllStockOrdersForOrganization(organizationId, true, null, null, null, null, year + "-01-01", year + "-12-31", null, { limit: 1000 });
            if (stockOrderList && stockOrderList.items) {
                sum = stockOrderList.items.map(o => o.totalQuantity).reduce((a, c) => a + c);
            }

        }
        return { totalSeason: sum, totalOrder: ordersTotal, paymentAdvanced: advancedPayment, paymentCherry: cherryPayment, paymentBonus: bonusPayment, paymentPremium: premiumPayment };
    }

    async getSeasonalPartialresults(soId: string, checkedStockOrderList: string[]) {
        let ordersTotal = 0;
        let advancedPayment = 0;
        let cherryPayment = 0;
        let bonusPayment = 0;
        let premiumPayment = 0;
        let productionDate = null;
        // const resAgg = await this.aggregatesForStockOrderId(soId);
        const resAgg = await this.aggregatesForStockOrderIdCached(soId);
        if (resAgg) {
            const len = resAgg.length;
            for (const so of resAgg[len - 1].stockOrderAggs) {
                if (checkedStockOrderList.includes(so.stockOrder._id)) continue;
                checkedStockOrderList.push(so.stockOrder._id)
                if (productionDate === null) productionDate = so.stockOrder.productionDate;
                const resPayments = await this.listPaymentsForStockOrder(so.stockOrder._id);
                if (resPayments && resPayments.items) {
                    for (const pay of resPayments.items) {
                        if (pay.paymentPurposeType === 'FIRST_INSTALLMENT') {
                            cherryPayment += pay.amount;
                        } else if (pay.paymentPurposeType === 'SECOND_INSTALLMENT') {
                            bonusPayment += pay.amount;
                        } else if (pay.paymentPurposeType === 'ADVANCE_PAYMENT') {
                            advancedPayment += pay.amount;
                        } else if (pay.paymentPurposeType === 'WOMEN_PREMIUM') {
                            premiumPayment += pay.amount;
                        }
                    }
                }
                ordersTotal += so.stockOrder.totalQuantity;
            }
        }
        return { checkedStockOrderList, cherryPayment, bonusPayment, advancedPayment, premiumPayment, ordersTotal, productionDate }
    }

    //////////////////////////////////////////////////////////
    /// PROCESSING ORDER
    //////////////////////////////////////////////////////////


    public async insertProcessingOrder(poOrder: ChainProcessingOrder) {
        if (this.isNodeApp) {
            const newPO = { ...poOrder, ...this.timestamp(poOrder) } as ChainProcessingOrder;
            const org = new ChainProcessingOrderDB(newPO);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(poOrder)
        }
    }

    public async getProcessingOrder(id: string, writeDatabase = false, ignoreNoInputTransactions = false, lastVersionPurpose = false): Promise<ChainProcessingOrder> {
        console.log("START")
        const org = new ChainProcessingOrderDB()
        const po = await getResponseValue(org.read(this.dbService, id, writeDatabase))
        const action = await this.getProcessingAction(po.processingActionId, writeDatabase, lastVersionPurpose).catch(e => null)
        po.processingAction = action
        if (!lastVersionPurpose) {
            console.log("START-2")
            const ord = new ChainStockOrderDB()
            po.targetStockOrders = await ord.readForIds(this.dbService, po.targetStockOrderIds, writeDatabase)
            po.inputTransactions = []
            if (action && action.type === 'PROCESSING') {
                console.log("PROCESSING")
                let offset = 0
                const limit = 1000
                po.inputTransactions = []
                console.log("TRANSACTION LOOP")
                while (true) {
                    const inTxsPages = await this.listInputTransactions(po._id, { limit, offset }, writeDatabase)
                    po.inputTransactions.push(...inTxsPages.items)
                    const count = inTxsPages.count
                    offset += limit;
                    if (offset >= count) break
                }
                console.log("TRANSACTION LOOP END")
            }
            if (action && action.type === 'TRANSFER') {
                po.inputTransactions = await Promise.all(po.targetStockOrders.map(async (so) => {
                    const inTxsPages = await this.listInputTransactions(so._id, { limit: 2, offset: 0 }, true)
                    if (inTxsPages.count === 0) {
                        if (!ignoreNoInputTransactions) throw Error("No transaction to TRANSFER order.")
                    }
                    if (inTxsPages.count > 1) throw Error("Multiple transactions to TRANSFER order.")
                    return inTxsPages.items[0]
                }))
                // for (const order of po.targetStockOrders) {
                //     const inTxsPages = await this.listInputTransactions(order._id, { limit: 2, offset: 0 }, true)
                //     if (inTxsPages.count === 0) {
                //         if (!ignoreNoInputTransactions) throw Error("No transaction to TRANSFER order.")
                //     }
                //     if (inTxsPages.count > 1) throw Error("Multiple transactions to TRANSFER order.")
                //     po.inputTransactions.push(inTxsPages.items[0])
                // }
            }
            const org2 = new ChainStockOrderDB()
            console.log("INPUT ORDERS")
            po.inputOrders = await org2.readForIds(this.dbService, po.inputTransactions.map(tx => tx.sourceStockOrderId), writeDatabase)
            if (po.desiredQuantityUnit) {
                po.desiredQuantityUnit = await this.getMeasureUnitType(po.desiredQuantityUnit._id)
            }
            console.log("END IF")
        }
        return po

    }

    public async listProcessingOrders(filters?: ViewFilterParams): Promise<PaginatedList<ChainProcessingOrder>> {
        const org = new ChainProcessingOrderDB()
        const res = await org.readAll(this.dbService, 'last_change', 'last_change', filters, [null], [{}])
        // const res = await org.readAll(this.dbService, null, null, filters)
        await this.extractForIdLists<ChainStockOrder>(res.items, new ChainStockOrderDB(), 'targetStockOrderIds', 'targetStockOrders')
        await this.extractForIds<ChainFacility>(res.items, new ChainFacilityDB(), 'facilityId', 'facility')
        await this.extractForIds<ChainProcessingAction>(res.items, new ChainProcessingActionDB(), 'processingActionId', 'processingAction')
        await this.addInputTransactionsForStockOrProcessingOrders(res.items, 'inputTransactions')
        await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'desiredQuantityUnit._id', 'desiredQuantityUnit')
        return res
    }

    // E.g. template:
    // {
    //     field1: null,
    //     field2: {
    //         field3: null,
    //         field4: null
    //     }
    // }
    // Must match to object structure. The function takes a sub structure.
    stripObjectByTemplate(obj: any, template: any) {
        const templateCopy = JSON.parse(JSON.stringify(template))
        for (const key of Object.keys(template)) {
            if (templateCopy[key] === null) {
                templateCopy[key] = obj[key]
            } else {
                templateCopy[key] = this.stripObjectByTemplate(obj[key], template[key])
            }
        }
        return templateCopy
    }

    getNestedObject<T>(obj: any, path: string): T {
        return getNestedObjectRec(obj, path.split("."))
    }

    setNestedObject(obj: any, path: string, value: any) {
        return setNestedObjectRec(obj, path.split("."), value)
    }


    // function getNestedObject(obj, path) {
    //     console.log("TO NEST", obj, path)
    //     if(!path || path.length === 0) throw Error("Invalid nested path.")
    //     if(path.length === 1) return obj[path[0]]
    //     console.log("PTH0:", path[0])
    //     return this.getNestedObject(obj[path[0]], path.slice(1))
    // }

    // function setNestedObject(obj, path, value) {
    //     if(!path || path.length === 0) throw Error("Invalid nested path.")
    //     if(path.length === 1) {
    //         obj[path[0]] = value
    //         return
    //     }
    //     this.setNestedObject(obj[path[0]], path.slice(1), value)
    // }


    async extractForIds<T>(items: any[], objectClass: DBDocument<T>, inputIdField: string, outputField: string, template: any = null) {
        // const targetIds = [... new Set(items.map(val => val[inputIdField]))]
        const targetIds = [... new Set(items.map(val => this.getNestedObject<string>(val, inputIdField)))].filter(x => x)
        const entities = await objectClass.readForIds(this.dbService, targetIds)
        const mp = new Map<string, T>();
        entities.forEach(val => {
            const id = (val as DocType)._id
            if (id) {
                mp.set(id, val)
            }
        })
        items.forEach(item => {
            const entity = mp.get(this.getNestedObject<string>(item, inputIdField))
            if (entity) {
                if (template) {
                    // item[outputField] = this.stripObjectByTemplate(entity, template)
                    this.setNestedObject(item, outputField, this.stripObjectByTemplate(entity, template))
                } else {
                    this.setNestedObject(item, outputField, entity)
                    // item[outputField] = entity
                }
            }
        })
    }

    async extractForIdLists<T>(items: any[], objectClass: DBDocument<T>, inputIdField: string, outputArrayField: string) {
        const targetIds = new Set<string>()
        items.forEach((item: any) => {
            if (item[inputIdField]) {
                (item[inputIdField] as string[]).forEach(key => {
                    targetIds.add(key)
                })
            }
        })
        const targetObjects = await objectClass.readForIds(this.dbService, [...targetIds])
        const mp = new Map<string, T>();
        (targetObjects as T[]).forEach(val => mp.set((val as DocType)._id, val as T))
        items.forEach(item => {
            const res: any = []
            if (item[inputIdField]) {
                (item[inputIdField] as string[]).forEach(key => {
                    res.push(mp.get(key))
                })
            }
            item[outputArrayField] = res
        })
    }

    async addInputTransactionsForStockOrProcessingOrders(items: any[], transactionsFieldName: string) {
        await Promise.all(
            items.map(async (item: any) => {
                const pagedTxs = await this.listInputTransactions(item._id)
                item[transactionsFieldName] = pagedTxs.items
            })
        )
    }

    public async listAllProcessingOrdersInFacility(facilityId: string, query?: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainProcessingOrder>> {
        const view = 'processing_order_by_facility_with_query';

        const desc: boolean = filters && filters.sort === 'DESC' ? true : false
        const startkeyDef = [facilityId];
        const endkeyDef = [facilityId, {}];

        // if (query && query.length > 0) {
        //     const q = query.toLowerCase()
        //     startkeyDef.push(q);
        //     endkeyDef.splice(1, 0, q + "\ufff0")
        // }

        const response = await this.dbService.readDatabase.view('customs', view, {
            startkey: startkeyDef,
            endkey: endkeyDef,
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: filters && filters.limit ? filters.limit : undefined,
            skip: filters && filters.offset ? filters.offset : undefined
        })
        const countResponse = await this.dbService.readDatabase.view('customs', view, {
            startkey: startkeyDef,
            endkey: endkeyDef,
            sorted: true,
            descending: desc,
        })
        const count = countResponse.rows && countResponse.rows.length;
        const items = response.rows.map(doc => (new DBDocument<ChainProcessingOrder>((doc as any).doc)).value as ChainProcessingOrder)

        await this.extractForIdLists<ChainStockOrder>(items, new ChainStockOrderDB(), 'targetStockOrderIds', 'targetStockOrders')
        await this.extractForIds<ChainFacility>(items, new ChainFacilityDB(), 'facilityId', 'facility')
        await this.extractForIds<ChainProcessingAction>(items, new ChainProcessingActionDB(), 'processingActionId', 'processingAction')
        await this.addInputTransactionsForStockOrProcessingOrders(items, 'inputTransactions')
        await this.extractForIds<ChainMeasureUnitType>(items, new ChainMeasureUnitTypeDB(), 'desiredQuantityUnit._id', 'desiredQuantityUnit')

        return new PaginatedList<ChainProcessingOrder>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)

    }

    public async deleteProcessingOrder(poOrder: ChainProcessingOrder): Promise<any> {
        if (this.isNodeApp) {
            // Delete all output orders
            // first check if they are not used
            const dbOrder = new ChainStockOrderDB()
            let orders = await dbOrder.readForIds(this.dbService, poOrder.targetStockOrderIds || [], true)
            // console.log("ORDERS:", orders)
            orders = orders.filter(x => x._id) // readForIds returns empty objects
            for (const order of orders) {
                await this.stockOrderDeleteTestOutputs(order)
            }

            const action = await this.getProcessingAction(poOrder.processingActionId)
            if (action) {
                // Delete all input transactions.
                if (action.type === 'PROCESSING' || action.type === 'SHIPMENT') {
                    const targetId = action.type === 'PROCESSING' ? poOrder._id : orders[0]._id
                    let offset = 0
                    const limit = 1000
                    while (true) {
                        const inTxsPages = await this.listInputTransactions(targetId, { limit, offset }, true)
                        for (const transaction of inTxsPages.items) {
                            await this.deleteTransaction(transaction)
                        }
                        const count = inTxsPages.count
                        offset += limit;
                        if (offset >= count) break
                    }
                }
                if (action.type === 'TRANSFER') {
                    for (const order of orders) {
                        const inTxsPages = await this.listInputTransactions(order._id, { limit: 2, offset: 0 }, true)
                        if (inTxsPages.count === 0) {   // do not bother with this while deleting
                            continue
                            // throw Error("No transaction to TRANSFER order.")
                        }
                        if (inTxsPages.count > 1) throw Error("Multiple transactions to TRANSFER order.")
                        await this.deleteTransaction(inTxsPages.items[0])
                    }
                }
                if (action.type === 'SHIPMENT') {
                    for (const order of orders) {
                        const inTxsPages = await this.listInputTransactions(order._id, { limit: 2, offset: 0 }, true)
                        if (inTxsPages.count === 0) {   // do not bother with this while deleting
                            continue
                            // throw Error("No transaction to TRANSFER order.")
                        }
                        if (inTxsPages.count > 1) throw Error("Multiple transactions to TRANSFER order.")
                        await this.deleteTransaction(inTxsPages.items[0])
                    }
                }

            }

            // Delete stock orders with no transaction on them
            for (const order of orders) {
                // get last revision
                const lastVersion = await this.getStockOrder(order._id, true, true)
                await this.deleteStockOrder(lastVersion)
            }
            // Delete actual order
            const org = new ChainProcessingOrderDB(poOrder);
            const res = org.delete(this.dbService);
            return res
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(poOrder)
        }
    }


    //////////////////////////////////////////////////////////
    /// PAYMENT
    //////////////////////////////////////////////////////////

    public async insertPayment(payment: ChainPayment) {
        if (this.isNodeApp) {

            let stockOrder: ChainStockOrder = null
            const newPayment = { ...payment, ...this.timestamp(payment) } as ChainPayment
            if (payment.stockOrderId) {
                stockOrder = await this.getStockOrder(payment.stockOrderId);

                let recipient = payment.recipientUserCustomerId
                if (payment.paymentPurposeType === 'FIRST_INSTALLMENT' && stockOrder.preferredWayOfPayment === "CASH_VIA_COLLECTOR" && payment.representativeOfRecipientUserCustomerId) recipient = payment.representativeOfRecipientUserCustomerId
                if (payment.paymentType === 'BANK' && recipient && payment.recipientType === 'USER_CUSTOMER') {
                    const userCustomer = await this.getUserCustomer(recipient);
                    if (userCustomer.bankAccountInfo == null ||
                        (userCustomer.bankAccountInfo && !userCustomer.bankAccountInfo.accountNumber))

                        throw Error("Missing bank account information of recipient")
                }

                if (payment.paymentPurposeType === 'FIRST_INSTALLMENT' && payment.amount > stockOrder.balance) {
                    throw Error("Paying amount cannot be greater than balance")
                }

                newPayment.queryPurchaseOrderName = stockOrder.identifier;
                if (stockOrder && stockOrder.facility) { // NOT OK, when facility name changes
                    newPayment.queryFacilityName = stockOrder.facility.name;
                }
                if (stockOrder && !stockOrder.facility && stockOrder.facilityId) {
                    const facility = await this.getFacility(stockOrder.facilityId);
                    if (facility) newPayment.queryFacilityName = facility.name;
                }
            }

            const org = new ChainPaymentDB(newPayment);
            return getResponseValue(org.save(this.dbService)).then(value => {
                if (stockOrder) {
                    const balance = this.balanceForPurchaseOrder(stockOrder);
                    balance.then(b => {
                        stockOrder.balance = b;
                        this.insertStockOrder(stockOrder, true);
                    })
                }
                return value;
            },
                (reject: any) => Promise.reject(reject));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(payment)
        }
    }

    public async getPayment(id: string): Promise<ChainPayment> {
        const org = new ChainPaymentDB();
        return getResponseValue(org.read(this.dbService, id))
    }

    public async listPaymentsForPayingOrganization(payingOrganizationId: string, query: string, sortBy: string, paymentStatus: string, wayOfPayment: string, deliveryDateStart?: string, deliveryDateEnd?: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainPayment>> {
        const desc: boolean = filters && filters.sort === 'DESC' ? true : false;

        const startkeyDef = [payingOrganizationId];
        const endkeyDef = [payingOrganizationId, {}];

        let selectedView = 'payment_by_paying_organization'
        if (sortBy === "PAYMENT_DATE") {
            selectedView = 'payment_by_paying_organization_by_payment_date'
            if (paymentStatus && wayOfPayment) {
                if (deliveryDateStart || deliveryDateEnd) selectedView = "payment_by_paying_organization_by_payment_status_and_by_preffered_way_of_payment_delivery_date_by_payment_date"
                else selectedView = "payment_by_paying_organization_by_payment_status_and_by_preffered_way_of_payment_by_payment_date"
                addKeys(paymentStatus, startkeyDef, endkeyDef);
                addKeys(wayOfPayment, startkeyDef, endkeyDef);
            } else if (wayOfPayment) {
                if (deliveryDateStart || deliveryDateEnd) selectedView = "payment_by_paying_organization_by_preffered_way_of_payment_delivery_date_by_payment_date"
                else selectedView = "payment_by_paying_organization_by_preffered_way_of_payment_by_payment_date"
                addKeys(wayOfPayment, startkeyDef, endkeyDef);
            } else if (paymentStatus) {
                if (deliveryDateStart || deliveryDateEnd) selectedView = "payment_by_paying_organization_by_payment_status_delivery_date_by_payment_date"
                else selectedView = "payment_by_paying_organization_by_payment_status_by_payment_date"
                addKeys(paymentStatus, startkeyDef, endkeyDef);
            } else if (deliveryDateStart || deliveryDateEnd) selectedView = "payment_by_paying_organization_delivery_date_by_payment_date"

            if (deliveryDateStart && deliveryDateEnd) {
                const pos = startkeyDef.length
                startkeyDef.push(deliveryDateStart);
                endkeyDef.splice(pos, 0, deliveryDateEnd)
            } else if (deliveryDateStart) {
                const pos = startkeyDef.length
                startkeyDef.push(deliveryDateStart);
                endkeyDef.splice(pos, 0, deliveryDateStart + "\ufff0")
            }
        } else {
            if (paymentStatus && wayOfPayment) {
                selectedView = "payment_by_paying_organization_by_payment_status_and_by_preffered_way_of_payment"
                addKeys(paymentStatus, startkeyDef, endkeyDef);
                addKeys(wayOfPayment, startkeyDef, endkeyDef);
            } else if (wayOfPayment) {
                selectedView = "payment_by_paying_organization_by_preffered_way_of_payment"
                addKeys(wayOfPayment, startkeyDef, endkeyDef);
            } else if (paymentStatus) {
                selectedView = "payment_by_paying_organization_by_payment_status"
                addKeys(paymentStatus, startkeyDef, endkeyDef);
            }
            if (deliveryDateStart && deliveryDateEnd) {
                const pos = startkeyDef.length
                startkeyDef.push(deliveryDateStart);
                endkeyDef.splice(pos, 0, deliveryDateEnd)
            } else if (deliveryDateStart) {
                const pos = startkeyDef.length
                startkeyDef.push(deliveryDateStart);
                endkeyDef.splice(pos, 0, deliveryDateStart + "\ufff0")
            }
        }

        const response = await this.dbService.readDatabase.view('customs', selectedView, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: query ? undefined : (filters && filters.limit ? filters.limit : undefined),
            skip: query ? undefined : (filters && filters.offset ? filters.offset : undefined)
        })
        const countResponse = await this.dbService.readDatabase.view('customs', selectedView, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
        })

        let count = countResponse.rows && countResponse.rows.length;
        let items = response.rows.map(doc => (new DBDocument<ChainPayment>((doc as any).doc)).value as ChainPayment)

        items = await Promise.all(items.map(async elt => {
            if (elt.stockOrderId) {
                const stockOrder = await getResponseValue(new ChainStockOrderDB().read(this.dbService, elt.stockOrderId, false))
                if (stockOrder.producerUserCustomer) {
                    elt.queryProducerUserCustomerName = stockOrder.producerUserCustomer.name + " " + stockOrder.producerUserCustomer.surname
                }
            }
            if (elt.recipientOrganizationId) {
                const org = await this.getOrganization(elt.recipientOrganizationId);
                elt.recipientOrganization = org;
            }
            return elt;
        }))

        if (query) {
            items = items.filter(obj => {
                if (obj.queryProducerUserCustomerName) {
                    let parts = obj.queryProducerUserCustomerName.split(" ");
                    parts = parts.filter(entry => entry.trim() !== '');
                    if (parts.length === 1 && parts[0].toLowerCase().startsWith(query.toLowerCase())) {
                        return obj;
                    } else if (parts.length >= 2 && (parts[0].toLowerCase().startsWith(query.toLowerCase()) || parts[1].toLowerCase().startsWith(query.toLowerCase()))) {
                        return obj;
                    }
                }
            })
            count = items.length;
            const offset = filters && filters.offset ? filters.offset : 0;
            const limit = filters && filters.limit ? filters.limit : null;
            if (offset != null && limit != null) {
                items = items.slice(offset, offset + limit);
            }
        }

        return new PaginatedList<ChainPayment>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)
    }

    public async listPaymentsForStockOrder(stockOrderId: string, filters?: ViewFilterParams, writeDatabase = false): Promise<PaginatedList<ChainPayment>> {
        const org = new ChainPaymentDB()
        return org.readAll(this.dbService, 'stock_order_id', 'stock_order_id', filters, [stockOrderId], null, writeDatabase)
    }

    public async listPaymentsForRecipientUserCustomer(farmerId: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainPayment>> {
        const view = 'payment_by_farmer_order_by_date';

        const startkeyDef = [farmerId];
        const endkeyDef = [farmerId, {}];
        const desc: boolean = filters && filters.sort === 'DESC' ? true : false;

        const response = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: filters && filters.limit ? filters.limit : undefined,
            skip: filters && filters.offset ? filters.offset : undefined
        })
        const countResponse = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
        })
        const count = countResponse.rows && countResponse.rows.length;
        const items = response.rows.map(doc => (new DBDocument<ChainPayment>((doc as any).doc)).value as ChainPayment)
        return new PaginatedList<ChainPayment>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)
    }

    public async listPaymentsForBankTransfer(id: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainPayment>> {
        // TODO: get payments
        const bt = new ChainBulkPaymentDB();
        const bankTransfer = await getResponseValue(bt.read(this.dbService, id))
        const payment = new ChainPaymentDB();
        return payment.readAll(this.dbService, 'bank_transfer_id', 'bank_transfer_id', filters, [bankTransfer._id])
    }

    public async deletePayment(transaction: ChainPayment): Promise<any> {
        if (this.isNodeApp) {
            // TODO: check dependencies
            const org = new ChainPaymentDB(transaction);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(transaction)
        }
    }

    public async countPayments(): Promise<string> {
        const response = await this.dbService.readDatabase.view('aggregates', 'payments_count', {
            reduce: true
        })
        let count = 0;
        if (response.rows.length > 0) count = response.rows[0].value as number;
        return count.toString();
    }


    public async confirmPayment(payment: ChainPayment) {
        const newPayment = { ...payment } as ChainPayment
        payment.paymentStatus = 'CONFIRMED';
        const org = new ChainPaymentDB(newPayment);
        return getResponseValue(org.save(this.dbService));
    }



    public async insertBulkPayment(bulkPayment: ChainBulkPayment) {
        const newBulkPayment = { ...bulkPayment, ...this.timestamp(bulkPayment) } as ChainBulkPayment
        const org = new ChainBulkPaymentDB(newBulkPayment);
        return getResponseValue(org.save(this.dbService));
    }

    public async getBulkPayment(id: string): Promise<ChainBulkPayment> {
        const org = new ChainBulkPaymentDB();
        const bulkPayment = await getResponseValue(org.read(this.dbService, id));
        const payments = await this.listPaymentsForBankTransfer(bulkPayment._id);
        bulkPayment.payments = payments.items;
        return bulkPayment;
    }

    public async listChainBulkForPayingOrganization(payingOrganizationId: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainBulkPayment>> {
        const org = new ChainBulkPaymentDB()
        return org.readAll(this.dbService, 'paying_organization_id_receipt_number', 'paying_organization_id_receipt_number', filters, [payingOrganizationId])
    }

    public async deleteBulkPayment(bulkPayment: ChainBulkPayment): Promise<any> {
        if (this.isNodeApp) {
            // TODO: check dependencies
            const org = new ChainBulkPaymentDB(bulkPayment);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            this.deleteBC(bulkPayment)
        }
    }



    //////////////////////////////////////////////////////////
    /// DOCUMENT
    //////////////////////////////////////////////////////////

    public insertDocument(document: ChainFileInfo) {
        if (this.isNodeApp) {
            const org = new ChainFileInfoDB(document);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(document)
        }
    }

    public async getDocument(storageKey: string): Promise<ChainFileInfo> {
        const org = new ChainFileInfoDB()
        return getResponseValue(org.read(this.dbService, storageKey))
    }

    public async deleteDocument(document: ChainFileInfo): Promise<any> {
        if (this.isNodeApp) {
            // TODO: check dependencies
            const org = new ChainFileInfoDB(document);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(document)
        }
    }

    //////////////////////////////////////////////////////////
    /// ORDER
    //////////////////////////////////////////////////////////

    public async insertOrder(order: ChainProductOrder) {
        if (this.isNodeApp) {
            // if(order._id) throw Error("Only insertion is allowed, no updates")
            const newOrder = { ...order, ...this.timestamp(order) }
            if (!newOrder.requiredGradeId && newOrder.requiredGrade && newOrder.requiredGrade._id) {
                newOrder.requiredGradeId = newOrder.requiredGrade._id
            }
            if (!newOrder.facilityId && newOrder.facility && newOrder.facility._id) {
                newOrder.facilityId = newOrder.facility._id
            }
            if (!newOrder.customerId && newOrder.customer && newOrder.customer._id) {
                newOrder.customerId = newOrder.customer._id
            }

            let currentOrder: ChainProductOrder;
            let inserted = false;
            let existingItems: ChainStockOrder[] = []
            if (order._id) {
                currentOrder = await this.getOrder(order._id)
                existingItems = currentOrder.items;
            } else {
                const org = new ChainProductOrderDB(newOrder);
                currentOrder = await getResponseValue(org.save(this.dbService));
                inserted = true
            }

            if (order.processingOrders) {
                for (const processingOrder of order.processingOrders) {
                    processingOrder.targetStockOrders[0].orderId = currentOrder._id
                    await this.insertOrUpdateProcessingOrderWithWithInputTransactionsAndOutputStockOrders([processingOrder])
                }
            }


            const orderAgain = await this.getOrder(currentOrder._id, true, true)
            const itms = await this.listOrderItems(currentOrder._id, null, true, true)
            orderAgain.open = itms.items.some(x => x.totalQuantity - x.fullfilledQuantity > 0)
            const org2 = new ChainProductOrderDB(orderAgain);
            return await getResponseValue(org2.save(this.dbService));


            // TODO: delete orders

            // let existingItemsIds = new Set<string>(existingItems.map(x => x._id))
            // let insertItemIds = new Set<string>(order.items.map(x => x._id).filter(x => x))
            // let toDeleteIds = new Set<string>([...existingItemsIds].filter(x => !insertItemIds.has(x)))
            // if (toDeleteIds.size > 0) {
            //     let ordDB = new ChainStockOrderDB()
            //     let stockOrdersToDelete = await ordDB.readForIds(this.dbService, [...toDeleteIds])
            //     if(stockOrdersToDelete.some(x => x.fullfilledQuantity > 0)) throw Error("Order cannot be updated. Some stock orders to be deleted are already fullfiled.")
            //     for (let item of stockOrdersToDelete) {
            //         await this.deleteStockOrder(item)
            //     }
            // }
            // if (order.items) {
            //     for (let item of order.items) {
            //         await this.insertStockOrder({    // make sure relevant fields match with order
            //             ...item,
            //             orderId: currentOrder._id,
            //             facilityId: newOrder.facilityId,
            //             consumerCompanyCustomerId: newOrder.customerId,
            //             deliveryTime: newOrder.deliveryDeadline,
            //             requiredWomensCoffee: newOrder.requiredwomensOnly,
            //             requiredQualityId: newOrder.requiredGradeId
            //         })
            //     }
            // }
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(order)
        }
    }

    public async listOrderItems(orderId: string, filters?: ViewFilterParams, writeDatabase = false, lastVersionPurpose = false): Promise<PaginatedList<ChainStockOrder>> {
        const org = new ChainStockOrderDB()
        const res = await org.readAll(this.dbService, 'quote_orders', 'quote_orders', filters, [orderId], null, writeDatabase)
        if (!lastVersionPurpose) {
            await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'measurementUnitType._id', 'measurementUnitType')
            await this.extractForIds<ChainSemiProduct>(res.items, new ChainSemiProductDB(), 'semiProductId', 'semiProduct')
            await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'semiProduct.measurementUnitType._id', 'semiProduct.measurementUnitType')
        }
        return res
    }


    public async getOrder(id: string, writeDatabase = false, lastVersionPurpose = false): Promise<ChainProductOrder> {
        const org = new ChainProductOrderDB()
        const order = await getResponseValue(org.read(this.dbService, id, writeDatabase))
        if (!lastVersionPurpose) {
            if (order.facilityId) {
                order.facility = await this.getFacility(order.facilityId);
            }
            if (order.customerId) {
                order.customer = await this.getCompanyCustomer(order.customerId)
            }
            if (order.requiredGradeId) {
                order.requiredGrade = await this.getGradeAbbreviation(order.requiredGradeId)
            }
            const itms = await this.listOrderItems(order._id, null, writeDatabase)

            order.items = itms ? itms.items : []
        }
        return order
    }



    public async deleteOrder(order: ChainProductOrder): Promise<any> {
        if (this.isNodeApp) {
            // TODO: check dependencies
            const res = await this.getOrder(order._id, true)
            for (const stockOrder of res.items) {
                await this.deleteStockOrder(stockOrder)
            }
            const org = new ChainProductOrderDB(order);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(document)
        }
    }

    public async listOpenOrdersForFacility(facilityId: string, filters?: ViewFilterParams, openOnly = true) {
        if (!facilityId) throw Error("Facility ID is required")
        const startkeyDef: any[] = [facilityId]
        const endkeyDef: any[] = [facilityId]
        const view = openOnly ? "product_order_for_facility_open_delivery_time" : "product_order_for_facility_delivery_time"
        endkeyDef.push({})
        const desc: boolean = filters && filters.sort === 'DESC' ? true : false

        const response = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
            include_docs: true,
            limit: filters && filters.limit ? filters.limit : undefined,
            skip: filters && filters.offset ? filters.offset : undefined
        })
        const countResponse = await this.dbService.readDatabase.view('customs', view, {
            startkey: desc ? endkeyDef : startkeyDef,
            endkey: desc ? startkeyDef : endkeyDef,
            sorted: true,
            descending: desc,
        })
        const count = countResponse.rows && countResponse.rows.length;
        const items = response.rows.map(doc => (new DBDocument<ChainProductOrder>((doc as any).doc)).value as ChainProductOrder)

        await this.extractForIds<ChainGradeAbbreviation>(items, new ChainGradeAbbreviationDB(), 'requiredGradeId', 'requiredGrade')
        await this.extractForIds<ChainFacility>(items, new ChainFacilityDB(), 'facilityId', 'facility', { name: null, organizationId: null })
        await this.extractForIds<ChainCompanyCustomer>(items, new ChainCompanyCustomerDB(), 'customerId', 'customer', { productId: null, companyId: null, type: null, name: null })
        for (const order of items) {
            const itms = await this.listOrderItems(order._id)
            order.items = itms.items
        }
        return new PaginatedList<ChainProductOrder>(items, count, filters ? filters.limit : undefined, filters ? filters.offset : undefined)

    }

    public async listOpenOrdersForOrganization(organizationId: string, filters?: ViewFilterParams, openOnly = true) {
        if (!organizationId) throw Error("Organization ID is required")
        const view = openOnly ? "product_order_for_facility_open_delivery_time" : "product_order_for_facility_delivery_time"
        let countAll: number = 0;
        let itemsAll: ChainProductOrder[] = [];
        const facilities = await this.listFacilitiesForOrganization(organizationId);

        if (facilities && facilities.items.length > 0) {
            for (const facility of facilities.items) {

                const startkeyDef: any[] = [facility._id];
                const endkeyDef: any[] = [facility._id, {}];

                const desc: boolean = false;
                const response = await this.dbService.readDatabase.view('customs', view, {
                    startkey: desc ? endkeyDef : startkeyDef,
                    endkey: desc ? startkeyDef : endkeyDef,
                    sorted: true,
                    descending: desc,
                    include_docs: true,
                    limit: undefined,
                    skip: undefined
                })
                const countResponse = await this.dbService.readDatabase.view('customs', view, {
                    startkey: desc ? endkeyDef : startkeyDef,
                    endkey: desc ? startkeyDef : endkeyDef,
                    sorted: true,
                    descending: desc,
                })

                const count = countResponse.rows && countResponse.rows.length;
                const items = response.rows.map(doc => (new DBDocument<ChainProductOrder>((doc as any).doc)).value as ChainProductOrder)

                countAll += count;
                itemsAll = [...itemsAll, ...items]

            }

            if (filters && filters.sort === "DESC") itemsAll.reverse();
            let slicedItems = itemsAll;
            const offset = filters && filters.offset ? filters.offset : 0;
            const limit = filters && filters.limit ? filters.limit : null;
            if (offset != null && limit != null) {
                slicedItems = slicedItems.slice(offset, offset + limit);
            }

            await this.extractForIds<ChainGradeAbbreviation>(slicedItems, new ChainGradeAbbreviationDB(), 'requiredGradeId', 'requiredGrade')
            await this.extractForIds<ChainFacility>(slicedItems, new ChainFacilityDB(), 'facilityId', 'facility', { name: null, organizationId: null })
            await this.extractForIds<ChainCompanyCustomer>(slicedItems, new ChainCompanyCustomerDB(), 'customerId', 'customer', { productId: null, companyId: null, type: null, name: null })
            for (const order of slicedItems) {
                const itms = await this.listOrderItems(order._id)
                order.items = itms.items
            }
            return new PaginatedList<ChainProductOrder>(slicedItems, countAll, limit, offset)

        }

    }


    testXX(a: string | symbol) {
        return;
    }

    //////////////////////////////////////////////////////////
    /// DOCUMENT REQUIREMENT
    //////////////////////////////////////////////////////////

    public insertDocumentRequirement(documentRequirement: ChainDocumentRequirement) {
        if (this.isNodeApp) {
            const org = new ChainDocumentRequirementDB(documentRequirement);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(documentRequirement)
        }
    }

    public async getDocumentRequirement(id: string): Promise<ChainDocumentRequirement> {
        const org = new ChainDocumentRequirementDB()
        return getResponseValue(org.read(this.dbService, id))
    }

    public async listDocumentRequirments(filters?: ViewFilterParams): Promise<PaginatedList<ChainDocumentRequirement>> {
        const org = new ChainDocumentRequirementDB()
        return org.readAll(this.dbService, null, null, filters)
    }

    public async deleteDocumentRequirement(documentRequirement: ChainDocumentRequirement): Promise<any> {
        if (this.isNodeApp) {
            const org = new ChainDocumentRequirementDB(documentRequirement);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(documentRequirement)
        }
    }

    //////////////////////////////////////////////////////////
    /// DOCUMENT REQUIREMENT LIST
    //////////////////////////////////////////////////////////

    public insertDocumentRequirementList(documentRequirementList: ChainDocumentRequirementList) {
        if (this.isNodeApp) {
            const org = new ChainDocumentRequirementListDB(documentRequirementList);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(documentRequirementList)
        }
    }

    public async getDocumentRequirementList(id: string): Promise<ChainDocumentRequirementList> {
        const org = new ChainDocumentRequirementListDB()
        return getResponseValue(org.read(this.dbService, id))
    }

    public async listDocumentRequirmentsLists(filters?: ViewFilterParams): Promise<PaginatedList<ChainDocumentRequirementList>> {
        const org = new ChainDocumentRequirementListDB()
        return org.readAll(this.dbService, null, null, filters)
    }

    public async deleteDocumentRequirementList(documentRequirementList: ChainDocumentRequirementList): Promise<any> {
        if (this.isNodeApp) {
            const org = new ChainDocumentRequirementListDB(documentRequirementList);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(documentRequirementList)
        }
    }

    public async listDocumentRequirementListsForSemiProduct(semiProductId: string, filters?: ViewFilterParams): Promise<PaginatedList<ChainDocumentRequirementList>> {
        const org = new ChainDocumentRequirementListDB();
        return org.readAll(this.dbService, 'semi_product_id', 'semi_product_id', filters, [semiProductId])
    }

    // //////////////////////////////////////////////////////////
    // /// FILE REFERENCE
    // //////////////////////////////////////////////////////////

    // public insertFileReference(chainFacilityType: ChainFileReference) {
    //     const org = new ChainFileReferenceDB(chainFacilityType);
    //     return getResponseValue(org.save(this.dbService));
    // }

    // public async getFileReference(id: string): Promise<ChainFileReference> {
    //     const org = new ChainFileReferenceDB()
    //     return getResponseValue(org.read(this.dbService, id))
    // }

    // public async listFileReferences(filters?: ViewFilterParams): Promise<PaginatedList<ChainFileReference>> {
    //     const org = new ChainFileReferenceDB()
    //     return org.readAll(this.dbService, null, null, filters)
    // }

    //////////////////////////////////////////////////////////
    /// FACILITY TYPE
    //////////////////////////////////////////////////////////

    public insertFacilityType(chainFacilityType: ChainFacilityType) {
        if (this.isNodeApp) {
            const org = new ChainFacilityTypeDB(chainFacilityType);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(chainFacilityType)
        }
    }

    public async getFacilityType(id: string): Promise<ChainFacilityType> {
        const org = new ChainFacilityTypeDB()
        return getResponseValue(org.read(this.dbService, id))
    }

    public async listFacilityTypes(filters?: ViewFilterParams): Promise<PaginatedList<ChainFacilityType>> {
        const org = new ChainFacilityTypeDB()
        // return org.readAll(this.dbService, 'codebook', 'codebook', filters)
        return org.readAll(this.dbService, 'codebook_label', 'codebook_label', filters, [null], [{}])
    }

    public async deleteFacilityType(chainFacilityType: ChainFacilityType): Promise<any> {
        if (this.isNodeApp) {
            const org = new ChainFacilityTypeDB(chainFacilityType);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(chainFacilityType)
        }
    }


    //////////////////////////////////////////////////////////
    /// ACTION TYPE
    //////////////////////////////////////////////////////////

    public insertActionType(chainActionType: ChainActionType) {
        if (this.isNodeApp) {
            const org = new ChainActionTypeDB(chainActionType);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(chainActionType)
        }
    }

    public async getActionType(id: string): Promise<ChainActionType> {
        const org = new ChainActionTypeDB()
        return getResponseValue(org.read(this.dbService, id))
    }

    public async listActionTypes(filters?: ViewFilterParams): Promise<PaginatedList<ChainActionType>> {
        const org = new ChainActionTypeDB()
        // return org.readAll(this.dbService, 'codebook', 'codebook', filters)
        return org.readAll(this.dbService, 'codebook_label', 'codebook_label', filters, [null], [{}])
    }


    public async deleteActionType(chainActionType: ChainActionType): Promise<any> {
        if (this.isNodeApp) {
            const org = new ChainActionTypeDB(chainActionType);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(chainActionType)
        }
    }

    //////////////////////////////////////////////////////////
    /// MEASURE UNIT TYPE
    //////////////////////////////////////////////////////////

    public insertMeasureUnitType(measureUnitType: ChainMeasureUnitType) {
        if (this.isNodeApp) {
            if (measureUnitType.underlyingMeasurementUnitType) {
                measureUnitType.underlyingMeasurementUnitTypeId = measureUnitType.underlyingMeasurementUnitType._id
            } else {
                measureUnitType.underlyingMeasurementUnitTypeId = null
            }
            const org = new ChainMeasureUnitTypeDB(measureUnitType);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(measureUnitType)
        }
    }

    public async getMeasureUnitType(id: string): Promise<ChainMeasureUnitType> {
        const org = new ChainMeasureUnitTypeDB()
        const res = await getResponseValue(org.read(this.dbService, id))
        if (res.underlyingMeasurementUnitTypeId) {
            res.underlyingMeasurementUnitType = await this.getMeasureUnitType(res.underlyingMeasurementUnitTypeId)
        }
        return res
    }

    public async listMeasureUnitTypes(filters?: ViewFilterParams): Promise<PaginatedList<ChainMeasureUnitType>> {
        const org = new ChainMeasureUnitTypeDB()
        // return org.readAll(this.dbService, 'codebook', 'codebook', filters)
        const res = await org.readAll(this.dbService, 'codebook_label', 'codebook_label', filters, [null], [{}])
        await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'underlyingMeasurementUnitTypeId', 'underlyingMeasurementUnitType')
        return res
    }

    public async deleteChainMeasureUnitType(chainMeasureUnitType: ChainMeasureUnitType): Promise<any> {
        if (this.isNodeApp) {
            const org = new ChainActionTypeDB(chainMeasureUnitType);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(chainMeasureUnitType)
        }
    }

    //////////////////////////////////////////////////////////
    /// REFERENCE PURPOSE
    //////////////////////////////////////////////////////////

    // public insertReferencePurpose(measureUnitType: ChainReferencePurpose) {
    //     const org = new ChainReferencePurposeDB(measureUnitType);
    //     return getResponseValue(org.save(this.dbService));
    // }

    // public async getReferencePurpose(id: string): Promise<ChainReferencePurpose> {
    //     const org = new ChainReferencePurposeDB()
    //     return getResponseValue(org.read(this.dbService, id))
    // }

    // public async listReferencePurposes(filters?: ViewFilterParams): Promise<PaginatedList<ChainReferencePurpose>> {
    //     const org = new ChainReferencePurposeDB()
    //     return org.readAll(this.dbService, 'codebook', 'codebook', filters)
    // }

    //////////////////////////////////////////////////////////
    /// GRADE ABBREVIATION
    //////////////////////////////////////////////////////////

    public insertGradeAbbreviation(chainGradeAbbreviation: ChainGradeAbbreviation) {
        if (this.isNodeApp) {
            const org = new ChainGradeAbbreviationDB(chainGradeAbbreviation);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(chainGradeAbbreviation)
        }
    }

    public async getGradeAbbreviation(id: string): Promise<ChainGradeAbbreviation> {
        const org = new ChainGradeAbbreviationDB()
        return getResponseValue(org.read(this.dbService, id))
    }

    public async listGradeAbbreviations(filters?: ViewFilterParams): Promise<PaginatedList<ChainGradeAbbreviation>> {
        const org = new ChainGradeAbbreviationDB()
        return org.readAll(this.dbService, 'codebook_label', 'codebook_label', filters, [null], [{}])
    }


    public async deleteGradeAbbreviation(chainGradeAbbreviation: ChainGradeAbbreviation): Promise<any> {
        if (this.isNodeApp) {
            const org = new ChainGradeAbbreviationDB(chainGradeAbbreviation);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(chainGradeAbbreviation)
        }
    }

    //////////////////////////////////////////////////////////
    /// PROCESSING EVIDENCE TYPE
    //////////////////////////////////////////////////////////

    public insertProcessingEvidenceType(chainProcessingEvidenceType: ChainProcessingEvidenceType) {
        if (this.isNodeApp) {
            // if (chainProcessingEvidenceType.semiProduct && !chainProcessingEvidenceType.semiProductId) {
            //     chainProcessingEvidenceType.semiProductId = chainProcessingEvidenceType.semiProduct._id
            // }
            const org = new ChainProcessingEvidenceTypeDB(chainProcessingEvidenceType);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(chainProcessingEvidenceType)
        }
    }

    public async getProcessingEvidenceType(id: string): Promise<ChainProcessingEvidenceType> {
        const org = new ChainProcessingEvidenceTypeDB()
        const res = await getResponseValue(org.read(this.dbService, id))
        // if (res.semiProductId) {
        //     res.semiProduct = await this.getSemiProduct(res.semiProductId)
        // }
        return res
    }

    public async listProcessingEvidenceTypes(filters?: ViewFilterParams): Promise<PaginatedList<ChainProcessingEvidenceType>> {
        const org = new ChainProcessingEvidenceTypeDB()
        const res = await org.readAll(this.dbService, 'codebook_label', 'codebook_label', filters, [null], [{}])
        await this.extractForIds<ChainSemiProduct>(res.items, new ChainSemiProductDB(), 'semiProductId', 'semiProduct')
        // await this.extractForIds<ChainMeasureUnitType>(res.items, new ChainMeasureUnitTypeDB(), 'semiProduct.measurementUnitType._id', 'semiProduct.measurementUnitType')
        return res
    }

    public async deleteProcessingEvidenceType(chainProcessingEvidenceType: ChainProcessingEvidenceType): Promise<any> {
        if (this.isNodeApp) {
            // TODO check references
            const org = new ChainProcessingEvidenceTypeDB(chainProcessingEvidenceType);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(chainProcessingEvidenceType)
        }
    }


    //////////////////////////////////////////////////////////
    /// ORDER EVIDENCE TYPE
    //////////////////////////////////////////////////////////

    public insertOrderEvidenceType(chainOrderEvidenceType: ChainOrderEvidenceType) {
        if (this.isNodeApp) {
            const org = new ChainOrderEvidenceTypeDB(chainOrderEvidenceType);
            return getResponseValue(org.save(this.dbService));
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(chainOrderEvidenceType)
        }
    }

    public async getOrderEvidenceType(id: string): Promise<ChainOrderEvidenceType> {
        const org = new ChainOrderEvidenceTypeDB()
        return getResponseValue(org.read(this.dbService, id))
    }

    public async listOrderEvidenceTypes(filters?: ViewFilterParams): Promise<PaginatedList<ChainOrderEvidenceType>> {
        const org = new ChainOrderEvidenceTypeDB()
        return org.readAll(this.dbService, 'codebook_label', 'codebook_label', filters, [null], [{}])
    }


    public async deleteOrderEvidenceType(chainOrderEvidenceType: ChainOrderEvidenceType): Promise<any> {
        if (this.isNodeApp) {
            const org = new ChainOrderEvidenceTypeDB(chainOrderEvidenceType);
            return org.delete(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.deleteBC(chainOrderEvidenceType)
        }
    }


    //////////////////////////////////////////////////////////
    /// TRANSLATION TEMPLATES
    //////////////////////////////////////////////////////////

    private translationEntry(obj: any, field: string, prefixKey: string) {
        const value = obj[field]
        const trxKey = `CBT_${ obj._id }.${ field }`
        return `"${ trxKey }": $localize \`:@@${ prefixKey }.${ trxKey }: ${ value }\`,\n`
    }

    /// ADD FIELDS TO BE TRANSLATED INTO THIS STRUCTURE
    codebookFieldsForTranslation = {
        c_facility_type: {
            label: {}
        },
        c_action_type: {
            label: {}
        },
        c_grade_abbreviation: {
            label: {}
        },
        c_measure_unit_type: {
            label: {}
        },
        c_order_evidence_type: {
            label: {}
        },
        c_process_evidence_type: {
            label: {}
        },
        facility: {
            name: {}
        },
        semi_product: {
            name: {},
            description: {}
        },
        process_action: {
            name: {},
            description: {}
        },
    }

    public async codebookTranslationTemplates() {
        const dbObj = new ChainProcessingActionDB()  // can be any, as we abuse it by changing docType

        let outString = `private translationFields = {\n`
        const indent = "    "
        const indent2 = indent + indent
        const indent3 = indent2 + indent
        for (const objectKey of Object.keys(this.codebookFieldsForTranslation)) {
            outString += indent + `"${ objectKey }": {\n`
            dbObj.docType = objectKey
            const codebookObjects = (await dbObj.readAll(this.dbService)).items
            for (const fieldName of Object.keys((this.codebookFieldsForTranslation as any)[objectKey])) {
                outString += indent2 + `"${ fieldName }": {\n`
                for (const obj of codebookObjects) {
                    outString += indent3 + this.translationEntry(obj, fieldName, `codebookTranslations.${ objectKey }.${ fieldName }`)
                }
                outString += indent2 + "},\n"
            }
            outString += indent + "},\n"
        }
        outString += "}\n"
        return outString
    }

    //////////////////////////////////////////////////////////
    /// MIGRATIONS
    //////////////////////////////////////////////////////////

    async migrateQuoteStockOrdersByAddingOrganizationId() {
        const org = new ChainStockOrderDB()
        const orders = await org.readAll(this.dbService)
        for (const order of orders.items) {
            if (order.quoteFacilityId && !order.quoteOrganizationId) {
                const facility = await this.getFacility(order.quoteFacilityId)
                order.quoteOrganizationId = facility.organizationId
                await this.insertStockOrder(order)
            }
        }
    }

    async migrateAllStockOrdersByAddingOrganizationId() {
        const org = new ChainStockOrderDB()
        const orders = await org.readAll(this.dbService)
        for (const order of orders.items) {
            if (order.facilityId && !order.organizationId) {
                const facility = await this.getFacility(order.facilityId)
                order.organizationId = facility.organizationId
                await this.insertStockOrder(order)
            }
        }
    }

    // async migrateFixStockOrderDocumentRequirements() {
    //     const org = new ChainProcessing()
    //     const orders = await org.readAll(this.dbService)
    //     for (const order of orders.items) {
    //         if (order.) {
    //             const facility = await this.getFacility(order.facilityId)
    //             order.organizationId = facility.organizationId
    //             await this.insertStockOrder(order)
    //         }
    //     }
    // }


    //////////////////////////////////////////////////////////
    /// HELPERS
    //////////////////////////////////////////////////////////
    public async balanceForPurchaseOrder(stockOrder: ChainStockOrder): Promise<number> {
        if (stockOrder.orderType !== 'PURCHASE_ORDER') return;
        let balance = stockOrder.cost;
        const response = await this.listPaymentsForStockOrder(stockOrder._id, { limit: 1000, offset: 0 })

        if (response && response.items && response.items.length > 0 && stockOrder.cost) {
            const sum = response.items.map(o => o.paymentPurposeType === 'FIRST_INSTALLMENT' ? (o.amount + (o.amountPaidToTheCollector && stockOrder.preferredWayOfPayment !== 'CASH_VIA_COLLECTOR' ? o.amountPaidToTheCollector : 0)) : 0).reduce((a, c) => { return a + c });
            balance = stockOrder.cost - sum;
        }

        return balance;
    }

    public async checkForDuplicateNamesInStockOrderInsideOrganization(id: string, query: string, facilityId: string) {
        if (query) {
            const facility = await this.getFacility(facilityId);
            const stockOrders = await this.listAllStockOrdersForOrganization(facility.organizationId, false, false, null, null, null, null, null, null);
            for (const so of stockOrders.items) {
                if (so.identifier && so.identifier === query) {
                    if (id && id === so._id) continue;
                    else return "Identifier already exists";
                }
                if (so.internalLotNumber && so.internalLotNumber === query) {
                    if (id && id === so._id) continue;
                    else return "Internal lot number already exists";
                }
                if (so.lotNumber && so.lotNumber === query) {
                    if (id && id === so._id) continue;
                    else return "External lot number already exists";
                }
            }
        }
        return null;
    }

    async userCompanyCustomerIdCounter() {
        const org = new ChainUserCompanyCustomerCounterDB();
        const list = await org.readAll(this.dbService, null, null, { limit: 1 }, null, null, true)
        if (list.items.length === 1) {
            return list.items[0];
        } else return null;
    }

    async insertUserCompanyCustomerIdCounter(userCompanyCustomerCounter: ChainUserCompanyCustomerCounter, user: boolean) {
        const newCounter = userCompanyCustomerCounter;

        if (user) newCounter.userCustomerCounter = userCompanyCustomerCounter.userCustomerCounter + 1;
        else newCounter.companyCustomerCounter = userCompanyCustomerCounter.companyCustomerCounter + 1;

        if (this.isNodeApp) {
            const org = new ChainUserCompanyCustomerCounterDB(newCounter);
            org.save(this.dbService);
        }
        if (this.isBlockchainApp) {
            return this.insertOrUpdateBC(newCounter)
        }

    }

    public async checkConnection() {
        return "";
    }

    //////////////////////////////////////////////////////////
    /// TEST ENTRIES
    //////////////////////////////////////////////////////////

    public async test() {
        const organization1 = await this.insertOrganization({
            id: 1,
            name: "Organization No. 1",
            entityType: 'company'
        })
        const organization2 = await this.insertOrganization({
            id: 2,
            name: "Organization No. 2",
            entityType: 'company'
        })
        const product = await this.insertProduct({
            id: 1,
            companyId: 1,
            name: 'Angelique Coffee Finest',
            organizationRoles: []
        })

        const measurementUnits = await this.listMeasureUnitTypes();
        const semiProduct = await this.insertSemiProduct({
            productId: product._id,
            name: "Angelique Coffee Bag (60kg)",
            description: "Angelique Coffee Bag (60kg)",
            measurementUnitType: measurementUnits.items.find(x => x.id === 'BAG_60')
        })

        const semiProduct2 = await this.insertSemiProduct({
            productId: product._id,
            name: "Angelique Coffee Bag (100kg)",
            description: "Angelique Coffee Bag (100kg)",
            measurementUnitType: measurementUnits.items.find(x => x.id === 'BAG_60')
        })

        const facilityTypes = await this.listFacilityTypes();
        const facility1 = await this.insertFacility({
            name: "First facility",
            organizationId: organization1._id,
            facilityType: facilityTypes.items[0],
            isPublic: true,
            semiProducts: [semiProduct, semiProduct2]
        });

        const facility2 = await this.insertFacility({
            name: "Second facility",
            organizationId: organization2._id,
            facilityType: facilityTypes.items[1],
            isPublic: true
        });

        const facility3 = await this.insertFacility({
            name: "Third facility",
            organizationId: organization2._id,
            facilityType: facilityTypes.items[2],
            isPublic: true
        });


        const userCustomer1 = await this.insertUserCustomer({
            id: 1,
            productId: product.id,
            companyId: organization1.id,
            name: "Awambe",
            surname: "Mkatanambazumbo",
            gender: 'FEMALE',
            location: {
                site: "SITE_1",
                sector: "SECTOR_1",
                cell: "CELL_1",
                isPubliclyVisible: true
            },
            customerId: "UCUST-001",
            contact: {
                phone: "+12345467889",
                email: "awambe@rwanda.com",
                hasSmartPhone: false
            },
            farmInfo: {
                ownsFarm: true,
                farmSize: "Very small farm",
                numberOfTrees: 20,
                organicFarm: true,
                fertilizerDescription: "Natural",
                additionalInfo: "Farm is up on the hill."
            }
        })

        const user = await this.insertUser({
            id: 10000
        })

        const docReqA = await this.insertDocumentRequirement({
            name: "Note of type A",
            description: "Receipt of type A",
            documentIdentifier: "NOTE_A",
            fields: [
                {
                    label: "Date of receipt",
                    type: 'date',
                    required: true,
                    stringValue: null,
                },
                {
                    label: "Receipt scan",
                    type: 'file',
                    required: true,
                    fileMultiplicity: 1,
                    files: []
                },
            ],
            score: [
                {
                    type: 'PROVENANCE',
                    score: 1
                },
                {
                    type: 'ORDER',
                    score: 1
                }
            ],
            required: false
        })

        const docReqB = await this.insertDocumentRequirement({
            name: "Note of type B",
            description: "Receipt of type B",
            documentIdentifier: "NOTE_B",
            fields: [
                {
                    label: "Date of receipt",
                    type: 'date',
                    required: true,
                    stringValue: null,
                },
                {
                    label: "Receipt scan",
                    type: 'file',
                    required: true,
                    fileMultiplicity: 1,
                    files: []
                },
            ],
            score: [
                {
                    type: 'PROVENANCE',
                    score: 1
                },
                {
                    type: 'ORDER',
                    score: 1
                }
            ],
            required: false
        })

        const docFullA = { ...docReqA }
        delete docFullA._id
        delete docFullA._rev;
        docFullA.fields = [
            {
                label: "Date of receipt",
                type: 'date',
                required: true,
                stringValue: "2020-06-30",
            },
            {
                label: "Receipt scan",
                type: 'file',
                required: true,
                fileMultiplicity: 1,
                files: [{
                    storageKey: "asdfasdfasdfasdfas",
                    name: "Receipt 1111",
                    contentType: "pdf",
                    size: 10000
                }]
            },
        ]

        const requiredDocumentsCollectOrder1 = await this.insertDocumentRequirementList({
            identifier: "COLLECT_ORDER",
            semiProductId: semiProduct._id,
            requirements: [
                docFullA
            ],
            targets: {
                fairness: 0,
                provenance: 1,
                quality: 0,
                qualityLevel: "A+",
                womenShare: 100,
                order: 1,
                payment: 0
            }
        })

        const requiredDocumentsCollectOrder2 = await this.insertDocumentRequirementList({
            identifier: "COLLECT_ORDER",
            semiProductId: semiProduct._id,
            requirements: [
                docReqA,
                docReqB
            ],
            targets: {
                fairness: 0,
                provenance: 1,
                quality: 0,
                qualityLevel: "A+",
                womenShare: 100,
                order: 1,
                payment: 0
            }
        })

        const stockOrder1 = await this.insertStockOrder({
            formalCreationTime: "2020-06-29",
            identifier: "AWA-20-001",
            creatorId: user._id,
            producerUserCustomerId: userCustomer1._id,
            productionLocation: userCustomer1.location,
            semiProductId: semiProduct._id,
            facilityId: facility1._id,
            totalQuantity: 100,
            fullfilledQuantity: 100,
            availableQuantity: 100,
            productionDate: "2020-06-30",
            expiryDate: "2021-06-30",
            documentRequirements: requiredDocumentsCollectOrder1,
            pricePerUnit: 10,
            currency: "RWK"
        })

        // const stockOrder11 = await this.insertStockOrder({
        //     formalCreationTime: "2020-06-29",
        //     identifier: "AWA-20-002",
        //     creatorId: user._id,
        //     producerUserCustomerId: userCustomer1._id,
        //     productionLocation: userCustomer1.location,
        //     semiProductId: semiProduct._id,
        //     facilityId: facility1._id,
        //     totalQuantity: 10,
        //     fullfilledQuantity: 10,
        //     availableQuantity: 10,
        //     productionDate: "2020-06-30",
        //     expiryDate: "2021-06-30",
        //     documentRequirements: requiredDocumentsCollectOrder1,
        //     pricePerUnit: 10,
        //     currency: "RWK"
        // })

        const stockOrder2 = await this.insertStockOrder({
            semiProductId: semiProduct._id,
            facilityId: facility2._id,
            totalQuantity: 50,
            fullfilledQuantity: 0,
            availableQuantity: 0,
            productionDate: "2020-07-01",
            expiryDate: "2021-07-01",
            documentRequirements: requiredDocumentsCollectOrder2,
            pricePerUnit: 10,
            currency: "RWK"

        })

        const stockOrder22 = await this.insertStockOrder({
            semiProductId: semiProduct._id,
            facilityId: facility2._id,
            totalQuantity: 10,
            fullfilledQuantity: 0,
            availableQuantity: 0,
            productionDate: "2020-06-30",
            expiryDate: "2021-06-30",
        })

        const stockOrder3 = await this.insertStockOrder({
            semiProductId: semiProduct._id,
            facilityId: facility3._id,
            totalQuantity: 60,
            fullfilledQuantity: 0,
            availableQuantity: 0,
            productionDate: "2020-06-30",
            expiryDate: "2021-06-30",
        })

        const actionTypes = await this.listActionTypes()

        const txFrom1To2With20 = await this.insertTransaction({
            status: 'EXECUTED',
            organizationId: organization1._id,
            initiatorUserId: user._id,
            // sourceStockOrderIds: [stockOrder1._id],
            // targetStockOrderIds: [stockOrder2._id],
            sourceStockOrderId: stockOrder1._id,
            targetStockOrderId: stockOrder2._id,
            actionType: actionTypes.items[1],
            inputQuantity: 20,
            outputQuantity: 20,
            pricePerUnit: 10,
            currency: 'USD'
        })

        const txFrom1To2With30 = await this.insertTransaction({
            status: 'EXECUTED',
            organizationId: organization1._id,
            initiatorUserId: user._id,
            // sourceStockOrderIds: [stockOrder1._id],
            // targetStockOrderIds: [stockOrder2._id],
            sourceStockOrderId: stockOrder1._id,
            targetStockOrderId: stockOrder2._id,

            actionType: actionTypes.items[1],
            inputQuantity: 30,
            outputQuantity: 30,
            pricePerUnit: 10,
            currency: 'USD'
        })
        const txFrom1To22With5 = await this.insertTransaction({
            status: 'EXECUTED',
            organizationId: organization1._id,
            initiatorUserId: user._id,
            // sourceStockOrderIds: [stockOrder1._id],
            // targetStockOrderIds: [stockOrder22._id],
            sourceStockOrderId: stockOrder1._id,
            targetStockOrderId: stockOrder22._id,

            actionType: actionTypes.items[1],
            inputQuantity: 5,
            outputQuantity: 5,
            pricePerUnit: 10,
            currency: 'USD'
        })

        const txFrom2To3With50 = await this.insertTransaction({
            status: 'EXECUTED',
            organizationId: organization1._id,
            initiatorUserId: user._id,
            // sourceStockOrderIds: [stockOrder2._id],
            // targetStockOrderIds: [stockOrder3._id],
            sourceStockOrderId: stockOrder2._id,
            targetStockOrderId: stockOrder3._id,
            actionType: actionTypes.items[1],
            inputQuantity: 20,
            outputQuantity: 20,
            pricePerUnit: 10,
            currency: 'USD'
        })
    }

}