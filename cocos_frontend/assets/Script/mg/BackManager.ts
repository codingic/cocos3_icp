
import * as cc from 'cc';
import { _decorator } from 'cc';
import { BACKEND_CANISTER_ID_LOCAL_FALLBACK } from "./DefData";
import { getBackendActor } from "../icp";

export default class BackManager {
    public static readonly Instance: BackManager = new BackManager();
    private constructor() {}
    Init() {

    }
    private getGlobal(): any {
        // return (typeof globalThis !== 'undefined'
        // ? globalThis
        // : (typeof window !== 'undefined'
        // ? window
        // : (typeof self !== 'undefined' ? self : {})));
    }
    private getBackendCanisterId(): string {
           return BACKEND_CANISTER_ID_LOCAL_FALLBACK;
    }
    private async ensureBackendActor(): Promise<any> {
        const canisterId = this.getBackendCanisterId();
        if (!canisterId) {
            throw new Error('Backend canisterId not found. Deploy backend first, then sync app canister ids.');
        }
        return await getBackendActor({ canisterId });
    }
    async GetEthAddressFromBack(): Promise<string> {
        cc.log("BackManager: GetEthAddressFromBack called");
        const actor = await this.ensureBackendActor();
        cc.log("BackManager: actor ensured");

        const publicKey = await actor.get_eth_public_key();
        cc.log("BackManager: GetEthAddressFromBack publicKey received:", publicKey);
        const pkBytes = new Uint8Array(publicKey);
        cc.log("BackManager: GetEthAddressFromBack publicKey bytes:", pkBytes);

        // ethers v6 API: computeAddress/hexlify are top-level exports.
        return ethers.computeAddress(ethers.hexlify(pkBytes));
    }

    async GetEthPubkeyFromCFS(): Promise<string> {
        cc.log("BackManager: GetEthPubkeyFromCFS called");
        const actor = await this.ensureBackendActor();
        cc.log("BackManager: GetEthPubkeyFromCFS ensured");

        const publicKey = await actor.requestPubkey();//hex
        cc.log("BackManager: GetEthPubkeyFromCFS publicKey:"+publicKey);
        
        const publicKeyHex1 =  ethers.hexlify(publicKey);
        cc.log("BackManager: GetEthPubkeyFromCFS publicKeyHex1:"+publicKeyHex1);
        return ethers.computeAddress(ethers.hexlify(publicKey));
    }

    async GetEthAddressFromCFS(): Promise<string> {
        cc.log("BackManager: GetEthAddressFromCFS called");
        const actor = await this.ensureBackendActor();
        cc.log("BackManager: GetEthAddressFromCFS ensured");

        const ethaddress = await actor.requestAndSaveEthAddress();
        return ethaddress;
    }


    async Sign(data: Uint8Array | number[] | string): Promise<Uint8Array> {
        cc.log("BackManager: Sign called");
        const actor = await this.ensureBackendActor();
        cc.log("BackManager: actor ensured for signing");

        let bytes: Uint8Array;
         if (typeof data === 'string') {
         try {
		 // ethers v6 API: isHexString/getBytes/toUtf8Bytes are top-level exports.
		 bytes = ethers.isHexString(data) ? ethers.getBytes(data) : ethers.toUtf8Bytes(data);
         } catch (e) {
             // 如果不是 hex 字符串，按 UTF-8 编码
		 bytes = ethers.toUtf8Bytes(data);
         }
        } else if (data instanceof Uint8Array) {
        bytes = data;
        } else if (Array.isArray(data)) {
        bytes = new Uint8Array(data);
        } else {
        throw new Error('BackManager.Sign: unsupported data type');
        }

        cc.log("BackManager: signing bytes length=", bytes.length);
        const sigBlob = await actor.sign(Array.from(bytes));
        const sigBytes = new Uint8Array(sigBlob);
        cc.log("BackManager: signature bytes length=", sigBytes.length);
        return sigBytes;
    }
}
