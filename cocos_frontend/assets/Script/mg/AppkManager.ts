
import { _decorator } from 'cc';
import BackManager from "./BackManager";
import UIManager from "../mg/UIManager";
import LoginManager from "./LoginManager";
import ICPManager from "./ICPManager";
import { BACKEND_CANISTER_ID_LOCAL_FALLBACK } from "./DefData";

export default class AppManager {
    public static readonly Instance: AppManager = new AppManager();
    private constructor(){
    }
 
    Init(){
        LoginManager.Instance.Init();
        BackManager.Instance.Init();
        ICPManager.Instance.Init();
    }
    showTip(strTip: string)
    {
        UIManager.ShowTip(strTip);
    }
    GetBackendCanisterId(): string  {

         return BACKEND_CANISTER_ID_LOCAL_FALLBACK;

    }
}


/**
 * 注意：已把原脚本注释，由于脚本变动过大，转换的时候可能有遗落，需要自行手动转换
 */
// import BackManager from "./BackManager";
// import UIManager from ".././UIManager";
// import LoginManager from "./LoginManager";
// import ICPManager from "./ICPManager";
// 
// import { BACKEND_CANISTER_ID_LOCAL_FALLBACK } from "./DefData";
// 
// 
// export default class AppManager {
//     public static readonly Instance: AppManager = new AppManager();
//     private constructor(){
//     }
//  
//     Init(){
//         LoginManager.Instance.Init();
//         BackManager.Instance.Init();
//         ICPManager.Instance.Init();
//         
//     }
// 
//     showTip(strTip: string)
//     {
//         UIManager.ShowTip(strTip);
//     }
//     GetBackendCanisterId(): string  {
//        
//         return BACKEND_CANISTER_ID_LOCAL_FALLBACK;
//        
//     }
// 
// }
