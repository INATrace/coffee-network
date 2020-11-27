import { default as Nano, default as nano } from 'nano';
import { Factory, Singleton } from "typescript-ioc";

@Singleton
@Factory(() => new DatabaseService())
export class DatabaseService {

    constructor() {
        // const tmp = new ChainOrganizationDB()
        // this.connection.db.create(tmp._dbname).then(resp => {console.log("Database " + tmp._dbname + " created")})
    }

    readonly R_DATABASE_NAME = this.isBlockchainApp ? `${ process.env.R_BC_DATABASE_NAME }` : `${ process.env.R_DATABASE_NAME }`
    readonly W_DATABASE_NAME = `${ process.env.W_DATABASE_NAME }`

    get isBlockchainApp() {
        return process.env.APP_MODE === 'BLOCKCHAIN'
    }

    get isNodeApp() {
        return process.env.APP_MODE === 'NODE'
    }

    public get readConnection(): nano.ServerScope {
        // console.log(`${process.env.R_CONN_STRING}`)
        if(this.isBlockchainApp) {
            return Nano(`http://${ process.env.R_BC_COUCHDB_USER }:${ process.env.R_BC_COUCHDB_PASSWORD }@${ process.env.R_BC_COUCHDB_HOST }:${ process.env.R_BC_COUCHDB_PORT }`)
        }
        if (this.isNodeApp) {
            return Nano(`http://${ process.env.R_COUCHDB_USER }:${ process.env.R_COUCHDB_PASSWORD }@${ process.env.R_COUCHDB_HOST }:${ process.env.R_COUCHDB_PORT }`)
        }
    }

    public get writeConnection(): nano.ServerScope {
        // console.log(`${process.env.W_CONN_STRING}`)
        return Nano(`http://${ process.env.W_COUCHDB_USER }:${ process.env.W_COUCHDB_PASSWORD }@${ process.env.W_COUCHDB_HOST }:${ process.env.W_COUCHDB_PORT }`)
    }

    public get readDatabase() {
        return this.readConnection.db.use(this.R_DATABASE_NAME);
    }

    public get writeDatabase() {
        return this.writeConnection.db.use(this.W_DATABASE_NAME);
    }
}

// return Nano(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@localhost:5984`)