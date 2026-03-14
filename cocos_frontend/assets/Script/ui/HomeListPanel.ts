
import * as cc from 'cc';
const {ccclass, property} = cc._decorator;

import UIPanel from "./UIPanel"
import UIManager from "../mg/UIManager";
import { EUIPanelType } from "../CommonEnum";
import {TableView,CellData} from "./TableView";
import ResManager from "../mg/ResManager";


class HomeListCell extends CellData{
    labName:cc.Label;
    btnIcon:cc.Button;
    labContent:cc.RichText;
    nOldBgHeight:number;
    labPriceLow:cc.Label;
    labPriceHi:cc.Label;
    labPriceScale:cc.Label;
    labCap:cc.Label;

    init(node){
        this.node = node;
        this.btnIcon = this.node.getChildByName('btnicon').getComponent(cc.Button);
        this.labName = this.btnIcon.node.getChildByName('labelname').getComponent(cc.Label);
        this.labCap = this.btnIcon.node.getChildByName('labelcap').getComponent(cc.Label);
        const uiTrans = this.node.getComponent(cc.UITransform);
        this.nOldBgHeight = uiTrans ? uiTrans.height : 0;
    }
    refreshUI(info:ListCellData){
        this.labName.string = info.sName;//sName
        this.labCap.string = info.nId.toString()
    }
}
class ListCellData{
    nId:number;
    sName: string;
}

@ccclass('HomeListPanel')
export default class HomeListPanel extends UIPanel {
    tableview: TableView;
    vListData: ListCellData[] = [];
    heightCell: HomeListCell;
    editBox: cc.EditBox;
    nIndexReq: number;
    nOrderState: number;

    onLoad(){

      
        

        this.tableview = this.node.getChildByName('tableview').getComponent(TableView);
        this.tableview.setRefreshCellCallBack(this, this.refreshCell, this.getCellHeight);

        this.tableview.nodeElement.active = false;

    }
    start () {
    }
    RefreshUI(){
         this.tableview.reloadData(this.vListData.length);
    }

  
    OnResult(strResponseText:string){
        // cc.log("OnResult");
        // cc.log(strResponseText);
        // let jsObj = JSON.parse(strResponseText)
        // let nPriceCur = jsObj["result"]["rate"]
        // let strSymbol = jsObj["result"]["asset_id_base"]

        // this.UpdateCurPrice(strSymbol,nPriceCur)

    }
 
    RefreshData() {
        this.vListData = [];

        let vName = ["多链钱包", //0
            "ii登录 ",
            "oisy登录", //2
            "官方singer",
            "oisy connect", //4
        ];

       //写个循环创建20个数据
        for(let i = 0; i < vName.length; i++) {
            let cellInfo = new ListCellData();
            cellInfo.nId = i;
            cellInfo.sName = vName[i];
            this.vListData.push(cellInfo);
         }


    }
    OnOpen( strParam: string)
    {
        this.RefreshData()
        this.RefreshUI()
    }
    
    OnClose()
    {
        
    }
    getCellHeight(nIndex:number)
    {
        return 200;
        
    }
    refreshCell( nIndex:number)
    {
        let cellData:any = this.tableview.dequeueCell();
        if(cellData === null)
        {
            cellData = new HomeListCell();
            let node = this.tableview.createElementNode();
            node.active = true;
            cellData.init(node);
            cellData.btnIcon.node.on(cc.Node.EventType.TOUCH_END, this.clickCell.bind(this,cellData.btnIcon),this);
        }
        cc.log('refreshCell'+nIndex);
        let cellInfo = this.vListData[nIndex];
        cellData.refreshUI(cellInfo);
        cellData.btnIcon.nTag = nIndex;
        
        return cellData;
    }
    clickCell(btnIcon)
    {
        let nIndex = btnIcon.nTag;
        cc.log('clickcell='+nIndex);
        let nId = this.vListData[nIndex].nId;
        if(nId === 0 )
        {
             UIManager.OpenPanel(EUIPanelType.WALLET);
        }
        else if(nId === 1 )
        {
            UIManager.OpenPanel(EUIPanelType.LOGIN);
        }
        else if(nId === 2 )
        {
            //oisy登录
            UIManager.OpenPanel(EUIPanelType.OISYCONNECTPANEL);
        }
        else if(nId === 3 )
        {
            //oisy登录
            UIManager.OpenPanel(EUIPanelType.CHAINFSPANEL);
        }
    }
  
    clickBegin(nTag){
        // cc.log('clickbegin'+nTag);
//        //UIManager.Instance.OpenPanel(EUIPanelType.HOME);
    }
    clickOrder(nTag){
    }
    
}
