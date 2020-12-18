import FabricCAServices from "fabric-ca-client";
import { Contract, Gateway, Wallets, Wallet } from "fabric-network";
import { Factory, Singleton } from "typescript-ioc";
import path from "path";
import fs from "fs";
import config from "../../blockchain/config.json"
import cpjsontemp from "../../blockchain/profiles/connection.json";
import testcompany from "./orgtest.json"

@Singleton
@Factory(() => new BlockchainService())
export class BlockchainService {

    private storage: Contract;

    get isBlockchainApp() {
        return process.env.APP_MODE === 'BLOCKCHAIN'
    }

    constructor() {
        // console.log("konstruktor")
        // if(this.isBlockchainApp) {
        //     console.log("INITIALIZING BC")
        //     this.initialize()
        // }
    }


    public async getFromStorage(key: string): Promise<any> {
        await this.initialize();
        const state = await this.evaluate(this.storage, "GetState", key);
        return JSON.parse(state.toString());
    }

    public async putToStorage(key: string, value: any) {
        await this.initialize(); // every service should
        const state = JSON.stringify(value);
        await this.submit(this.storage, "PutState", key, state);
    }

    public async manageState(mode: string, state: any, key = "ANY") {
        await this.initialize(); // every service should
        const stateJSON = JSON.stringify(state);
        await this.submit(this.storage, "ManageState", mode, stateJSON, key)
    }

    public async insertOrganization(key: string, value: any) {
        await this.initialize(); // every service should
        const state = JSON.stringify(value);
        await this.submit(this.storage, "InsertOrganization", key, state);
    }

    public async getChainObject(key: string) {
        await this.initialize(); // every service should
        const res = this.getFromStorage(key);
        return res;
    }

    private async evaluate(contract: Contract, method: string, ...args: string[]): Promise<Buffer> {
        return await contract.evaluateTransaction(method, ...args);
    }

    private async submit(contract: Contract, method: string, ...args: string[]): Promise<Buffer> {
        return await contract.submitTransaction(method, ...args);
    }

    public async test() {
        await this.initialize(); // every service should
        const key = 'STATE1';
        const value = { id: 1, type: "test", status: "activečšžČŠŽ" };
        await this.putToStorage(key, value);
        const valueBack = await this.getFromStorage(key);
        console.log(valueBack);
        return valueBack
    }

    public async testInsertOrganization() {
        await this.initialize(); // every service should
        const key = 'ORG1';
        const value = { id: 1, type: "test", status: "activečšžČŠŽ" };
        await this.putToStorage(key, value);
        const valueBack = await this.getFromStorage(key);
        console.log(valueBack);
        return valueBack
    }

    public async initialize() {
        if (this.storage) {
            return;
        }

        const cp = this.getConnectionProfile();
        const wallet = await this.getWallet(cp);

        try {
            const gateway = new Gateway();
            await gateway.connect(cp, {
                wallet,
                identity: process.env.B_CA_CLIENT_USERID,
                discovery: {
                    enabled: true,
                    asLocalhost: true // using a fabric network deployed locally
                }
            });
            const network = await gateway.getNetwork(config.channels.channel1.name);
            this.storage = network.getContract(config.chaincodes.chaincode0.name);
        } catch (e) {
            throw new Error(`Failed to connect to storage: ${e}`);
        }
    }

    private getConnectionProfile(): any {
        // const newmode = process.env.APP_MODE === "BLOCKCHAIN"; // temporary
        const newmode = true
        if (newmode) {
            return require("../../blockchain/config/files/cporg1.json")
        }

        try {
            const cp = cpjsontemp;

            const pemCoopPath = path.resolve("..", "artifacts", "channel", "crypto-config", "peerOrganizations", "", "tlsca", "");
            const pemCoop = fs.readFileSync(pemCoopPath, 'utf8');
            cp.peers[""].tlsCACerts.pem = pemCoop;

            const pemCAPath = path.resolve("..", "artifacts", "channel", "crypto-config", "peerOrganizations", "", "ca", "");
            const pemCA = fs.readFileSync(pemCAPath, 'utf8');
            cp.certificateAuthorities[""].tlsCACerts.pem = pemCA;

            return cp;
        } catch (e) {
            throw new Error(`Failed to prepare connection profile: ${e}`);
        }
    }

    private async getWallet(cp: any): Promise<Wallet> {
        let wallet;
        let adminIdentity;
        let clientIdentity;

        const CA_ORG = `${config.certificateAuthorities.org1.host}.${config.organizations.org1.domain}`;

        try {
            wallet = await Wallets.newFileSystemWallet(path.join("blockchain", "data", "wallets", CA_ORG));
            adminIdentity = await wallet.get(config.certificateAuthorities.org1.username);
            clientIdentity = await wallet.get(process.env.B_CA_CLIENT_USERID);
        } catch (e) {
            throw new Error(`Failed to prepare organization wallet: ${e}`)
        }

        if (adminIdentity && clientIdentity) {
            return wallet;
        }

        try {
            const caInfo = cp.certificateAuthorities[CA_ORG];
            const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caInfo.tlsCACerts.pem, verify: false }, caInfo.caName);

            if (!adminIdentity) {
                const enrollment = await caClient.enroll({
                    enrollmentID: config.certificateAuthorities.org1.username,
                    enrollmentSecret: config.certificateAuthorities.org1.password
                });
                const x509Identity = {
                    credentials: {
                        certificate: enrollment.certificate,
                        privateKey: enrollment.key.toBytes(),
                    },
                    mspId: cp.organizations[config.organizations.org1.name].mspid,
                    type: 'X.509',
                };
                await wallet.put(config.certificateAuthorities.org1.username, x509Identity);
                adminIdentity = await wallet.get(config.certificateAuthorities.org1.username);
            }

            if (!clientIdentity) {
                const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
                const adminUser = await provider.getUserContext(adminIdentity, config.certificateAuthorities.org1.username);

                const secret = await caClient.register({
                    enrollmentID: process.env.B_CA_CLIENT_USERID,
                    affiliation: process.env.B_CA_CLIENT_AFFILIATION,
                    role: 'client'
                }, adminUser);
                const enrollment = await caClient.enroll({
                    enrollmentID: process.env.B_CA_CLIENT_USERID,
                    enrollmentSecret: secret
                });
                const x509Identity = {
                    credentials: {
                        certificate: enrollment.certificate,
                        privateKey: enrollment.key.toBytes(),
                    },
                    mspId: cp.organizations[config.organizations.org1.name].mspid,
                    type: 'X.509',
                };
                await wallet.put(process.env.B_CA_CLIENT_USERID, x509Identity);
            }
        } catch (e) {
            throw new Error(`Failed to prepare admin and client identity: ${e}`);
        }

        return wallet;
    }

}