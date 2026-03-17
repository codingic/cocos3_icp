import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const STAGE_WIDTH = 1440;
const STAGE_HEIGHT = 900;
const HEADER_WIDTH = 1360;
const HEADER_HEIGHT = 96;
const BODY_WIDTH = 1360;
const BODY_HEIGHT = 720;
const HERO_WIDTH = 1280;
const HERO_HEIGHT = 260;
const ASSET_SCROLL_WIDTH = 1280;
const ASSET_SCROLL_HEIGHT = 336;
const ASSET_CARD_WIDTH = 1280;
const ASSET_CARD_HEIGHT = 148;

class Builder {
  constructor(prefabName) {
    this.prefabName = prefabName;
    this.objects = [];
    this.fileId = 0;
    this.prefabId = this.add({
      __type__: "cc.Prefab",
      _name: prefabName,
      _objFlags: 0,
      __editorExtras__: {},
      _native: "",
      data: { __id__: 1 },
      optimizationPolicy: 0,
      persistent: false,
    });
    this.rootNodeId = null;
  }

  add(obj) {
    const id = this.objects.length;
    this.objects.push(obj);
    return id;
  }

  ref(id) {
    return { __id__: id };
  }

  nextFileId(prefix = "f") {
    this.fileId += 1;
    return `${prefix}${this.fileId.toString(36)}`;
  }

  vec2(x, y) {
    return { __type__: "cc.Vec2", x, y };
  }

  vec3(x, y, z = 0) {
    return { __type__: "cc.Vec3", x, y, z };
  }

  quat() {
    return { __type__: "cc.Quat", x: 0, y: 0, z: 0, w: 1 };
  }

  size(width, height) {
    return { __type__: "cc.Size", width, height };
  }

  color(r, g, b, a = 255) {
    return { __type__: "cc.Color", r, g, b, a };
  }

  addNode({ name, parent = null, active = true, pos = [0, 0, 0], scale = [1, 1, 1] }) {
    const nodeId = this.add({
      __type__: "cc.Node",
      _name: name,
      _objFlags: 0,
      __editorExtras__: {},
      _parent: parent == null ? null : this.ref(parent),
      _children: [],
      _active: active,
      _components: [],
      _prefab: null,
      _lpos: this.vec3(pos[0], pos[1], pos[2] ?? 0),
      _lrot: this.quat(),
      _lscale: this.vec3(scale[0], scale[1], scale[2] ?? 1),
      _mobility: 0,
      _layer: 1,
      _euler: this.vec3(0, 0, 0),
      _id: "",
    });

    if (parent != null) {
      this.objects[parent]._children.push(this.ref(nodeId));
    }

    const prefabInfoId = this.add({
      __type__: "cc.PrefabInfo",
      root: null,
      asset: this.ref(this.prefabId),
      fileId: this.nextFileId("node"),
      instance: null,
      targetOverrides: null,
      nestedPrefabInstanceRoots: null,
    });
    this.objects[nodeId]._prefab = this.ref(prefabInfoId);

    if (this.rootNodeId == null) {
      this.rootNodeId = nodeId;
      this.objects[this.prefabId].data = this.ref(nodeId);
    }

    return nodeId;
  }

  finalizePrefabInfos() {
    for (const obj of this.objects) {
      if (obj.__type__ === "cc.PrefabInfo") {
        obj.root = this.ref(this.rootNodeId);
      }
    }
  }

  addComponent(nodeId, component) {
    const compPrefabId = this.add({
      __type__: "cc.CompPrefabInfo",
      fileId: this.nextFileId("cmp"),
    });
    component.node = this.ref(nodeId);
    component.__prefab = this.ref(compPrefabId);
    if (component._id == null) {
      component._id = "";
    }
    const compId = this.add(component);
    this.objects[nodeId]._components.push(this.ref(compId));
    return compId;
  }

  addUIOpacity(nodeId, opacity = 255) {
    return this.addComponent(nodeId, {
      __type__: "cc.UIOpacity",
      _name: "",
      _objFlags: 0,
      __editorExtras__: {},
      _enabled: true,
      _opacity: opacity,
    });
  }

  addUITransform(nodeId, width, height, anchorX = 0.5, anchorY = 0.5) {
    return this.addComponent(nodeId, {
      __type__: "cc.UITransform",
      _name: "",
      _objFlags: 0,
      __editorExtras__: {},
      _enabled: true,
      _contentSize: this.size(width, height),
      _anchorPoint: this.vec2(anchorX, anchorY),
    });
  }

  addLabel(nodeId, text = "") {
    return this.addComponent(nodeId, {
      __type__: "cc.Label",
      _name: "",
      _objFlags: 0,
      __editorExtras__: {},
      _enabled: true,
      _customMaterial: {
        __uuid__: "fda095cb-831d-4601-ad94-846013963de8",
        __expectedType__: "cc.Material",
      },
      _srcBlendFactor: 1,
      _dstBlendFactor: 4,
      _color: this.color(255, 255, 255, 255),
      _string: text,
      _horizontalAlign: 0,
      _verticalAlign: 1,
      _actualFontSize: 20,
      _fontSize: 20,
      _fontFamily: "Arial",
      _lineHeight: 28,
      _overflow: 0,
      _enableWrapText: true,
      _font: null,
      _isSystemFontUsed: true,
      _spacingX: 0,
      _isItalic: false,
      _isBold: false,
      _isUnderline: false,
      _underlineHeight: 0,
      _cacheMode: 0,
      _enableOutline: false,
      _outlineColor: this.color(0, 0, 0, 255),
      _outlineWidth: 2,
      _enableShadow: false,
      _shadowColor: this.color(0, 0, 0, 255),
      _shadowOffset: this.vec2(2, 2),
      _shadowBlur: 2,
    });
  }

  addGraphics(nodeId) {
    return this.addComponent(nodeId, {
      __type__: "cc.Graphics",
      _name: "",
      _objFlags: 0,
      __editorExtras__: {},
      _enabled: true,
      _customMaterial: null,
      _srcBlendFactor: 2,
      _dstBlendFactor: 4,
      _color: this.color(255, 255, 255, 255),
      _lineWidth: 1,
      _strokeColor: this.color(0, 0, 0, 255),
      _lineJoin: 2,
      _lineCap: 0,
      _fillColor: this.color(255, 255, 255, 0),
      _miterLimit: 10,
    });
  }

  addMask(nodeId) {
    return this.addComponent(nodeId, {
      __type__: "cc.Mask",
      _name: "",
      _objFlags: 0,
      __editorExtras__: {},
      _enabled: true,
      _type: 0,
      _inverted: false,
      _segments: 64,
      _alphaThreshold: 0.1,
    });
  }

  addScrollView(nodeId, contentId) {
    return this.addComponent(nodeId, {
      __type__: "cc.ScrollView",
      _name: "",
      _objFlags: 0,
      __editorExtras__: {},
      _enabled: true,
      bounceDuration: 0.23,
      brake: 0.75,
      elastic: true,
      inertia: true,
      horizontal: false,
      vertical: true,
      cancelInnerEvents: true,
      scrollEvents: [],
      _content: this.ref(contentId),
      _horizontalScrollBar: null,
      _verticalScrollBar: null,
    });
  }

  write(filePath) {
    this.finalizePrefabInfos();
    writeFileSync(filePath, `${JSON.stringify(this.objects, null, 2)}\n`);
  }
}

function addPanelRect(builder, parent, name, width, height, x, y) {
  const node = builder.addNode({ name, parent, pos: [x, y, 0] });
  builder.addUIOpacity(node, 255);
  builder.addUITransform(node, width, height, 0.5, 0.5);
  builder.addGraphics(node);
  return node;
}

function addLabelNode(builder, parent, name, width, height, x, y, anchorX, anchorY, text = "") {
  const node = builder.addNode({ name, parent, pos: [x, y, 0] });
  builder.addUIOpacity(node, 255);
  builder.addUITransform(node, width, height, anchorX, anchorY);
  builder.addLabel(node, text);
  return node;
}

function buildButton(builder, parent, name, width, height, x, y, config = {}) {
  const button = addPanelRect(builder, parent, name, width, height, x, y);
  if (config.prefixWidth) {
    addLabelNode(builder, button, "labelPrefix", config.prefixWidth, 22, -width / 2 + 14, 0, 0, 0.5, config.prefixText ?? "");
  }
  const valueX = config.prefixWidth ? -width / 2 + config.prefixWidth + 22 : 0;
  const valueWidth = config.prefixWidth ? width - config.prefixWidth - 60 : width - 24;
  addLabelNode(builder, button, "labelValue", valueWidth, 28, valueX, 0, config.prefixWidth ? 0 : 0.5, 0.5, config.valueText ?? "");
  if (config.withArrow) {
    addLabelNode(builder, button, "labelArrow", 24, 24, width / 2 - 18, -1, 0.5, 0.5, "v");
  }
  return button;
}

function buildAssetTemplate(builder, parent) {
  const template = builder.addNode({ name: "assetCardTemplate", parent, active: false, pos: [0, 0, 0] });
  builder.addUIOpacity(template, 255);
  builder.addUITransform(template, ASSET_CARD_WIDTH, ASSET_CARD_HEIGHT, 0.5, 1);

  addPanelRect(builder, template, "bg", ASSET_CARD_WIDTH, ASSET_CARD_HEIGHT, 0, -ASSET_CARD_HEIGHT / 2);
  addLabelNode(builder, template, "labelSymbol", 240, 40, -ASSET_CARD_WIDTH / 2 + 18, -18, 0, 0.5, "ETH");
  addLabelNode(builder, template, "labelCategory", 260, 30, ASSET_CARD_WIDTH / 2 - 18, -18, 1, 0.5, "Main Asset");
  addLabelNode(builder, template, "labelAddress", 980, 26, -ASSET_CARD_WIDTH / 2 + 18, -52, 0, 0.5, "Address: --");
  addLabelNode(builder, template, "labelPrecision", 980, 26, -ASSET_CARD_WIDTH / 2 + 18, -82, 0, 0.5, "Precision: --");
  addLabelNode(builder, template, "labelBalance", 980, 26, -ASSET_CARD_WIDTH / 2 + 18, -112, 0, 0.5, "Balance: --");
  addLabelNode(builder, template, "labelHelper", 1120, 26, -ASSET_CARD_WIDTH / 2 + 18, -140, 0, 0.5, "");

  return template;
}

function buildPrefab() {
  const builder = new Builder("multiwalletpanel");

  const root = builder.addNode({ name: "multiwalletpanel" });
  builder.addUIOpacity(root, 255);
  builder.addUITransform(root, STAGE_WIDTH, STAGE_HEIGHT, 0.5, 0.5);

  const stage = builder.addNode({ name: "stage", parent: root, pos: [0, 0, 0] });
  builder.addUIOpacity(stage, 255);
  builder.addUITransform(stage, STAGE_WIDTH, STAGE_HEIGHT, 0.5, 0.5);

  addPanelRect(builder, stage, "bgFill", STAGE_WIDTH, STAGE_HEIGHT, 0, 0);
  addPanelRect(builder, stage, "bgGlowLeft", 440, STAGE_HEIGHT + 40, -520, 0);
  addPanelRect(builder, stage, "bgGlowRight", 600, STAGE_HEIGHT + 20, 520, -10);
  addPanelRect(builder, stage, "topLine", STAGE_WIDTH, 4, 0, STAGE_HEIGHT / 2 - 6);

  const header = builder.addNode({ name: "header", parent: stage, pos: [0, 344, 0] });
  builder.addUIOpacity(header, 255);
  builder.addUITransform(header, HEADER_WIDTH, HEADER_HEIGHT, 0.5, 0.5);
  addPanelRect(builder, header, "bg", HEADER_WIDTH, HEADER_HEIGHT, 0, 0);

  const titleGroup = builder.addNode({ name: "titleGroup", parent: header, pos: [-HEADER_WIDTH / 2 + 28, 0, 0] });
  builder.addUIOpacity(titleGroup, 255);
  builder.addUITransform(titleGroup, 420, HEADER_HEIGHT, 0, 0.5);
  addLabelNode(builder, titleGroup, "labelPlane", 160, 24, 0, 28, 0, 0.5, "PLANE");
  addLabelNode(builder, titleGroup, "labelTitle", 340, 42, 0, 2, 0, 0.5, "多账户钱包");
  addLabelNode(builder, titleGroup, "labelSubtitle", 360, 24, 0, -28, 0, 0.5, "Signer / II / EVM Assets");
  buildButton(builder, titleGroup, "chipLocal", 156, 28, 76, -48, { valueText: "本地 / 多账户" });
  buildButton(builder, titleGroup, "chipStack", 176, 28, 248, -48, { valueText: "EVM / SIGNER / II" });

  const controls = builder.addNode({ name: "controlsGroup", parent: header, pos: [336, 0, 0] });
  builder.addUIOpacity(controls, 255);
  builder.addUITransform(controls, 640, 72, 0.5, 0.5);
  buildButton(builder, controls, "btnAccount", 224, 54, -212, 0, { prefixWidth: 52, prefixText: "账户", valueText: "账户 1", withArrow: true });
  buildButton(builder, controls, "btnAddAccount", 136, 54, -18, 0, { valueText: "添加账户" });

  const langWrap = builder.addNode({ name: "langWrap", parent: controls, pos: [150, 0, 0] });
  builder.addUIOpacity(langWrap, 255);
  builder.addUITransform(langWrap, 134, 54, 0.5, 0.5);
  addPanelRect(builder, langWrap, "bg", 134, 54, 0, 0);
  buildButton(builder, langWrap, "btnZh", 60, 42, -32, 0, { valueText: "中文" });
  buildButton(builder, langWrap, "btnEn", 48, 42, 34, 0, { valueText: "EN" });

  buildButton(builder, controls, "btnNetwork", 232, 54, 382, 0, { prefixWidth: 60, prefixText: "网络", valueText: "Sepolia", withArrow: true });

  const backArea = builder.addNode({ name: "backArea", parent: header, pos: [HEADER_WIDTH / 2 - 76, -6, 0] });
  builder.addUIOpacity(backArea, 255);
  builder.addUITransform(backArea, 116, 44, 0.5, 0.5);
  buildButton(builder, backArea, "btnBack", 116, 44, 0, 0, { valueText: "返回" });

  const body = builder.addNode({ name: "body", parent: stage, pos: [0, -26, 0] });
  builder.addUIOpacity(body, 255);
  builder.addUITransform(body, BODY_WIDTH, BODY_HEIGHT, 0.5, 0.5);
  addPanelRect(builder, body, "bg", BODY_WIDTH, BODY_HEIGHT, 0, 0);
  addPanelRect(builder, body, "glowLeft", 320, BODY_HEIGHT, -BODY_WIDTH / 2 + 150, 0);
  addPanelRect(builder, body, "glowRight", 400, BODY_HEIGHT, BODY_WIDTH / 2 - 180, 0);

  const hero = builder.addNode({ name: "heroCard", parent: body, pos: [0, 176, 0] });
  builder.addUIOpacity(hero, 255);
  builder.addUITransform(hero, HERO_WIDTH, HERO_HEIGHT, 0.5, 0.5);
  addPanelRect(builder, hero, "bg", HERO_WIDTH, HERO_HEIGHT, 0, 0);
  addLabelNode(builder, hero, "labelNativeTitle", 220, 24, -HERO_WIDTH / 2 + 26, HERO_HEIGHT / 2 - 30, 0, 0.5, "NATIVE ASSET");
  addLabelNode(builder, hero, "labelNativeSymbol", 220, 52, -HERO_WIDTH / 2 + 26, HERO_HEIGHT / 2 - 68, 0, 0.5, "ETH");
  buildButton(builder, hero, "chipMainAsset", 92, 32, HERO_WIDTH / 2 - 66, HERO_HEIGHT / 2 - 32, { valueText: "主资产" });
  addLabelNode(builder, hero, "labelAddressTitle", 200, 26, -HERO_WIDTH / 2 + 26, 18, 0, 0.5, "地址");
  const addressBox = builder.addNode({ name: "addressBox", parent: hero, pos: [0, -22, 0] });
  builder.addUIOpacity(addressBox, 255);
  builder.addUITransform(addressBox, HERO_WIDTH - 48, 60, 0.5, 0.5);
  addPanelRect(builder, addressBox, "bg", HERO_WIDTH - 48, 60, 0, 0);
  addLabelNode(builder, addressBox, "labelAddressValue", HERO_WIDTH - 96, 30, -HERO_WIDTH / 2 + 64, 0, 0, 0.5, "--");
  addLabelNode(builder, hero, "labelBalanceTitle", 200, 26, -HERO_WIDTH / 2 + 26, -78, 0, 0.5, "余额");
  addLabelNode(builder, hero, "labelBalanceValue", 420, 52, -HERO_WIDTH / 2 + 26, -118, 0, 0.5, "查询失败");
  addLabelNode(builder, hero, "labelHelper", HERO_WIDTH - 80, 32, -HERO_WIDTH / 2 + 26, -166, 0, 0.5, "请先通过 Internet Identity 登录，再向 signer 请求地址");
  addPanelRect(builder, hero, "divider", HERO_WIDTH - 36, 2, 0, -HERO_HEIGHT / 2 + 24);

  const assetsHeader = builder.addNode({ name: "assetsHeader", parent: body, pos: [0, 8, 0] });
  builder.addUIOpacity(assetsHeader, 255);
  builder.addUITransform(assetsHeader, HERO_WIDTH, 60, 0.5, 0.5);
  addLabelNode(builder, assetsHeader, "labelAssetsTitle", 200, 28, -HERO_WIDTH / 2 + 2, 0, 0, 0.5, "资产列表");
  buildButton(builder, assetsHeader, "btnAddAsset", 126, 44, -HERO_WIDTH / 2 + 144, 0, { valueText: "添加资产" });
  buildButton(builder, assetsHeader, "chipItemCount", 72, 32, HERO_WIDTH / 2 - 48, 0, { valueText: "2项" });

  const assetScroll = builder.addNode({ name: "assetScroll", parent: body, pos: [0, -196, 0] });
  builder.addUIOpacity(assetScroll, 255);
  builder.addUITransform(assetScroll, ASSET_SCROLL_WIDTH, ASSET_SCROLL_HEIGHT, 0.5, 0.5);

  const viewNode = builder.addNode({ name: "view", parent: assetScroll, pos: [0, 0, 0] });
  builder.addUIOpacity(viewNode, 255);
  builder.addUITransform(viewNode, ASSET_SCROLL_WIDTH, ASSET_SCROLL_HEIGHT, 0.5, 0.5);
  builder.addMask(viewNode);
  builder.addGraphics(viewNode);

  const contentNode = builder.addNode({ name: "content", parent: viewNode, pos: [0, ASSET_SCROLL_HEIGHT / 2, 0] });
  builder.addUIOpacity(contentNode, 255);
  builder.addUITransform(contentNode, ASSET_SCROLL_WIDTH, ASSET_SCROLL_HEIGHT, 0.5, 1);

  builder.addScrollView(assetScroll, contentNode);

  const templates = builder.addNode({ name: "templates", parent: stage, active: false, pos: [0, 0, 0] });
  builder.addUIOpacity(templates, 255);
  builder.addUITransform(templates, ASSET_CARD_WIDTH, ASSET_CARD_HEIGHT, 0.5, 0.5);
  buildAssetTemplate(builder, templates);

  return builder;
}

const builder = buildPrefab();
const outputPath = resolve(process.cwd(), "assets/resources/prefab/multiwalletpanel.prefab");
builder.write(outputPath);
console.log(`generated ${outputPath}`);
