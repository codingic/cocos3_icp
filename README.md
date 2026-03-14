# cocos3_icp

这是一个在 Cocos Creator 中集成 ICP (Internet Computer Protocol) 的项目。

## 当前功能

- 首页保留 5 个入口：`多链钱包`、`ii登录`、`oisy登录`、`官方singer`、`oisy connect`
- 前端通过 `lib3` + 本地 adapter 层接入 ICP SDK，避免业务脚本直接依赖三方包全局对象
- `II` / `signer` / `ledger` / `cycles ledger` 由上层工具统一提供，本项目直接复用
- `backend` / `frontend` canister id 在构建前自动同步到前端运行时配置
- `DFX_NETWORK` 支持 `local` / `ic` 双环境切换

## 已下线功能

- `涨幅排行榜`
- `k线数据管理`
- `周期内排行榜`
- 相关的 K 线面板、管理脚本、did 和 prefab 资源已从项目中移除

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
- `DFX_NETWORK=ic`：业务 canister id 取自 `.dfx/ic/canister_ids.json`，基础设施配置取自环境变量

5 构建并部署业务 canister 时，在 `cocos_frontend` 目录执行：
```
bash ./local-deploy-app.sh
```
这个脚本现在会按顺序执行：`同步运行时配置 -> deploy backend -> 刷新运行时配置 -> build cocos -> deploy frontend`

6 本地和生产都由 `DFX_NETWORK` 控制：
```
DFX_NETWORK=local bash ./local-deploy-app.sh
DFX_NETWORK=ic SIGNER_CANISTER_ID=xxxxx SIGNER_KEY_NAME=key_1 bash ./local-deploy-app.sh
```
当 `DFX_NETWORK=ic` 时，建议至少提供这些环境变量：
- `SIGNER_CANISTER_ID`
- `SIGNER_KEY_NAME`
- 可选：`IDENTITY_PROVIDER_URL`、`ICP_LEDGER_CANISTER_ID`、`II_CANISTER_ID`、`CYCLES_LEDGER_CANISTER_ID`

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
