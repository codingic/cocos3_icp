
import * as cc from 'cc';
import { _decorator, log, Node, instantiate, BlockInputEvents, assetManager, resources, director } from 'cc';

import UIPanel from "../ui/UIPanel"
import {ESceneType} from "../CommonEnum";
import ResManager from "./ResManager";

export default class UIManager {
    public static readonly Instance: UIManager = new UIManager();
    public static OpenPanel(nPanelId: number, strParam?: string) {
         UIManager.Instance.OpenPanel(nPanelId, strParam);
    }
    
    public static ShowTip(strTip: string)
    {
        cc.log('UIManager ShowTip='+strTip);
        //UIManager.Instance.showtip(strTip);
    }
    private constructor(){
    }
    mapUIPanel: {[key: number]: UIPanel} = {};
    mapScendName: {[key: number]: string} = {};
    appRootNode: cc.Node;
    tipNode: cc.Node;
    onLoadEnd(err, res){
       for(let key in res.json){
           let nKey = parseInt(key);
           cc.log(key)
           this.mapScendName[nKey] = res.json[key];
       }
       cc.log('loadresendforfend')
       for(let key in this.mapScendName){
           cc.log('www'+key+ this.mapScendName[key])
       }
    }
    Init(appRootNode: cc.Node){
         this.appRootNode = appRootNode;

         this.createTipNode();
    }
    loadPanel()
    {
    }
    GetPanel(nPanelId: number)
    {
        return this.mapUIPanel[nPanelId];
    }
    OpenPanel(nPanelId: number, strParam?: string)
    {
        let uiPanelTab = ResManager.Instance.mapUIPanelTab[nPanelId];
        if(uiPanelTab == null)
        {
            cc.error('UI panel config not found for id=' + nPanelId);
            return;
        }
        if(uiPanelTab.nRemove === 1)
        {
            this.appRootNode.removeAllChildren();
        }
        let panel = this.mapUIPanel[nPanelId]
        if(panel != null)
        {
            if(panel.node.parent === null)
            {
                this.appRootNode.addChild(panel.node);
            }
            panel.OnOpen( strParam);
            return;
        }
        function  onLoadPrefabEnd(err, prefab)
        {
            let prefabNode: cc.Node = cc.instantiate(prefab);
            prefabNode.addComponent(cc.BlockInputEvents);
            let panel = prefabNode.addComponent(uiPanelTab.strName);
            this.appRootNode.addChild(panel.node);
            (panel as any).OnOpen( strParam);
            this.mapUIPanel[nPanelId] = panel;

            assetManager.releaseAsset(prefab)
        }
//        //cc.loader.loadRes( uiPanelTab.strPrefabName, onLoadPrefabEnd.bind(this));
//        //static loadRes(url: string, completeCallback: (error: Error, resource: any) => void): void;
        resources.load( uiPanelTab.strPrefabName, onLoadPrefabEnd.bind(this));
    }
    closePanel(nPanelId: number)
    {
        
        let panel = this.mapUIPanel[nPanelId]
        if(panel === null)
        {
            return;
        }
        panel.node.removeFromParent();
        panel.OnClose();
    }
    loadScene(nType:ESceneType)
    {
        let strName = this.mapScendName[nType]
        if(strName === null)
        {
            return;
        }
        director.loadScene(strName,this.onLoadSceneEnd.bind(this));
    }
    onLoadSceneEnd(){




    }
    createTipNode()
    {
        if(this.tipNode != null)
        {
            return;
        }
        function  onLoadPrefabEnd(err, prefab)
        {
            this.tipNode = instantiate(prefab);
//            //this.tipNode.retain();
//            //this.appRootNode.addChild(this.tipNode);
//            //cc.Prefab
//            //cc.loader.releaseAsset(prefab)
            assetManager.releaseAsset(prefab)
        }
//        //cc.loader.loadRes( "prefab/TipNode", onLoadPrefabEnd.bind(this));
        resources.load( "prefab/tippanel", onLoadPrefabEnd.bind(this));
    }           
    showtip(strTip: string)
    {
        log('showtip='+strTip);

        let newTipNode = instantiate(this.tipNode);
        this.appRootNode.addChild(newTipNode);
        newTipNode.y = Math.random() * (500 - (-500)) + (-500);
        newTipNode.setSiblingIndex(1000);
        let tippanel = newTipNode.addComponent("TipPanel");
        (tippanel as any).showTip(strTip);

    }
  
}
