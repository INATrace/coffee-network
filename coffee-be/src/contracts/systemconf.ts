import { Factory, Inject, Singleton } from "typescript-ioc";
import { ChainActionTypeDB } from "../models/chain/ChainActionType";
import { ChainFacilityDB } from "../models/chain/ChainFacility";
import { ChainFacilityTypeDB } from "../models/chain/ChainFacilityType";
import { ChainFileInfoDB } from "../models/chain/ChainFileInfo";
import { ChainFileReferenceDB } from "../models/chain/ChainFileReference";
import { ChainMeasureUnitTypeDB } from "../models/chain/ChainMeasureUnitType";
import { ChainOrganizationDB, ChainOrganization } from "../models/chain/ChainOrganization";
import { ChainProductDB } from "../models/chain/ChainProduct";
import { ChainProductOrderDB } from "../models/chain/ChainProductOrder";
import { ChainStockOrderDB } from "../models/chain/ChainStockOrder";
import { ChainTransactionDB } from "../models/chain/ChainTransaction";
import { ChainUserDB } from "../models/chain/ChainUser";
import { DBDocument } from "../models/chain/DBDocument";
import { DatabaseService } from "../services/databaseService";
import { aggregateViews } from "./aggregates/aggregates";
import { customViews } from "./views/custom_views";
import codebook from "./indexes/codebook.json";
import codebook_label from "./indexes/codebook-label.json";
import docType from "./indexes/doc-type.json";
import organization_id from "./indexes/organization-id.json";
import id_link from "./indexes/id-link.json";
import inputTransactions from "./indexes/input-transactions.json";
import outputTransactions from "./indexes/output-transactions.json";
import stock_order_facility from "./indexes/stock-order-facility.json";
import stock_order_facility_semi_product from "./indexes/stock-order-facility-semi-product.json";
import product_and_organization_id from "./indexes/product-and-organization-id.json";
import product_and_organization_id_name from "./indexes/product-and-organization-id-name.json";
import organization_id_name from "./indexes/organization-id-name.json";
import stock_order_id from './indexes/stock-order-id.json'
import paying_organization_id_receipt_number from './indexes/paying-organization-id-receipt-number.json';
import bank_transfer_id from './indexes/bank-transfer-id.json'
import producer_user_id_formal_creation_time from './indexes/producer-user-id-formal-creation-time.json'
import recipient_customer_id_formal_creation_time from './indexes/recipient-customer-id-formal-creation-time.json'
import product_id from './indexes/product-id.json'
import semi_product_id from './indexes/semi-product-id.json'
import last_change from "./indexes/last-change.json";
import quote_orders from "./indexes/quote-orders.json";
import { BlockchainService } from "../services/blockchainService";

interface TmpSingleIndexConf {
    index: string;
    config: any;
}

interface TmpIndexConfig {
    dbname: string;
    indices: TmpSingleIndexConf[];
}

const CLASSES = [
    ChainActionTypeDB,
    ChainFacilityDB,
    ChainFacilityTypeDB,
    ChainFileInfoDB,
    ChainFileReferenceDB,
    ChainMeasureUnitTypeDB,
    ChainOrganizationDB,
    ChainProductDB,
    ChainProductOrderDB,
    ChainStockOrderDB,
    ChainTransactionDB,
    ChainUserDB
]

// const DATABASES = CLASSES.map((x: any) => (new x())._dbname)

const DATABASES = ['chain_object']

const DELETE_PASS = '   '

const INDEX_CONFIG: TmpIndexConfig[] = [
    {
        dbname: "chain_object",
        indices: [
            {
                index: "inputTransactions",
                config: inputTransactions
            },
            {
                index: "outputTransactions",
                config: outputTransactions
            },
            {
                index: "docType",
                config: docType
            },
            {
                index: "codebook",
                config: codebook
            },
            {
                index: "codebook_label",
                config: codebook_label
            },
            {
                index: "id_link",
                config: id_link
            },
            {
                index: "organization_id",
                config: organization_id
            },
            {
                index: "organization_id_name",
                config: organization_id_name
            },
            {
                index: "stock_order_facility",
                config: stock_order_facility
            },
            {
                index: "stock_order_facility_semi_product",
                config: stock_order_facility_semi_product
            },
            {
                index: "product_and_organization_id",
                config: product_and_organization_id
            },
            {
                index: "product_and_organization_id_name",
                config: product_and_organization_id_name
            },
            {
                index: "stock_order_id",
                config: stock_order_id
            },
            {
                index: "paying_organization_id_receipt_number",
                config: paying_organization_id_receipt_number
            },
            {
                index: "bank_transfer_id",
                config: bank_transfer_id
            },
            {
                index: "producer_user_id_formal_creation_time",
                config: producer_user_id_formal_creation_time
            },
            {
                index: "recipient_customer_id_formal_creation_time",
                config: recipient_customer_id_formal_creation_time
            },
            {
                index: "product_id",
                config: product_id
            },
            {
                index: "semi_product_id",
                config: semi_product_id
            },
            {
                index: "last_change",
                config: last_change
            },
            {
                index: "quote_orders",
                config: quote_orders
            },
        ]
    }
]

@Singleton
@Factory(() => new SystemConf())
export class SystemConf {
    @Inject
    public dbService: DatabaseService

    @Inject
    public bcService: BlockchainService

    get isBlockchainApp() {
        return process.env.APP_MODE === 'BLOCKCHAIN'
    }

    get isNodeApp() {
        return process.env.APP_MODE === 'NODE'
    }

    createDatabase(dbname: string) {
        return this.dbService.writeConnection.db.create(dbname)
    }

    createDatabaseGracefully(dbname: string) {
        return this.dbService.writeConnection.db.create(dbname)
            .then(
                resp => Promise.resolve(`${ dbname } created`),
            )
            .catch(e => {
                return Promise.resolve('' + e)
            })
    }


    getDatabasePermissions(dbname: string) {
        const call = this.dbService.writeConnection.request as any;
        return call({ db: dbname, method: 'get', path: '/_security' });
    }

    setPermissionsToDatabase(dbname: string): Promise<any> {
        const call = this.dbService.writeConnection.request as any
        return call({
            db: dbname,
            method: 'put',
            path: '/_security', body:
            {
                admins: { names: [`${ process.env.COUCHDB_USER }`], roles: ["admins"] },
                members: { names: [`${ process.env.COUCHDB_USER }`], roles: [] },
            }
        });
    }

    async createDatabases(res: any[] = []) {
        for (const dbname of [this.dbService.R_DATABASE_NAME]) {
            const create = await this.createDatabaseGracefully(dbname);
            const permissions = await this.setPermissionsToDatabase(dbname);
            res.push({ dbname, create, permissions })
        }
        return res;
    }

    async deleteDatabases(password: string, res: any[] = []) {
        if (password !== DELETE_PASS) {
            return {}
        }
        const result = {} as any;

        for (const dbname of DATABASES) {
            const del = await this.dbService.writeConnection.db.destroy(dbname).then(
                resp => Promise.resolve(`${ dbname } deleted`),
            )
                .catch(e => {
                    return Promise.resolve('' + e)
                })
            result[dbname] = del
        }
        res.push(result)
        return res;
    }

    async createIndices(res: any[] = []) {
        for (const dbase of INDEX_CONFIG) {

            let db = null
            if(this.isNodeApp) {
                db = this.dbService.writeConnection.db.use(dbase.dbname);
            }
            if(this.isBlockchainApp) {
                db = this.dbService.readConnection.db.use(dbase.dbname);
            }
            for (const index of dbase.indices) {
                const response = await db.createIndex(index.config)
                res.push(`${ dbase.dbname }.${ index.index }: ${ response.result }`)
            }
        }
        for (const agg of aggregateViews) {
            const resp = await this.dbService.readDatabase.get(agg._id).catch(e => Promise.resolve(e))
            let newAgg;
            if (resp) newAgg = { ...agg, _rev: resp._rev }
            else newAgg = agg;
            const response = await this.dbService.readDatabase.insert(newAgg).catch(e => Promise.resolve(e))
            res.push([`View: ${ agg._id }`, response])
        }
        for (const cust of customViews) {
            const resp = await this.dbService.readDatabase.get(cust._id).catch(e => Promise.resolve(e))
            let newCust;
            if (resp) newCust = { ...cust, _rev: resp._rev }
            else newCust = cust;
            const response = await this.dbService.readDatabase.insert(newCust).catch(e => Promise.resolve(e))
            res.push([`View: ${ cust._id }`, response])
        }
        return res
    }

    async prefillDB(res: any[] = []) {
        for (const cls of CLASSES) {
            for (const doc of cls.prefill()) {
                const document = (doc as DBDocument<any>)
                const response = await document.save(this.dbService).catch(e => Promise.resolve(e))
                res.push([`${ (document as any).docType }.${ document._id }`, response])
            }
        }
        return res;
    }

    async initialize() {
        const res: any[] = [];
        await this.createDatabases(res);
        await this.createIndices(res);
        await this.prefillDB(res);
        return res;
    }

    async initializeBlockchain() {
        await this.bcService.initialize();
    }

    async testBlockchain() {
        return await this.bcService.test();
    }

    async testOrganization(key: string, value: ChainOrganization) {
        return await this.bcService.insertOrganization(key, value)
    }

    async getObject(key: string) {
        return await this.bcService.getChainObject(key)
    }
}