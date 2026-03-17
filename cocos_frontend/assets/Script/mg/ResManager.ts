import { _decorator, resources } from 'cc';
import UIPanel from "../ui/UIPanel"
import {EUIPanelType} from "../CommonEnum";
import {UIPanelTab,SkillTab, FunctionTab,CoinTab} from "../TableStruct";

export default class ResManager {
    toRead(strParam:string, strType:string):any
    {
        if( strType === 'number')
        {
            return parseFloat(strParam);
        }
        else if(strType === 'string')
        {
            return strParam;
        }
        else if(strType === 'arrayfloat')
        {
            let vstrTitle: string[] = strParam.split('|');
            let vintA: number[] = [];
            for(let nIndex=0; nIndex < vstrTitle.length; ++nIndex)
            {
                vintA[nIndex] = parseFloat(vstrTitle[nIndex]);
            }
            return vintA;
        }
        else if(strType === 'arraystring')
        {
            let vstrTitle: string[] = strParam[2].split('|');
            return vstrTitle;
        }
        return '';
    }
    public static readonly Instance: ResManager = new ResManager();
    private ResManager(){
    }
    mapUIPanelTab: {[key: number]: UIPanelTab} = {};
    mapSkillTab: {[key: number]: SkillTab} = {};
    mapFunctionTab: {[key: number]: FunctionTab} = {};
    mapCoinTab: {[key: number]: CoinTab} = {};
    mapNameTabData: {[key: string]: any} = 
    {
        'uipanel': [UIPanelTab, this.mapUIPanelTab],
        'functiontype': [FunctionTab, this.mapFunctionTab],
        'coin': [CoinTab, this.mapCoinTab],
    };
    onLoadTabEnd(err, res){
        console.log('onLoadTabEnd=' + (res && res.name));

        let strContent: string = res.text;
        let vstrArray: string[] = strContent
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        let vstrTitleType: string[] = vstrArray[0].split(',')
        let vstrTitle: string[] = vstrArray[1].split(',')

        let tabAny = this.mapNameTabData[res.name][0];
        let mapData = this.mapNameTabData[res.name][1]

        for(let nIndex=2; nIndex<vstrArray.length; ++nIndex)
        {
            let vstrLine: Array<string> = vstrArray[nIndex].split(',')
            if(vstrLine.length < vstrTitleType.length)
            {
                continue;
            }
            let uiPanelTab = new tabAny();
            for(let nIndexLine=0; nIndexLine<vstrTitleType.length; ++nIndexLine)
            {
            let strTitleName = vstrTitle[nIndexLine]
            let strTitleType = vstrTitleType[nIndexLine]
            uiPanelTab[strTitleName] = this.toRead(vstrLine[nIndexLine], strTitleType)
            }
        mapData[uiPanelTab.nId] = uiPanelTab;

        }
    }
    Init(){
        for(let key in this.mapNameTabData)
        {
            resources.load(key, this.onLoadTabEnd.bind(this));
        }
    }
}
