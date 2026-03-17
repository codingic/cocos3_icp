import {
    _decorator,
    Color,
    Graphics,
    HorizontalTextAlignment,
    instantiate,
    Label,
    Node,
    ScrollView,
    UITransform,
    Vec3,
    VerticalTextAlignment,
    view,
} from 'cc';

import UIPanel from "../UIPanel";
import UIManager from "../../mg/UIManager";
import { EUIPanelType } from "../../CommonEnum";

const { ccclass } = _decorator;

const STAGE_WIDTH = 1440;
const STAGE_HEIGHT = 900;
const HEADER_WIDTH = 1360;
const HEADER_HEIGHT = 96;
const BODY_WIDTH = 1360;
const BODY_HEIGHT = 720;
const HERO_WIDTH = 1280;
const HERO_HEIGHT = 260;
const SCROLL_WIDTH = 1280;
const SCROLL_HEIGHT = 336;
const CARD_WIDTH = 1280;
const CARD_HEIGHT = 148;
const CARD_GAP = 16;

type PanelLanguage = "zh" | "en";

type WalletAsset = {
    symbol: string;
    categoryZh: string;
    categoryEn: string;
    address: string;
    precision: string;
    balanceZh: string;
    balanceEn: string;
    helperZh?: string;
    helperEn?: string;
    highlight?: boolean;
};

type WalletAccount = {
    name: string;
    address: string;
    nativeSymbol: string;
    balanceZh: string;
    balanceEn: string;
    helperZh: string;
    helperEn: string;
    assets: WalletAsset[];
};

@ccclass('MultiWalletPanel')
export default class MultiWalletPanel extends UIPanel {
    private readonly networks = ["Sepolia", "Mainnet", "Base Sepolia"];
    private readonly extraAssetTemplates = ["DAI", "ARB", "OP", "LINK", "UNI", "WBTC"];

    private language: PanelLanguage = "zh";
    private networkIndex = 0;
    private accountIndex = 0;
    private accounts: WalletAccount[] = [];

    private stageNode: Node | null = null;
    private assetScroll: ScrollView | null = null;
    private assetViewNode: Node | null = null;
    private assetContentNode: Node | null = null;
    private assetTemplateNode: Node | null = null;
    private hasBoundEvents = false;

    onLoad() {
        if (this.accounts.length === 0) {
            this.accounts = this.createInitialAccounts();
        }

        this.cacheNodes();
        this.bindEvents();
        this.render();
    }

    OnOpen() {
        this.render();
    }

    private cacheNodes() {
        this.stageNode = this.findNode("stage");
        this.assetScroll = this.findNode("stage/body/assetScroll").getComponent(ScrollView);
        this.assetViewNode = this.findNode("stage/body/assetScroll/view");
        this.assetContentNode = this.findNode("stage/body/assetScroll/view/content");
        this.assetTemplateNode = this.findNode("stage/templates/assetCardTemplate");
    }

    private bindEvents() {
        if (this.hasBoundEvents) {
            return;
        }

        this.findNode("stage/header/controlsGroup/btnAccount").on(Node.EventType.TOUCH_END, this.nextAccount, this);
        this.findNode("stage/header/controlsGroup/btnAddAccount").on(Node.EventType.TOUCH_END, this.addAccount, this);
        this.findNode("stage/header/controlsGroup/langWrap/btnZh").on(Node.EventType.TOUCH_END, () => this.setLanguage("zh"), this);
        this.findNode("stage/header/controlsGroup/langWrap/btnEn").on(Node.EventType.TOUCH_END, () => this.setLanguage("en"), this);
        this.findNode("stage/header/controlsGroup/btnNetwork").on(Node.EventType.TOUCH_END, this.nextNetwork, this);
        this.findNode("stage/header/backArea/btnBack").on(Node.EventType.TOUCH_END, this.goBack, this);
        this.findNode("stage/body/assetsHeader/btnAddAsset").on(Node.EventType.TOUCH_END, this.addAsset, this);

        this.hasBoundEvents = true;
    }

    private render() {
        this.applyRootLayout();
        this.applyStaticBackgrounds();
        this.applyTextStyles();
        this.applyControlStyles();
        this.renderContent();
    }

    private applyRootLayout() {
        const visibleSize = view.getVisibleSize();
        const rootTransform = this.ensureTransform(this.node);
        rootTransform.setContentSize(visibleSize.width, visibleSize.height);
        rootTransform.anchorPoint.set(0.5, 0.5);

        if (!this.stageNode) {
            return;
        }

        const stageTransform = this.ensureTransform(this.stageNode);
        stageTransform.setContentSize(STAGE_WIDTH, STAGE_HEIGHT);
        this.stageNode.setPosition(new Vec3(0, 0, 0));

        const scale = Math.min(
            (visibleSize.width - 24) / STAGE_WIDTH,
            (visibleSize.height - 24) / STAGE_HEIGHT,
            1
        );
        this.stageNode.setScale(new Vec3(scale, scale, 1));
    }

    private applyStaticBackgrounds() {
        this.paintNode("stage/bgFill", STAGE_WIDTH, STAGE_HEIGHT, this.rgba(4, 12, 20, 255), null, 0, 0);
        this.paintNode("stage/bgGlowLeft", 440, STAGE_HEIGHT + 40, this.rgba(28, 179, 141, 26), null, 0, 0);
        this.paintNode("stage/bgGlowRight", 600, STAGE_HEIGHT + 20, this.rgba(56, 124, 249, 22), null, 0, 0);
        this.paintNode("stage/topLine", STAGE_WIDTH, 4, this.rgba(43, 219, 177, 86), null, 2, 0);

        this.paintNode("stage/header/bg", HEADER_WIDTH, HEADER_HEIGHT, this.rgba(9, 19, 29, 214), this.rgba(48, 82, 108, 154), 24, 2);
        this.paintNode("stage/titleGroup/chipLocal", 156, 28, this.rgba(13, 55, 58, 220), this.rgba(52, 217, 191, 170), 14, 2);
        this.paintNode("stage/titleGroup/chipStack", 176, 28, this.rgba(11, 23, 37, 220), this.rgba(50, 78, 103, 188), 14, 2);

        this.paintNode("stage/header/controlsGroup/btnAccount", 224, 54, this.rgba(10, 22, 36, 245), this.rgba(54, 83, 109, 188), 18, 2);
        this.paintNode("stage/header/controlsGroup/btnAddAccount", 136, 54, this.rgba(10, 22, 36, 245), this.rgba(54, 83, 109, 188), 18, 2);
        this.paintNode("stage/header/controlsGroup/langWrap/bg", 134, 54, this.rgba(10, 22, 36, 245), this.rgba(54, 83, 109, 188), 18, 2);
        this.paintNode("stage/header/controlsGroup/btnNetwork", 232, 54, this.rgba(12, 24, 38, 255), this.rgba(47, 209, 188, 220), 18, 2);
        this.paintNode("stage/header/backArea/btnBack", 116, 44, this.rgba(15, 25, 40, 240), this.rgba(54, 83, 109, 188), 16, 2);

        this.paintNode("stage/body/bg", BODY_WIDTH, BODY_HEIGHT, this.rgba(8, 19, 31, 238), this.rgba(44, 76, 103, 168), 30, 2);
        this.paintNode("stage/body/glowLeft", 320, BODY_HEIGHT, this.rgba(34, 187, 145, 18), null, 30, 0);
        this.paintNode("stage/body/glowRight", 400, BODY_HEIGHT, this.rgba(54, 137, 255, 16), null, 30, 0);
        this.paintNode("stage/body/heroCard/bg", HERO_WIDTH, HERO_HEIGHT, this.rgba(11, 25, 40, 226), this.rgba(44, 85, 118, 175), 24, 2);
        this.paintNode("stage/body/heroCard/chipMainAsset", 92, 32, this.rgba(13, 54, 57, 220), this.rgba(52, 217, 191, 176), 16, 2);
        this.paintNode("stage/body/heroCard/addressBox/bg", HERO_WIDTH - 48, 60, this.rgba(4, 12, 20, 255), this.rgba(38, 67, 92, 180), 18, 2);
        this.paintNode("stage/body/heroCard/divider", HERO_WIDTH - 36, 2, this.rgba(58, 90, 116, 110), null, 1, 0);

        this.paintNode("stage/body/assetsHeader/btnAddAsset", 126, 44, this.rgba(10, 22, 36, 245), this.rgba(54, 83, 109, 188), 16, 2);
        this.paintNode("stage/body/assetsHeader/chipItemCount", 72, 32, this.rgba(11, 23, 37, 220), this.rgba(50, 78, 103, 188), 14, 2);
        this.paintNode("stage/body/assetScroll/view", SCROLL_WIDTH, SCROLL_HEIGHT, this.rgba(0, 0, 0, 0), null, 24, 0);
    }

    private applyControlStyles() {
        const zhSelected = this.language === "zh";
        const enSelected = this.language === "en";

        this.paintNode(
            "stage/header/controlsGroup/langWrap/btnZh",
            60,
            42,
            zhSelected ? this.rgba(27, 109, 97, 255) : this.rgba(0, 0, 0, 0),
            zhSelected ? this.rgba(54, 219, 194, 180) : null,
            14,
            zhSelected ? 2 : 0
        );
        this.paintNode(
            "stage/header/controlsGroup/langWrap/btnEn",
            48,
            42,
            enSelected ? this.rgba(27, 109, 97, 255) : this.rgba(0, 0, 0, 0),
            enSelected ? this.rgba(54, 219, 194, 180) : null,
            14,
            enSelected ? 2 : 0
        );
    }

    private applyTextStyles() {
        this.styleLabel("stage/titleGroup/labelPlane", 18, this.rgba(171, 188, 205, 255), HorizontalTextAlignment.LEFT);
        this.styleLabel("stage/titleGroup/labelTitle", 32, this.rgba(241, 247, 252, 255), HorizontalTextAlignment.LEFT);
        this.styleLabel("stage/titleGroup/labelSubtitle", 15, this.rgba(124, 150, 174, 255), HorizontalTextAlignment.LEFT);
        this.styleLabel("stage/titleGroup/chipLocal/labelValue", 15, this.rgba(109, 247, 229, 255), HorizontalTextAlignment.CENTER);
        this.styleLabel("stage/titleGroup/chipStack/labelValue", 15, this.rgba(178, 194, 208, 255), HorizontalTextAlignment.CENTER);

        this.styleLabel("stage/header/controlsGroup/btnAccount/labelPrefix", 16, this.rgba(136, 157, 176, 255), HorizontalTextAlignment.LEFT);
        this.styleLabel("stage/header/controlsGroup/btnAccount/labelValue", 18, this.rgba(240, 246, 251, 255), HorizontalTextAlignment.LEFT);
        this.styleLabel("stage/header/controlsGroup/btnAccount/labelArrow", 16, this.rgba(162, 184, 202, 255), HorizontalTextAlignment.CENTER);
        this.styleLabel("stage/header/controlsGroup/btnAddAccount/labelValue", 19, this.rgba(240, 246, 251, 255), HorizontalTextAlignment.CENTER);
        this.styleLabel("stage/header/controlsGroup/langWrap/btnZh/labelValue", 18, this.language === "zh" ? this.rgba(240, 250, 251, 255) : this.rgba(154, 175, 192, 255), HorizontalTextAlignment.CENTER);
        this.styleLabel("stage/header/controlsGroup/langWrap/btnEn/labelValue", 18, this.language === "en" ? this.rgba(240, 250, 251, 255) : this.rgba(154, 175, 192, 255), HorizontalTextAlignment.CENTER);
        this.styleLabel("stage/header/controlsGroup/btnNetwork/labelPrefix", 16, this.rgba(136, 157, 176, 255), HorizontalTextAlignment.LEFT);
        this.styleLabel("stage/header/controlsGroup/btnNetwork/labelValue", 18, this.rgba(240, 246, 251, 255), HorizontalTextAlignment.LEFT);
        this.styleLabel("stage/header/controlsGroup/btnNetwork/labelArrow", 16, this.rgba(162, 184, 202, 255), HorizontalTextAlignment.CENTER);
        this.styleLabel("stage/header/backArea/btnBack/labelValue", 19, this.rgba(240, 246, 251, 255), HorizontalTextAlignment.CENTER);

        this.styleLabel("stage/body/heroCard/labelNativeTitle", 17, this.rgba(150, 171, 190, 255), HorizontalTextAlignment.LEFT);
        this.styleLabel("stage/body/heroCard/labelNativeSymbol", 44, this.rgba(246, 251, 255, 255), HorizontalTextAlignment.LEFT, 52);
        this.styleLabel("stage/body/heroCard/chipMainAsset/labelValue", 16, this.rgba(109, 247, 229, 255), HorizontalTextAlignment.CENTER);
        this.styleLabel("stage/body/heroCard/labelAddressTitle", 20, this.rgba(139, 161, 180, 255), HorizontalTextAlignment.LEFT);
        this.styleLabel("stage/body/heroCard/addressBox/labelAddressValue", 24, this.rgba(234, 242, 248, 255), HorizontalTextAlignment.LEFT, 30);
        this.styleLabel("stage/body/heroCard/labelBalanceTitle", 20, this.rgba(139, 161, 180, 255), HorizontalTextAlignment.LEFT);
        this.styleLabel("stage/body/heroCard/labelBalanceValue", 42, this.rgba(245, 250, 255, 255), HorizontalTextAlignment.LEFT, 50);
        this.styleLabel("stage/body/heroCard/labelHelper", 21, this.rgba(168, 185, 202, 255), HorizontalTextAlignment.LEFT, 30, true);

        this.styleLabel("stage/body/assetsHeader/labelAssetsTitle", 20, this.rgba(150, 171, 190, 255), HorizontalTextAlignment.LEFT);
        this.styleLabel("stage/body/assetsHeader/btnAddAsset/labelValue", 18, this.rgba(240, 246, 251, 255), HorizontalTextAlignment.CENTER);
        this.styleLabel("stage/body/assetsHeader/chipItemCount/labelValue", 16, this.rgba(178, 194, 208, 255), HorizontalTextAlignment.CENTER);
    }

    private renderContent() {
        const account = this.getCurrentAccount();

        this.setLabelText("stage/titleGroup/labelTitle", this.language === "zh" ? "多账户钱包" : "Multi Account Wallet");
        this.setLabelText("stage/titleGroup/labelSubtitle", "Signer / II / EVM Assets");
        this.setLabelText("stage/titleGroup/chipLocal/labelValue", this.language === "zh" ? "本地 / 多账户" : "Local / Multi Wallet");
        this.setLabelText("stage/titleGroup/chipStack/labelValue", "EVM / SIGNER / II");

        this.setLabelText("stage/header/controlsGroup/btnAccount/labelPrefix", this.t("account"));
        this.setLabelText("stage/header/controlsGroup/btnAccount/labelValue", this.accountLabel());
        this.setLabelText("stage/header/controlsGroup/btnAddAccount/labelValue", this.t("addAccount"));
        this.setLabelText("stage/header/controlsGroup/btnNetwork/labelPrefix", this.t("network"));
        this.setLabelText("stage/header/controlsGroup/btnNetwork/labelValue", this.networks[this.networkIndex]);
        this.setLabelText("stage/header/backArea/btnBack/labelValue", this.t("back"));

        this.setLabelText("stage/body/heroCard/labelNativeTitle", this.t("nativeAsset"));
        this.setLabelText("stage/body/heroCard/labelNativeSymbol", account.nativeSymbol);
        this.setLabelText("stage/body/heroCard/chipMainAsset/labelValue", this.t("mainAsset"));
        this.setLabelText("stage/body/heroCard/labelAddressTitle", this.t("address"));
        this.setLabelText("stage/body/heroCard/addressBox/labelAddressValue", account.address);
        this.setLabelText("stage/body/heroCard/labelBalanceTitle", this.t("balance"));
        this.setLabelText("stage/body/heroCard/labelBalanceValue", this.language === "zh" ? account.balanceZh : account.balanceEn);
        this.setLabelText("stage/body/heroCard/labelHelper", this.language === "zh" ? account.helperZh : account.helperEn);

        this.setLabelText("stage/body/assetsHeader/labelAssetsTitle", this.t("assetList"));
        this.setLabelText("stage/body/assetsHeader/btnAddAsset/labelValue", this.t("addAsset"));
        this.setLabelText("stage/body/assetsHeader/chipItemCount/labelValue", `${account.assets.length}${this.t("itemSuffix")}`);

        this.renderAssets(account);
    }

    private renderAssets(account: WalletAccount) {
        if (!this.assetContentNode || !this.assetTemplateNode || !this.assetViewNode) {
            return;
        }

        this.assetContentNode.removeAllChildren();

        const viewHeight = this.ensureTransform(this.assetViewNode).height;
        const contentTransform = this.ensureTransform(this.assetContentNode);
        const totalHeight = Math.max(viewHeight, account.assets.length * CARD_HEIGHT + Math.max(0, account.assets.length - 1) * CARD_GAP + 8);
        contentTransform.setContentSize(CARD_WIDTH, totalHeight);
        this.assetContentNode.setPosition(new Vec3(0, viewHeight / 2 - 4, 0));

        account.assets.forEach((asset, index) => {
            const card = instantiate(this.assetTemplateNode as Node);
            card.active = true;
            card.name = `assetCard_${index}`;
            card.setPosition(new Vec3(0, -index * (CARD_HEIGHT + CARD_GAP), 0));
            this.assetContentNode?.addChild(card);

            this.paintNodeByRef(
                this.mustFindChild(card, "bg"),
                CARD_WIDTH,
                CARD_HEIGHT,
                asset.highlight ? this.rgba(15, 38, 47, 240) : this.rgba(7, 17, 28, 230),
                asset.highlight ? this.rgba(41, 215, 187, 196) : this.rgba(39, 69, 93, 175),
                22,
                asset.highlight ? 3 : 2
            );

            this.styleLabelByRef(this.mustFindLabel(card, "labelSymbol"), 34, this.rgba(243, 248, 252, 255), HorizontalTextAlignment.LEFT, 38);
            this.styleLabelByRef(this.mustFindLabel(card, "labelCategory"), 18, this.rgba(166, 184, 201, 255), HorizontalTextAlignment.RIGHT);
            this.styleLabelByRef(this.mustFindLabel(card, "labelAddress"), 18, this.rgba(211, 221, 231, 255), HorizontalTextAlignment.LEFT);
            this.styleLabelByRef(this.mustFindLabel(card, "labelPrecision"), 18, this.rgba(211, 221, 231, 255), HorizontalTextAlignment.LEFT);
            this.styleLabelByRef(this.mustFindLabel(card, "labelBalance"), 18, this.rgba(211, 221, 231, 255), HorizontalTextAlignment.LEFT);
            this.styleLabelByRef(this.mustFindLabel(card, "labelHelper"), 18, this.rgba(168, 185, 202, 255), HorizontalTextAlignment.LEFT);

            this.mustFindLabel(card, "labelSymbol").string = asset.symbol;
            this.mustFindLabel(card, "labelCategory").string = this.language === "zh" ? asset.categoryZh : asset.categoryEn;
            this.mustFindLabel(card, "labelAddress").string = `${this.t("address")}: ${asset.address}`;
            this.mustFindLabel(card, "labelPrecision").string = `${this.t("precision")}: ${asset.precision}`;
            this.mustFindLabel(card, "labelBalance").string = `${this.t("balance")}: ${this.language === "zh" ? asset.balanceZh : asset.balanceEn}`;
            this.mustFindLabel(card, "labelHelper").string = this.language === "zh" ? (asset.helperZh ?? "") : (asset.helperEn ?? "");
        });

        if (this.assetScroll) {
            this.assetScroll.content = this.assetContentNode;
            this.scheduleOnce(() => {
                this.assetScroll?.scrollToTop(0.01);
            }, 0);
        }
    }

    private addAccount() {
        const nextIndex = this.accounts.length + 1;
        const symbol = nextIndex % 2 === 0 ? "ETH" : "ARB";
        const address = `0x${(100000 + nextIndex).toString(16).padEnd(40, nextIndex % 2 === 0 ? "b" : "c").slice(0, 40)}`;
        const balance = (1.25 + nextIndex * 0.37).toFixed(4);

        this.accounts.push({
            name: `账户 ${nextIndex}`,
            address,
            nativeSymbol: symbol,
            balanceZh: `${balance} ${symbol}`,
            balanceEn: `${balance} ${symbol}`,
            helperZh: "地址与余额为演示数据，可继续接入 signer / backend 查询。",
            helperEn: "This panel is using demo data for now. You can wire it to signer/backend next.",
            assets: [
                {
                    symbol,
                    categoryZh: "主币 / 原生资产",
                    categoryEn: "Native Asset",
                    address,
                    precision: "18",
                    balanceZh: `${balance} ${symbol}`,
                    balanceEn: `${balance} ${symbol}`,
                    highlight: true,
                },
                {
                    symbol: "USDC",
                    categoryZh: "稳定币",
                    categoryEn: "Stablecoin",
                    address: `0x${(200000 + nextIndex).toString(16).padEnd(40, "d").slice(0, 40)}`,
                    precision: "6",
                    balanceZh: `${(32 + nextIndex * 7).toFixed(2)} USDC`,
                    balanceEn: `${(32 + nextIndex * 7).toFixed(2)} USDC`,
                },
            ],
        });

        this.accountIndex = this.accounts.length - 1;
        this.render();
    }

    private addAsset() {
        const account = this.getCurrentAccount();
        const templateIndex = account.assets.length % this.extraAssetTemplates.length;
        const symbol = this.extraAssetTemplates[templateIndex];
        const address = `0x${(300000 + account.assets.length).toString(16).padEnd(40, "e").slice(0, 40)}`;

        account.assets.push({
            symbol,
            categoryZh: "扩展资产",
            categoryEn: "Imported Asset",
            address,
            precision: symbol === "WBTC" ? "8" : "18",
            balanceZh: "未查询",
            balanceEn: "Not Queried",
            helperZh: "演示卡片，可替换为真实合约与余额查询。",
            helperEn: "Demo card. Replace this with real contract and balance queries.",
        });

        this.render();
    }

    private nextAccount() {
        this.accountIndex = (this.accountIndex + 1) % this.accounts.length;
        this.render();
    }

    private nextNetwork() {
        this.networkIndex = (this.networkIndex + 1) % this.networks.length;
        this.render();
    }

    private setLanguage(language: PanelLanguage) {
        if (this.language === language) {
            return;
        }
        this.language = language;
        this.render();
    }

    private goBack() {
        UIManager.OpenPanel(EUIPanelType.HOMELIST);
    }

    private getCurrentAccount() {
        return this.accounts[this.accountIndex] ?? this.accounts[0];
    }

    private accountLabel() {
        const index = this.accountIndex + 1;
        return this.language === "zh" ? `账户 ${index}` : `Account ${index}`;
    }

    private createInitialAccounts(): WalletAccount[] {
        return [
            {
                name: "账户 1",
                address: "--",
                nativeSymbol: "ETH",
                balanceZh: "查询失败",
                balanceEn: "Query Failed",
                helperZh: "请先通过 Internet Identity 登录，再向 signer 请求地址",
                helperEn: "Sign in with Internet Identity before requesting an address from the signer.",
                assets: [
                    {
                        symbol: "ETH",
                        categoryZh: "主币 / 原生资产",
                        categoryEn: "Native Asset",
                        address: "--",
                        precision: "--",
                        balanceZh: "查询失败",
                        balanceEn: "Query Failed",
                        helperZh: "请先通过 Internet Identity 登录，再向 signer 请求地址",
                        helperEn: "Sign in with Internet Identity before requesting an address from the signer.",
                        highlight: true,
                    },
                    {
                        symbol: "USDC",
                        categoryZh: "稳定币",
                        categoryEn: "Stablecoin",
                        address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
                        precision: "6",
                        balanceZh: "未查询",
                        balanceEn: "Not Queried",
                    },
                ],
            },
        ];
    }

    private styleLabel(path: string, fontSize: number, color: Color, align: HorizontalTextAlignment, lineHeight = fontSize + 8, wrap = false) {
        this.styleLabelByRef(this.findNode(path).getComponent(Label), fontSize, color, align, lineHeight, wrap);
    }

    private styleLabelByRef(label: Label | null, fontSize: number, color: Color, align: HorizontalTextAlignment, lineHeight = fontSize + 8, wrap = false) {
        if (!label) {
            return;
        }
        label.fontSize = fontSize;
        label.lineHeight = lineHeight;
        label.color = color;
        label.horizontalAlign = align;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.enableWrapText = wrap;
        label.overflow = wrap ? Label.Overflow.RESIZE_HEIGHT : Label.Overflow.SHRINK;
    }

    private setLabelText(path: string, value: string) {
        const label = this.findNode(path).getComponent(Label);
        if (label) {
            label.string = value;
        }
    }

    private paintNode(path: string, width: number, height: number, fillColor: Color, strokeColor: Color | null, radius: number, lineWidth: number) {
        this.paintNodeByRef(this.findNode(path), width, height, fillColor, strokeColor, radius, lineWidth);
    }

    private paintNodeByRef(node: Node, width: number, height: number, fillColor: Color, strokeColor: Color | null, radius: number, lineWidth: number) {
        const transform = this.ensureTransform(node);
        transform.setContentSize(width, height);
        const graphics = this.ensureGraphics(node);

        graphics.clear();
        graphics.fillColor = fillColor;

        const left = -width / 2;
        const bottom = -height / 2;
        const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));

        if (safeRadius > 0) {
            graphics.roundRect(left, bottom, width, height, safeRadius);
        } else {
            graphics.rect(left, bottom, width, height);
        }
        graphics.fill();

        if (strokeColor && lineWidth > 0) {
            graphics.lineWidth = lineWidth;
            graphics.strokeColor = strokeColor;
            if (safeRadius > 0) {
                graphics.roundRect(left + lineWidth / 2, bottom + lineWidth / 2, width - lineWidth, height - lineWidth, safeRadius);
            } else {
                graphics.rect(left + lineWidth / 2, bottom + lineWidth / 2, width - lineWidth, height - lineWidth);
            }
            graphics.stroke();
        }
    }

    private ensureGraphics(node: Node) {
        let graphics = node.getComponent(Graphics);
        if (!graphics) {
            graphics = node.addComponent(Graphics);
        }
        return graphics;
    }

    private ensureTransform(node: Node) {
        let transform = node.getComponent(UITransform);
        if (!transform) {
            transform = node.addComponent(UITransform);
        }
        return transform;
    }

    private findNode(path: string, start: Node | null = this.node) {
        const segments = path.split('/').filter(Boolean);
        let current = start;
        for (const segment of segments) {
            current = current?.getChildByName(segment) ?? null;
            if (!current) {
                throw new Error(`MultiWalletPanel node not found: ${path}`);
            }
        }
        return current;
    }

    private mustFindChild(parent: Node, name: string) {
        const child = parent.getChildByName(name);
        if (!child) {
            throw new Error(`MultiWalletPanel child node not found: ${name}`);
        }
        return child;
    }

    private mustFindLabel(parent: Node, name: string) {
        const label = this.mustFindChild(parent, name).getComponent(Label);
        if (!label) {
            throw new Error(`MultiWalletPanel label not found: ${name}`);
        }
        return label;
    }

    private rgba(r: number, g: number, b: number, a: number) {
        return new Color(r, g, b, a);
    }

    private t(key: string) {
        const zh: Record<string, string> = {
            addAccount: "添加账户",
            account: "账户",
            addAsset: "添加资产",
            address: "地址",
            assetList: "资产列表",
            back: "返回",
            balance: "余额",
            itemSuffix: "项",
            mainAsset: "主资产",
            nativeAsset: "NATIVE ASSET",
            network: "网络",
            precision: "精度",
        };

        const en: Record<string, string> = {
            addAccount: "Add Account",
            account: "Account",
            addAsset: "Add Asset",
            address: "Address",
            assetList: "Assets",
            back: "Back",
            balance: "Balance",
            itemSuffix: " items",
            mainAsset: "Main Asset",
            nativeAsset: "NATIVE ASSET",
            network: "Network",
            precision: "Precision",
        };

        return (this.language === "zh" ? zh : en)[key] ?? key;
    }
}
