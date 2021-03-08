import { DocumentListParams } from 'nano';
import { Factory, Inject, OnlyInstantiableByContainer, Singleton } from "typescript-ioc";
import { FieldDefinition } from '../models/chain/ChainDocumentRequirement';
import { ChainFacility } from '../models/chain/ChainFacility';
import { ChainHistory } from '../models/chain/ChainHistory';
import { ChainOrganization } from '../models/chain/ChainOrganization';
import { ChainProcessingAction, DocTypeIdsWithRequired } from '../models/chain/ChainProcessingAction';
import { ChainProcessingEvidenceType } from '../models/chain/ChainProcessingEvidenceType';
import { ChainProcessingOrder } from '../models/chain/ChainProcessingOrder';
import { ChainProductOrder } from '../models/chain/ChainProductOrder';
import { ChainStockOrder, ProcessingOrderHistory, StockOrderAgg, WeightedAggregate } from '../models/chain/ChainStockOrder';
import { ChainTransaction } from '../models/chain/ChainTransaction';
import { ViewFilterParams } from '../models/chain/DBDocument';
import { PaginatedList } from '../models/chain/PaginatedList';
import { DatabaseService } from './databaseService';

interface ResolutionPair {
    change: any,
    expiry: number
}

const RESOLVE_EXPIRY_MS = 100000

const tlCnt = 0
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


// @Factory(() => new HistoryCacheService())

@Singleton
@OnlyInstantiableByContainer
export class HistoryCacheService {

    @Inject
    public dbService: DatabaseService

    _keyToObject: Map<string, any>;
    _docTypeToObject: Map<string, any>;
    _inputTransactions: Map<string, ChainTransaction[]>
    _outputTransactions: Map<string, ChainTransaction[]>
    _triggeredOrders: Map<string, ChainStockOrder[]>
    _quoteOrders: Map<string, ChainStockOrder[]> // maps product orders (ids) to list of quote orders
    _unresolvedChanges: ResolutionPair[] = []
    _expired = new Set<string>()
    constructor() {
        this.init()
    }
    _initialized: boolean = false;
    _refreshInProgress: boolean = false;

    chgcnt = 0;
    public async init() {
        this.initDocumentProcessing()
        this.dbService.readDatabase.changesReader.start({
            batchSize: 5000,
            since: "0",
            includeDocs: true,
        })
            .on('change', (change) => {
                if (!(change.id as string).startsWith("_")) {
                    this.processChange(change)
                }
                if (this.chgcnt % 1000 === 0) {
                    console.log(this.chgcnt)
                }
                // console.log("CHANGE")
                this.chgcnt++
            })
        this.tryResolve()  // periodic function
        // if (this._initialized) return;
        // await this.refresh();
        // this._initialized = true;
        // setInterval(() => {
        //     this.refresh();
        // }, 60 * 1000) // minute refresh
    }

    // public async refresh() {
    //     if (this._refreshInProgress) {
    //         if (!this._keyToObject) throw Error("Cache is refressing try later.")
    //         return;
    //     }
    //     this._refreshInProgress = true;
    //     await this.readAllObjectsMap();
    //     this.processTransactions()
    //     this.processStockOrders()
    //     this.processProcessingOrders();
    //     this._refreshInProgress = false
    // }

    _resolveTimeout = 200

    public async tryResolve() {
        const len = this._unresolvedChanges.length
        if (len > 0) {
            console.log("RESOLVING:", this._unresolvedChanges.length, this._keyToObject.size)
        }
        if (this._unresolvedChanges.length === 0) {
            this._resolveTimeout = 200
        } else {
            const changePair = this._unresolvedChanges[0]
            this._unresolvedChanges.shift()
            if (changePair.expiry >= Date.now()) {
                if (!this.processChange(changePair.change)) {
                    this._unresolvedChanges.push(changePair)
                }
            } else {
                this._expired.add(changePair.change.id)
            }
            // console.log(change.doc.docType)
            this._resolveTimeout = 0
        }
        setTimeout(() => this.tryResolve(), this._resolveTimeout)
    }

    public async readDoctype(docType: string, filterParams?: ViewFilterParams) {
        if (!docType) throw Error("No docType")
        const query = {
            // group: true,
            key: [docType],
            // startkey: [docType],
            // endkey: [docType, {}],
            sorted: true
        }
        const db = this.dbService.readDatabase
        const response = await db.view('doc_type', 'doc_type', {
            ...query,
            reduce: false,
            include_docs: true,
            limit: filterParams && filterParams.limit ? filterParams.limit : undefined,
            skip: filterParams && filterParams.offset ? filterParams.offset : undefined
        })
        const countResponse = await db.view('doc_type', 'doc_type', {
            ...query,
            reduce: true,
        })
        const count = countResponse.rows && countResponse.rows.length === 1 ? countResponse.rows[0].value as number : 0
        const items = response.rows
        return new PaginatedList<any>(items, count, filterParams ? filterParams.limit : undefined, filterParams ? filterParams.offset : undefined)
    }

    // public async readAllObjectsMap() {
    //     console.log("READ ALL TO CACHE - START")
    //     let offset = 0;
    //     // let count = -1;
    //     const limit = 10000;
    //     let allObjects: any[] = []
    //     const countResponse = await this.dbService.readDatabase.list({ sorted: true } as DocumentListParams)
    //     const count = countResponse.rows && countResponse.rows.length;
    //     // console.log("COUNT:", count)
    //     while (offset < count) {
    //         // console.log("XX", offset, limit, count, allObjects.length)
    //         const res = await this.dbService.readDatabase.list({ limit, skip: offset, sorted: true, include_docs: true } as DocumentListParams)
    //         // count = res.total_rows
    //         offset += limit
    //         // console.log("YY", offset, limit, count, res.rows.length, allObjects.length)
    //         allObjects = [...allObjects, ...(res.rows.map(x => x.doc).filter(x => !x._id.startsWith("_")))]
    //         // allObjects = [...allObjects, ...(res.rows.map(x => {
    //         //     return x.doc._id
    //         // }))]
    //     }
    //     const docTypeMap = new Map<string, any>()
    //     const keyMap = new Map<string, any>();
    //     allObjects.forEach(x => {
    //         const key = x._id;
    //         keyMap.set(key, x);
    //         const docType = x.docType
    //         const value = docTypeMap.get(docType) || []
    //         value.push(x)
    //         docTypeMap.set(docType, value)
    //     })
    //     this._docTypeToObject = docTypeMap
    //     this._keyToObject = keyMap;
    //     console.log("READ ALL TO CACHE - END:", keyMap.size)
    // }

    initDocumentProcessing() {
        this._docTypeToObject = new Map<string, any>()
        this._keyToObject = new Map<string, any>();
        this._inputTransactions = new Map<string, ChainTransaction[]>()
        this._outputTransactions = new Map<string, ChainTransaction[]>()
        this._triggeredOrders = new Map<string, ChainStockOrder[]>()
        this._quoteOrders = new Map<string, ChainStockOrder[]>()
    }


    processChange(change: any): boolean {
        const now = Date.now();
        if (!change.doc) {
            console.log(change)
        }
        let docType = change.doc.docType
        let toDelete = null
        if (change.deleted) {
            toDelete = this._keyToObject && this._keyToObject.get(change.id)
            if (!toDelete) {
                // console.log("NO docType", change)
                return true
            }
            docType = (toDelete as any).docType
            if (!docType) {
                // console.log("NO docType of to delete", change, toDelete)
            }
        }
        switch (docType) {
            case "transaction":
                if (!this.processTransaction(change, toDelete)) {
                    this._unresolvedChanges.push({
                        change,
                        expiry: now + RESOLVE_EXPIRY_MS
                    })
                    return false
                }
                return true
            case "stock_order":
                if (!this.processStockOrder(change, toDelete)) {
                    this._unresolvedChanges.push({
                        change,
                        expiry: now + RESOLVE_EXPIRY_MS
                    })
                    return false
                }
                return true
            default:
                const tmp = this.processOtherDocuments(change)
                return tmp
        }
    }

    hasKey(key: string) {
        return this._keyToObject.get(key)
    }

    updateKey(doc: any) {
        this._keyToObject.set(doc._id, doc);
        // console.log(this._keyToObject.size)
        const docType = doc.docType
        const value = this._docTypeToObject.get(docType) || []
        value.push(doc)
        this._docTypeToObject.set(docType, value)
    }

    processTransaction(change: any, toDelete: ChainTransaction): boolean {
        if (toDelete) {
            this._keyToObject.delete(change.id)
            let lst = this._outputTransactions.get(toDelete.sourceStockOrderId) || []
            lst = lst.filter(tx => tx._id !== toDelete._id)
            this._outputTransactions.set(toDelete.sourceStockOrderId, lst)
            lst = this._inputTransactions.get(toDelete.targetStockOrderId) || []
            lst = lst.filter(tx => tx._id !== toDelete._id)
            this._outputTransactions.set(toDelete.targetStockOrderId, lst)
            return true
        }
        const transaction = change.doc as ChainTransaction
        this.updateKey(transaction)
        let order: ChainStockOrder | ChainProcessingOrder = this._keyToObject.get(transaction.targetStockOrderId)
        if (!order) {
            // console.log("NO TARGET:", transaction.targetStockOrderId)
            return false
        }
        let txs: ChainTransaction[] = this._inputTransactions.get(order._id) || []
        this._inputTransactions.set(order._id, [...txs.filter(x => x._id !== transaction._id), transaction])

        order = this._keyToObject.get(transaction.sourceStockOrderId)
        if (!order) {
            // console.log("NO SOURCE:", transaction.sourceStockOrderId)
            return false
        }
        txs = this._outputTransactions.get(order._id) || []
        this._outputTransactions.set(order._id, [...txs.filter(x => x._id !== transaction._id), transaction])
        return true
    }

    processStockOrder(change: any, toDelete: ChainStockOrder): boolean {
        if (toDelete) {
            this._keyToObject.delete(change.id);
            (toDelete.triggerOrderIds || []).forEach(id => {
                const triggeredOrders = this._triggeredOrders.get(id) || []
                this._triggeredOrders.set(id, [...triggeredOrders.filter(x => x._id !== stockOrder._id)])
            })
            if (toDelete.orderId) {
                const quoteOrders = this._quoteOrders.get(toDelete.orderId) || []
                this._quoteOrders.set(toDelete.orderId, [...quoteOrders.filter(x => x._id !== stockOrder._id)])
            }
            return true
        }
        const stockOrder = change.doc as ChainStockOrder
        this.updateKey(stockOrder);
        (stockOrder.triggerOrderIds || []).forEach(id => {
            const triggeredOrders = this._triggeredOrders.get(id) || []
            this._triggeredOrders.set(id, [...triggeredOrders.filter(x => x._id !== stockOrder._id), stockOrder])
        })
        if (stockOrder.orderId) {
            const quoteOrders = this._quoteOrders.get(stockOrder.orderId) || []
            this._quoteOrders.set(stockOrder.orderId, [...quoteOrders.filter(x => x._id !== stockOrder._id), stockOrder])
        }
        return true
    }

    processOtherDocuments(change: any): boolean {
        if (change.deleted) {
            this._keyToObject.delete(change.id);
            return true
        }
        this.updateKey(change.doc);
        return true
    }

    // processProcessingOrders() {
    //     const processingOrders = this._docTypeToObject.get("processing_order");
    //     processingOrders.forEach((processingOrder: ChainProcessingOrder) => {
    //         processingOrder.processingAction = this.getForKey<ChainProcessingAction>(processingOrder.processingActionId)
    //     })
    // }



    public async stockOrderHistory(stockOrderId: string, cache: Map<string, ChainHistory>): Promise<ChainHistory> {
        const tmpHistory = cache.get(stockOrderId)
        if (tmpHistory) {
            return tmpHistory;
        }
        const stockOrder = this.getForKey<ChainStockOrder>(stockOrderId)
        if (stockOrder.orderType === 'PURCHASE_ORDER') {
            const hist = {
                stockOrder,
                ancestors: []
            } as ChainHistory
            cache.set(stockOrderId, hist)
            return hist
        }

        if (!stockOrder.processingOrderId) throw Error("Strange stock order without processing order, thati is not purchase order")

        const processingOrder = this.getForKey<ChainProcessingOrder>(stockOrder.processingOrderId)

        const history = {
            stockOrder,
            processingOrder,
            ancestors: [] as ChainHistory[]
        }
        const action = this.getForKey<ChainProcessingAction>(processingOrder.processingActionId)// await this.getProcessingAction(processingOrder.processingActionId)

        if (action && (action.type === 'TRANSFER' || action.type === 'SHIPMENT')) {
            const inputTransactions = this._inputTransactions.get(stockOrder._id) || []
            const lst: ChainHistory[] = []
            for (const tx of inputTransactions) {
                lst.push(await this.stockOrderHistory(tx.sourceStockOrderId, cache))
            }
            lst.forEach(res => history.ancestors.push(res))
        } else if (action && action.type === 'PROCESSING') {
            const inputTransactions = this._inputTransactions.get(processingOrder._id) || []
            const lst: ChainHistory[] = []
            for (const tx of inputTransactions) {
                lst.push(await this.stockOrderHistory(tx.sourceStockOrderId, cache))
            }

            lst.forEach(res => history.ancestors.push(res))
        } else if (action) throw Error("Strange processing action type")
        if (action && action.type === 'SHIPMENT') {
            const triggeredOrders = this._triggeredOrders.get(stockOrder._id) || []
            const lst: ChainHistory[] = []
            for (const order of triggeredOrders) {
                lst.push(await this.stockOrderHistory(order._id, cache))
            }
            lst.forEach(res => history.ancestors.push(res))
        }
        cache.set(stockOrderId, history)
        return history
    }

    getForKey<T>(key: string): T {
        return this._keyToObject.get(key) as T
    }

    // call only if poh1 and poh2 have the same processing order
    mergePOHs(poh1: ProcessingOrderHistory, poh2: ProcessingOrderHistory): ProcessingOrderHistory {
        const proHistory = {
            depth: Math.min(poh1.depth, poh2.depth),
            processingOrder: poh1.processingOrder,
            stockOrderAggs: [...poh1.stockOrderAggs],
            stockOrderIds: new Set(poh1.stockOrderIds)
        } as ProcessingOrderHistory;
        for (const agg of poh2.stockOrderAggs) {
            if (!proHistory.stockOrderIds.has(agg.stockOrder._id)) {
                proHistory.stockOrderAggs.push(agg)
                proHistory.stockOrderIds.add(agg.stockOrder._id)
            }
        }
        proHistory.stockOrderAggs.sort((a: StockOrderAgg, b: StockOrderAgg) => {
            return a.stockOrder.created > b.stockOrder.created
                ? -1
                : (a.stockOrder.created < b.stockOrder.created
                    ? 1
                    : 0
                )
        })
        return proHistory
    }

    public async sortedTimeline(histories: ChainHistory[]): Promise<ProcessingOrderHistory[]> {
        const timeline: ProcessingOrderHistory[] = []
        const pohCache = new Map<string, ProcessingOrderHistory>()
        const pohByProcOrder = new Map<string, ProcessingOrderHistory>()

        for (const history of histories) {
            const action = this.getForKey<ChainProcessingAction>(history.stockOrder.processingActionId)
            const quoteOrder = action && action.type === 'SHIPMENT' ? history.stockOrder : null
            const fieldDefinitionMap = new Map<string, FieldDefinition>()
            const documentDefinitionMap = new Map<string, DocTypeIdsWithRequired>()

            if (quoteOrder) {
                action.requiredFields.forEach(field => {
                    fieldDefinitionMap.set(field.label, field)
                })
                const evidenceIdToEvidence = new Map<string, ChainProcessingEvidenceType>()
                const evidenceTypeIds = action.requiredDocTypeIdsWithRequired.map(x => x.processingEvidenceTypeId)
                const evidenceTypes = evidenceTypeIds.map(id => this.getForKey<ChainProcessingEvidenceType>(id))
                evidenceTypes.forEach(ev => {
                    evidenceIdToEvidence.set(ev._id, ev)
                })
                action.requiredDocTypeIdsWithRequired.forEach(docReq => {
                    documentDefinitionMap.set(evidenceIdToEvidence.get(docReq.processingEvidenceTypeId).id, docReq)
                })
            }

            await this.extractTimeline2(history, fieldDefinitionMap, documentDefinitionMap, pohCache)
        }

        const purchaseOrdersPOH = []
        for (const poh of pohCache.values()) {
            if (poh.processingOrder) {
                const existing = pohByProcOrder.get(poh.processingOrder._id)
                if (existing) {
                    pohByProcOrder.set(poh.processingOrder._id, this.mergePOHs(existing, poh))
                } else {
                    pohByProcOrder.set(poh.processingOrder._id, poh)
                }
            } else {
                purchaseOrdersPOH.push(poh)
            }
        }

        for (const poh of pohByProcOrder.values()) {
            timeline.push(poh)
        }

        const purchasePOH = {
            depth: Math.min(...purchaseOrdersPOH.map(el => el.depth)),
            processingOrder: null,
            stockOrderAggs: [...purchaseOrdersPOH.map(el => el.stockOrderAggs[0])]
        } as ProcessingOrderHistory;

        purchasePOH.stockOrderAggs.sort((a: StockOrderAgg, b: StockOrderAgg) => {
            return a.stockOrder.created > b.stockOrder.created
                ? -1
                : (a.stockOrder.created < b.stockOrder.created
                    ? 1
                    : 0
                )
        })

        // for(let poh of purchaseOrdersPOH) {
        //     timeline.push(poh)
        // }

        timeline.sort((a: ProcessingOrderHistory, b: ProcessingOrderHistory) => {
            const aa = !a.processingOrder ? Infinity : a.processingOrder.created
            const bb = !b.processingOrder ? Infinity : b.processingOrder.created
            if (aa > bb) return -1;
            if (aa < bb) return 1;
            return 0
        })
        timeline.push(purchasePOH)
        // console.log("SORT END")
        // // this.addOrganizationsToStockOrders(timeline)
        // console.log("ORGS DONE")
        return timeline
    }

    public addOrganizationsToStockOrders(poHistories: ProcessingOrderHistory[]) {
        for (const poh of poHistories) {
            for (const agg of poh.stockOrderAggs) {
                agg.stockOrder.organization = this.getForKey<ChainOrganization>(agg.stockOrder.organizationId)
            }
        }
    }


    public async extractTimeline2(history: ChainHistory, fieldDefinitionMap: Map<string, FieldDefinition>, documentDefinitionMap: Map<string, DocTypeIdsWithRequired>, pohCache: Map<string, ProcessingOrderHistory>, depth = 0) {
        const soid = history.stockOrder && history.stockOrder._id
        const tmpPOH = pohCache.get(soid)
        if (tmpPOH) {
            return; // visited
        }
        const proHistory = {
            depth,
            processingOrder: history.processingOrder,
            stockOrderAggs: [this.stockOrderAgg(history, fieldDefinitionMap, documentDefinitionMap)],
            stockOrderIds: new Set<string>(history.stockOrder._id)
        } as ProcessingOrderHistory;
        for (const ancestor of history.ancestors) {
            await this.extractTimeline2(ancestor, fieldDefinitionMap, documentDefinitionMap, pohCache, depth + 1)
        }
        pohCache.set(soid, proHistory)
    }

    fieldIDToFieldName(fieldID: string): string {
        const res = (fieldIDToFieldNameDict as any)[fieldID];
        if (!res) throw Error("Invalid fieldID")
        return res.field
    }

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

    isEmptyDocument(val: FieldDefinition[]) {
        if (!val) return true
        if (val.length < 3) return true
        if (val[2].files.length === 0) return true
        return false
    }

    public stockOrderAgg(history: ChainHistory, fieldDefinitionMap: Map<string, FieldDefinition>, documentDefinitionMap: Map<string, DocTypeIdsWithRequired>): StockOrderAgg {
        const agg = {
            stockOrder: history.stockOrder,
            fields: [],
            documents: []
        } as StockOrderAgg;

        // const action = history.processingOrder && history.processingOrder.processingAction
        const action = history.processingOrder && this.getForKey<ChainProcessingAction>(history.processingOrder.processingActionId)
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
            // const evt = new ChainProcessingEvidenceTypeDB()
            const evidenceIdToEvidence = new Map<string, ChainProcessingEvidenceType>()
            const evidenceTypeIds = action.requiredDocTypeIdsWithRequired.map(x => x.processingEvidenceTypeId)
            // const evidenceTypes = await evt.readForIds(this.dbService, evidenceTypeIds)
            const evidenceTypes = evidenceTypeIds.map(id => this.getForKey<ChainProcessingEvidenceType>(id))
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

    public extractFacilitiesAndOrganizations(processingOrderHistory: ProcessingOrderHistory[]) {
        for (const poh of processingOrderHistory) {
            for (const agg of poh.stockOrderAggs) {
                const facId = agg.stockOrder.facilityId;
                const orgId = agg.stockOrder.organizationId
                // agg.stockOrder.facility = facMap.get(facId)
                // agg.stockOrder.organization = orgMap.get(orgId)
                agg.stockOrder.facility = this.getForKey<ChainFacility>(facId)
                agg.stockOrder.organization = this.getForKey<ChainOrganization>(orgId)
            }
        }
    }


    public enrichStockOrder(stockOrder: ChainStockOrder) {
        stockOrder.gradeAbbreviation = this.getForKey(stockOrder.gradeAbbreviationId)
        stockOrder.requiredQuality = this.getForKey(stockOrder.requiredQualityId)
        // stockOrder.client = this.getForKey(stockOrder.clientId)
        // if (stockOrder.clientId) {
        //     stockOrder.client = await this.getOrganizationByCompanyId(stockOrder.clientId)
        // }
        stockOrder.facility = this.getForKey(stockOrder.facilityId)
        stockOrder.semiProduct = this.getForKey(stockOrder.semiProductId)
        stockOrder.representativeOfProducerUserCustomer = this.getForKey(stockOrder.representativeOfProducerUserCustomerId)
        stockOrder.processingOrder = this.getForKey(stockOrder.processingOrderId)
        if (stockOrder.processingOrder) {
            stockOrder.processingOrder.processingAction = this.getForKey(stockOrder.processingOrder.processingActionId)
        }
        stockOrder.consumerCompanyCustomer = this.getForKey(stockOrder.consumerCompanyCustomerId)
        stockOrder.productOrder = this.getForKey(stockOrder.orderId)
        stockOrder.triggerOrders = (stockOrder.triggerOrderIds || []).map(id => this.getForKey(id))
        stockOrder.inputTransactions = this._inputTransactions.get(stockOrder._id) || []
        if (stockOrder.inputTransactions.length === 0 && stockOrder.processingOrderId) {
            stockOrder.inputTransactions = this._inputTransactions.get(stockOrder.processingOrderId) || []
        }
        stockOrder.outputTransactions = this._outputTransactions.get(stockOrder._id)
        stockOrder.inputOrders = stockOrder.inputTransactions.map(el => this.getForKey(el.sourceStockOrderId))
        stockOrder.processingAction = this.getForKey(stockOrder.processingActionId)
        stockOrder.measurementUnitType = this.getForKey(stockOrder.measurementUnitType._id)
        stockOrder.triggeredOrders = this._triggeredOrders.get(stockOrder._id)
        // stockOrder.balance =
        // stockOrder.balance = await this.balanceForPurchaseOrder(stockOrder);


    }

    public enrichProductOrder(order: ChainProductOrder) {
        order.facility = this.getForKey(order.facilityId)
        order.customer = this.getForKey(order.customerId)
        order.requiredGrade = this.getForKey(order.requiredGradeId)
        order.items = this._quoteOrders.get(order._id) || []
    }
}

// return Nano(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@localhost:5984`)