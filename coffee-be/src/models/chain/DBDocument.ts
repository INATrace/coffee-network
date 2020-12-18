import nano, { DocumentInsertResponse, MaybeDocument, DocumentFetchResponse, DocumentResponseRow } from "nano";
import { DatabaseService } from "../../services/databaseService";
import { PaginatedList } from "./PaginatedList";
import { v4 as uuid } from 'uuid';

// export interface DocType {
//     docType?: string | null;
//     _id?: string | null;
//     _rev?: string | null;
// }

export interface DocType {
    docType?: string | null;
    _id?: string | null;
    _rev?: string | null;
    // hyperledger fields
    dbKey?: string | null;
    mode__?: 'insert' | 'insert_as_is' | 'update';
}

export interface TimeStamped {
    /**
     * Timestamp of creation
     */
    created?: string | null;
    /**
     * Timestamp of last change
     */
    lastChange?: string | null;
    /**
     * Id of user that created the document.
     */
    userCreatedId?: string | null;
    /**
     * Id of user that changed the document.
     */
    userChangedId?: string | null;
}

export interface ViewFilterParams {
    limit?: number;
    offset?: number;
    sort?: 'ASC' | 'DESC';
    sortBy?: string;
}

export interface ForeignKeyValidation {
    field: string;
    _id: string;
    docType: string;
}

export interface ForeignKeyScheme {
    field: string;
    docType: string;
    required: boolean;
}

export class DBDocument<T> implements MaybeDocument, DocType {
    // id: string;
    _deleted?: boolean;
    _prefix: string;
    _id?: string;
    _rev?: string;
    docType: string;

    public constructor(t?: T) {
        this.set(t)
    }

    // public get internalId(): string {
    //     return this.id
    // }

    public set value(val: T) {
        this.set(val);
    }

    public get value(): T {
        const res: any = {}
        for (const key in this) {
            // if (key.startsWith('_') || typeof this[key] === "function") continue;
            if (['_prefix'].indexOf(key) >= 0 || typeof this[key] === "function") continue;
            res[key] = this[key];
        }
        return res as T;
    }

    private async checkIfCanInsert(dbService: DatabaseService) {
        // Foreign key test
        const testList: ForeignKeyValidation[] = []
        for (const scheme of this.foreignKeySchemes) {
            const val = (this as any)[scheme.field];
            const missing = typeof val === "undefined" || val == null;
            if (missing && scheme.required) throw Error(`Foreign key '${ scheme.field }' is required`);
            if (!missing) {
                testList.push(
                    {
                        field: scheme.field,
                        _id: val,
                        docType: scheme.docType
                    }
                )
            }
        }
        if (testList.length > 0) {
            const response = await DBDocument.validateForeignKeys(dbService, testList).catch(
                err => Promise.resolve(err)
            )
            if (response !== true) {
                throw response;
            }
        }
        // Duplicate test
        const id = (this as any).id as number;
        if (typeof id === "undefined" || id == null) return true;

        // // OLD Version
        // const resp = await this.readAll(dbService, "id_link", "id_link", null, [id])
        // if (resp.items.length === 0) return true;

        // for (const item of resp.items) {
        //     if ((item as any)._id !== (this as any)._id) return false;
        // }

        // NEW Version
        const resp = await this.cAllForLinkId(dbService, id);
        for (const item of resp) {
            if ((item as any)._id !== (this as any)._id) return false;
        }

        return true;

        // typeof this._id === "undefined" || this._id == null) return true;

    }

    public get saveValue() {
        const res: any = {}

        for (const key in this) {
            if (typeof this[key] === "function" || ((key.startsWith("_") && ['_id', '_rev'].indexOf(key) < 0))) {
                continue;
            }
            if (['_id', '_rev'].indexOf(key) >= 0 && (this._id == null || this._rev == null)) {
                continue;
            }
            if (this.fieldsToCleanOnSave.indexOf(key) < 0) {
                res[key] = this[key];
            }
        }
        // console.log("RES SAVE:", res._id)
        // res._id=this.dbKey(this.internalId)
        if (!res._id) {
            res._id = uuid();
        }
        // console.log("SAVE VALUE:", res)
        return res;
    }

    public set(t: T) {
        if (t) {
            Object.assign(this, t);
        }
    }

    public save(dbService: DatabaseService): Promise<DBDocument<T>> {
        if (this._deleted) throw Error("Cannot save deleted object")
        // if(!this.docType) throw Error("No database name")
        // const db = dbService.connection.db.use(this.docType);
        return this.checkIfCanInsert(dbService).then(
            (resp1: boolean) => {
                if (!resp1) {
                    return Promise.reject(`Duplicate id: ${ (this as any).id }`)
                } else {
                    return dbService.writeDatabase.insert(this.saveValue).then(
                        (response: any) => {
                            this.processAPIResponse(response, true)
                            return this
                        },
                        (reason: any) => {
                            return Promise.reject(reason)
                        }
                    )
                }
            },
            (reason1: any) => {
                return Promise.reject(reason1);
            }
        )
    }

    public async delete(dbService: DatabaseService) {
        return dbService.writeDatabase.destroy(this._id, this._rev)
    }

    private getDbKey(id: any): string {
        if (id == null) throw Error("id key must not be null.")
        // return this._prefix + id
        return id;
    }

    public async read(dbService: DatabaseService, id: any, writeDatabase = false): Promise<DBDocument<T>> {
        // if(!this.docType) throw Error("No database name")
        // const db = dbService.connection.db.use(this.docType);
        const db = writeDatabase ? dbService.writeDatabase : dbService.readDatabase
        const response = await db.get(this.getDbKey(id))
        Object.assign(this, response)
        return this
    }

    public async cRead(dbService: DatabaseService, id: any): Promise<DBDocument<T>> {
        // if(!this.docType) throw Error("No database name")
        // const db = dbService.connection.db.use(this.docType);
        const response = await dbService.writeDatabase.get(this.getDbKey(id))
        Object.assign(this, response)
        return this
    }

    public async readByLinkId(dbService: DatabaseService, id: number): Promise<DBDocument<T>> {
        if (!this.docType) throw Error("No docType")
        const response = await dbService.readDatabase.view('id_link', 'id_link', {
            key: [this.docType, id],
            reduce: false,
            include_docs: true,
        })
        const items = response.rows.map(doc => (new DBDocument<T>((doc as any).doc)).value as T)
        if (items.length === 0) throw Error("Not found")
        Object.assign(this, items[0])
        return this
    }

    public async cAllForLinkId(dbService: DatabaseService, id: number): Promise<T[]> {
        if (!this.docType) throw Error("No docType")
        const response = await dbService.writeDatabase.view('id_link', 'id_link', {
            key: [this.docType, id],
            // startkey: [this.docType, id],
            // endkey: [this.docType, id, {}],
            reduce: false,
            include_docs: true,
        })
        return response.rows.map(doc => {
            return new DBDocument<T>((doc as any).doc).value as T;
        })
    }

    public async readForLinkIds(dbService: DatabaseService, ids: number[]): Promise<T[]> {
        if (!this.docType) throw Error("No docType")
        const response = await dbService.readDatabase.view('id_link', 'id_link', {
            keys: ids.map((id: number) => [this.docType, id]),
            reduce: false,
            include_docs: true,
        })
        const items = response.rows.map(doc => (new DBDocument<T>((doc as any).doc)).value)
        return items;
    }

    public async readForIds(dbService: DatabaseService, ids: string[], writeDatabase = false): Promise<T[]> {
        if (!this.docType) throw Error("No docType");
        if (ids.length === 0) return []
        const db = writeDatabase ? dbService.writeDatabase : dbService.readDatabase
        const response = await db.fetch({ keys: ids })
        const items = response.rows.map(doc => (new DBDocument<T>((doc as any).doc)).value)
        return items;
    }

    // if additinalEndKeys != null then additionalKeys is considered as startKeys
    public async readAll(dbService: DatabaseService, ddoc?: string, indexName?: string, filterParams?: ViewFilterParams, additionalKeys?: (string | number | null | {})[], additionalEndKeys?: (string | number | null | {})[], writeDatabase = false): Promise<PaginatedList<T>> {
        if (!this.docType) throw Error("No docType")
        const desc: boolean = filterParams && filterParams.sort === 'DESC' ? true : false
        // const startKeys = additionalKeys ? additionalKeys.filter(x => x !== null) : []
        const startKeys = ddoc ? additionalKeys : null
        const endKeys = ddoc
            ? (additionalEndKeys
                ? additionalEndKeys
                : [...startKeys, {}])
            : null
        // let infinity: any = [{}]
        // // Preveriti !!!
        // if (!additionalEndKeys) {
        //     infinity = additionalKeys ? additionalKeys.filter(x => x === null).map(x => { return {} }) : []
        //     infinity.push({})
        // } else {
        //     infinity = additionalEndKeys ? additionalEndKeys.filter(x => x === null).map(x => { return {} }) : []
        //     infinity.push({})
        // }

        // console.log("SK:", ddoc, ddoc
        //     ? (desc ? [this.docType, ...endKeys] : [this.docType, ...startKeys])
        //     : undefined, ddoc        // ? (!desc ? [this.docType, ...endKeys, ...infinity] : [this.docType, ...startKeys])
        //     ? (!desc ? [this.docType, ...endKeys] : [this.docType, ...startKeys])
        //     : undefined)

        const query = {
            // group: true,
            key: ddoc ? undefined : [this.docType],
            // keys: [this.docType],
            startkey: ddoc
                // ? (desc ? [this.docType, ...endKeys, ...infinity] : [this.docType, ...startKeys])
                ? (desc ? [this.docType, ...endKeys] : [this.docType, ...startKeys])
                : undefined,
            endkey: ddoc
                // ? (!desc ? [this.docType, ...endKeys, ...infinity] : [this.docType, ...startKeys])
                ? (!desc ? [this.docType, ...endKeys] : [this.docType, ...startKeys])
                : undefined,
            sorted: true,
            descending: desc,
        }
        // console.log("QQ:", {
        //     DDOC: ddoc ? ddoc : 'doc_type', INDEX: indexName ? indexName : 'doc_type', ...query, reduce: false,
        //     include_docs: true,
        //     limit: filterParams && filterParams.limit ? filterParams.limit : undefined,
        //     skip: filterParams && filterParams.offset ? filterParams.offset : undefined
        // })
        const db = writeDatabase ? dbService.writeDatabase : dbService.readDatabase
        const response = await db.view(ddoc ? ddoc : 'doc_type', indexName ? indexName : 'doc_type', {
            ...query,
            reduce: false,
            include_docs: true,
            limit: filterParams && filterParams.limit ? filterParams.limit : undefined,
            skip: filterParams && filterParams.offset ? filterParams.offset : undefined
        })
        const countResponse = await db.view(ddoc ? ddoc : 'doc_type', indexName ? indexName : 'doc_type', {
            ...query,
            reduce: true,
        })
        const count = countResponse.rows && countResponse.rows.length === 1 ? countResponse.rows[0].value as number : 0
        const items = response.rows.map(doc => (new DBDocument<T>((doc as any).doc)).value as T)
        return new PaginatedList<T>(items, count, filterParams ? filterParams.limit : undefined, filterParams ? filterParams.offset : undefined)
    }

    public get foreignKeySchemes(): ForeignKeyScheme[] {
        return []
    }

    public get fieldsToCleanOnSave(): string[] {
        return []
    }

    // public async readValue(dbService: DatabaseService, id: any): Promise<T> {
    //     let resp = await this.read(dbService, id);
    //     return resp.value;
    // }

    private processAPIResponse(response: DocumentInsertResponse, clean = false) {
        if (response.ok === true) {
            this._id = response.id
            this._rev = response.rev
        }
        if(clean) {
            for(const key of this.fieldsToCleanOnSave) {
                delete (this as any)[key]
            }
        }
    }

    static prefill(): any[] {
        return []
    }

    static validateForeignKeys(dbService: DatabaseService, fks: ForeignKeyValidation[]): Promise<boolean> {
        const ids = fks.map(x => x._id);
        const checkMap = new Map<string, string>();
        fks.forEach(fk => checkMap.set(fk._id, fk.docType));
        return dbService.writeDatabase.fetch({
            keys: ids
        }).then(
            (resp: DocumentFetchResponse<any>) => {
                let i = 0;
                for (const row of resp.rows) {
                    const rany = row as any;
                    if (rany.error || !rany.doc) return Promise.reject(`Wrong value for key '${ fks[i].field }'. Value: '${ fks[i]._id }'`);
                    if (checkMap.get(rany.doc._id) && rany.doc.docType !== checkMap.get(rany.doc._id)) return Promise.reject(`Wrong docType for key '${ fks[i].field }'. DocType exists for '${ rany.doc.docType }' but not for '${ fks[i].docType }'`)
                    i += 1
                }
                return Promise.resolve(true)
            },
            (reason: any) => {
                return Promise.reject(reason);
            }
        )
    }
}
