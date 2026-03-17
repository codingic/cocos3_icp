# cocos3_icp

这是一个在 Cocos Creator 中集成 ICP (Internet Computer Protocol) 的项目。

## 当前功能

- 首页保留 6 个入口：`多链钱包`、`ii登录`、`oisy登录`、`官方singer`、`oisy connect`、`多账户钱包`
- 新增 `多账户钱包` 面板，包含账户切换、语言切换、网络切换、主资产卡片和资产列表示例 UI
- 前端通过 `lib3` + 本地 adapter 层接入 ICP SDK，避免业务脚本直接依赖三方包全局对象
- `II` / `signer` / `ledger` / `cycles ledger` 由上层工具统一提供，本项目直接复用
- `local` 环境的 `backend` / `frontend` canister id 在构建前自动同步到前端运行时配置
- `ic` 环境直接读取仓库内固定生产配置，不再依赖 `.dfx/ic`
- `DFX_NETWORK` 支持 `local` / `ic` 双环境切换



## 本地部署步骤

1. 启动或复用上层工具已经使用的本地 dfx 网络，不要在这里执行 `--clean`：
   ```
   dfx start --background
   ```

2. 基础设施 canister 由上层工具统一部署，本项目直接复用：
   `internet_identity`、`signer`、`ledger`、`cycles ledger`

3 导出第三方库  
```
node ./tools/build-icp-sdk.mjs  
node ./tools/build-oisy-wallet-signer.mjs
 ```

4 只构建 Cocos 前端时，在 `cocos_frontend` 目录执行：
```
bash ./build-cocos.sh
```
这一步会先根据 `DFX_NETWORK` 生成统一运行时配置：
- `DFX_NETWORK=local`：基础设施 id 取自 `localRuntime.generated.js`，业务 canister id 取自 `.dfx/local/canister_ids.json`
- `DFX_NETWORK=ic`：业务和基础设施 id 取自 `cocos_frontend/config/productionRuntime.config.js`

5 构建并部署业务 canister 时，在 `cocos_frontend` 目录执行：
```
bash ./local-deploy-app.sh
```
这个脚本现在会按顺序执行：`同步运行时配置 -> deploy backend -> 刷新运行时配置 -> build cocos -> deploy frontend`

6 本地和生产都由 `DFX_NETWORK` 控制：
```
DFX_NETWORK=local bash ./local-deploy-app.sh
DFX_NETWORK=ic bash ./local-deploy-app.sh
```
当 `DFX_NETWORK=ic` 时，请先把生产配置直接写进：
- `cocos_frontend/config/productionRuntime.config.js`

至少应填写这些固定值：
- `backendCanisterId`
- `frontendCanisterId`
- `signerCanisterId`
- `signerKeyName`

如果你临时还没把值写进代码，也可以继续用环境变量覆盖这些字段：
- `BACKEND_CANISTER_ID`
- `FRONTEND_CANISTER_ID`
- `SIGNER_CANISTER_ID`
- `SIGNER_KEY_NAME`

7 如需重新部署前端和本项目 canister，再执行一次：
```
bash ./local-deploy-app.sh
```
 



eth::eth_address 内部取公钥时走的是：
* Schema::Eth.derivation_path(principal)也就是派生路径前两段固定是：[ [0x01], [caller_principal_bytes] ]

generic_caller_ecdsa_public_key 用的是 Generic schema 的派生路径
* Schema::Generic.derivation_path_ending_in(&ic_cdk::caller(), arg.derivation_path)
也就是说最终派生路径变成：[ [0xff], [caller_principal_bytes] ] + 你传入的 ending
你传空数组，就等于只用 [0xff, caller] 这条路径，和 [0x01, caller]（Eth schema）完全不同，因此公钥不同、地址不同
