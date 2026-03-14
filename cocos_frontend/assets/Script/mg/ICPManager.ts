// // Revert to bundled file

import * as cc from 'cc';
import { _decorator } from 'cc';
import UIManager from "../mg/UIManager";
import { DFX_NETWORK, LEAGER_ICP_ID_LOCAL } from "./DefData";
import { getLedgerActor, getPrincipalCtor } from "../icp";

export default class ICPManager {
    public static readonly Instance: ICPManager = new ICPManager();
    private ICPManager(){
    }           
 
    Init(){


    }
    private getDefaultLedgerCanisterId(): string {
        if (DFX_NETWORK === 'local') {
        return LEAGER_ICP_ID_LOCAL;
        }
        return 'ryjl3-tyaaa-aaaaa-aaaba-cai';
    }
    private async ensureLedgerActor(strLedgerCanisterId?: string): Promise<any> {

        const canisterId = (strLedgerCanisterId && strLedgerCanisterId.trim())
        ? strLedgerCanisterId.trim()
        : this.getDefaultLedgerCanisterId();

        cc.log("ICPManager: ensureLedgerActor using canisterId:", canisterId);
        return await getLedgerActor({ canisterId });
    }
    private parseIcpToE8s(amountText: string): number {
        const s = (amountText || '').trim();
        if (!s) throw new Error('amount is empty');
        if (!/^[0-9]+(\.[0-9]+)?$/.test(s)) throw new Error('invalid amount');

        const [intPart, fracPartRaw] = s.split('.');
        const fracPart = (fracPartRaw || '');
        if (fracPart.length > 8) throw new Error('too many decimals (max 8)');

        const fracPadded = (fracPart + '00000000').slice(0, 8);

       // 用 number 表示 e8s（TS target=es5，不使用 BigInt）。
       // 注意：只能安全表示 <= Number.MAX_SAFE_INTEGER 的 e8s。
        const e8s = parseInt(intPart, 10) * 100000000 + parseInt(fracPadded, 10);
        if (!Number.isFinite(e8s) || e8s < 0) {
        throw new Error('invalid amount');
        }
        if (e8s > Number.MAX_SAFE_INTEGER) {
        throw new Error('amount too large');
        }
        return e8s;
    }
    async GetBalance(principalText: string, strLedgerCanisterId: string): Promise<string> {
        const pText = (principalText || '').trim();
        if (!pText) return 'Balance: 0 ICP';

        const actor = await this.ensureLedgerActor(strLedgerCanisterId);

        cc.log("GetBalance principalText=",principalText);

        const owner = getPrincipalCtor().fromText(pText);
        const balanceE8sAny: any = await actor.icrc1_balance_of({ owner, subaccount: [] });
        const balanceE8sNum = Number(balanceE8sAny && balanceE8sAny.toString ? balanceE8sAny.toString() : balanceE8sAny);
        const balance = balanceE8sNum / 1e8;
        cc.log("GetBalance balance=", balance);
        return `Balance: ${balance.toFixed(8)} ICP`;
    }
    async SendICP(toPrincipalText: string, amountText: string, strLedgerCanisterId: string): Promise<string> {

        const toText = (toPrincipalText || '').trim();
        if (!toText) throw new Error('to address is empty');

        const actor = await this.ensureLedgerActor(strLedgerCanisterId);
        cc.log("SendICP toText=",toText);
		const toOwner = getPrincipalCtor().fromText(toText);
        cc.log("SendICP toOwner=", toOwner);
        const amountE8s = this.parseIcpToE8s(amountText);

        cc.log(`SendICP to=${toText} amount=${amountText} (${amountE8s} e8s)`);

       // Standard ICP fee is 10_000 e8s (0.0001 ICP)
       // const feeE8s = 10000;

        const res = await actor.icrc1_transfer({
        from_subaccount: [],
        to: { owner: toOwner, subaccount: [] },
        fee: [], // Use default fee
        memo: [],
        created_at_time: [],
        amount: amountE8s,
        });

        if (res && (res.Ok !== undefined)) {
        UIManager.ShowTip(`SendICP ok, blockIndex=${res.Ok}`);
        return `OK: blockIndex=${res.Ok}`;
        }
        const err = res && res.Err ? res.Err : res;
        // JSON.stringify cannot handle BigInt by default
        const errStr = JSON.stringify(err, (key, value) => (typeof value === 'bigint' ? value.toString() : value));
        throw new Error(`SendICP failed: ${errStr}`);
    }
    
}
