# Farcaster Mini App / Base Mini App（iOS）におけるBase Sepolia対応状況について

## 目的
本ドキュメントは、Base Sepolia を利用する dapp を以下の3経路で開いた際に、ウォレット接続・Tx送信挙動が一致しない問題について、現状の調査/実験結果を整理し、質問事項をまとめたものです。

## サマリー（現時点の結論）
- Base App（iOS）については、ホストの supportedChains に Base Sepolia が存在しないため、
  - **Base App iOSで Base Sepolia を使うのは難しい（ほぼ不可）** 可能性が高い
- Farcaster iOSについては supportedChains に Base Sepolia が存在するが、
  - 「資金不足」判定等の問題で Tx が通らないケースがあり、
  - ホスト提供のウォレット/プロバイダが testnet を完全には扱えていない可能性がある

## 現状のアプリリンク
- Web直開き: https://base-ogiri-hackathon.vercel.app/
- Farcaster投稿（Mini App起動元）: https://farcaster.xyz/masashi-ono0611/0xd0cca00a
- Base App投稿（Mini App起動元）: https://base.app/post/0xd0cca00a13c0d18a8eacf5d0a4309c89850ba670
- GitHub: https://github.com/Masashi-Ono0611/base-ogiri-hackathon/

## 前提（アプリ側）
- アプリは Base Sepolia（chainId: 84532）を前提に実装している
  - `OnchainKitProvider chain={baseSepolia}`
  - `wagmi` の `chains: [baseSepolia]`
- HTLCコントラクト/USDCも Base Sepolia 前提

## 公式ドキュメント上の確認事項（一次情報）
### Base Sepolia のネットワーク情報
Base公式Docsに Base Sepolia のRPC/chainId等が明記されている。
- RPC: https://sepolia.base.org
- Chain ID: 84532
- Explorer: https://sepolia-explorer.base.org

### Farcaster Mini App: 対応チェーンの宣言/検出
Farcaster Mini AppsのSDKでは、ホストがサポートするチェーンを以下で扱える。
- `sdk.getChains()` でホストがサポートするチェーン（CAIP-2）を取得可能
- manifest の `miniapp.requiredChains` で、必要チェーン（CAIP-2）を宣言可能
  - ホストが requiredChains を満たさない場合、ホストはレンダリングしない判断ができる

## 実験結果まとめ
### 1) Web直開き（Safari/Chrome等）
- Mini App Debug
  - SDK: ready
  - isInMiniApp: false
  - supportedChains: (empty)
- ウォレット接続
  - Wallet選択UIが出て、MetaMask/Coinbase Wallet等を任意に接続できる
- Tx
  - Base Sepolia を追加済・資金ありのウォレットなら送信/記録ともに成功

解釈:
- 通常のWeb dappとしての挙動。チェーン追加/切替はウォレット側機能に依存。

### 2) Farcaster（Web: https://farcaster.xyz/）
- Mini App Debug
  - SDK: ready
  - isInMiniApp: true
  - supportedChains: `eip155:8453, eip155:84532, eip155:1, ...`
    - `eip155:84532`（Base Sepolia）が含まれる
- ウォレット接続
  - Connectボタン押下でブラウザ拡張（MetaMask等）を起動して接続できる
- Tx
  - 接続したウォレットが Base Sepolia 追加済・資金ありならTx成功

解釈:
- Farcaster Webはブラウザ拡張ウォレットと連携できるため、Web直開きに近い挙動。

### 3) Farcaster（iOS）
- Mini App Debug
  - SDK: ready
  - isInMiniApp: true
  - supportedChains: `eip155:8453, eip155:84532, eip155:1, ...`
    - `eip155:84532`（Base Sepolia）が含まれる
- ウォレット接続
  - Connectボタン押下で、Farcasterアカウントに紐づくウォレットが自動的に接続される
- Tx
  - Base Sepolia に資金が入っているにも関わらず、UI上「資金不足」扱いになりTxが実行できない

解釈（仮説）:
- `sdk.getChains()` 的には Base Sepolia 対応として宣言されているが、
  - iOSホスト提供のプロバイダ/ウォレットが「テストネット残高」や「ガス見積もり」を正しく参照できていない
  - あるいは実際に接続されている chainId が期待と異なる（要追加検証）
  - あるいはホスト側のセキュリティスキャン/ポリシーで testnet tx が制限されている

### 4) Base App（iOS）
- Mini App Debug
  - SDK: ready
  - isInMiniApp: true
  - supportedChains: `eip155:8453, eip155:1, eip155:10, ...`
    - **`eip155:84532`（Base Sepolia）が含まれない**
- ウォレット接続
  - Baseアカウントに紐づくウォレットが自動的に接続される
- Tx
  - Base Sepolia前提のTxはうまく送れない

解釈:
- Base App（iOS）のホストは、少なくとも `sdk.getChains()` が返す範囲では Base Sepolia をサポートしていない。
- よって Base App iOS 内で Base Sepolia を使ったTx送信は、仕様上困難な可能性が高い。

## 重要な整理（現時点の結論）
- Base App（iOS）については、ホストの supportedChains に Base Sepolia が存在しないため、
  - **Base App iOSで Base Sepolia を使うのは難しい（ほぼ不可）** 可能性が高い
- Farcaster iOSについては supportedChains に Base Sepolia が存在するが、
  - 「資金不足」判定等の問題で Tx が通らないケースがあり、
  - ホスト提供のウォレット/プロバイダが testnet を完全には扱えていない可能性がある

## Base Japanチームへの質問
### Q1. Base App iOSおよびFarcaster iOSにおいて、Base Sepolia（eip155:84532）を使う方法はないか？
- 私の調査・実装が誤っている可能性も含めて確認したい
- 現状、`sdk.getChains()` の観測では
  - Farcaster iOSは `eip155:84532` を返す
  - Base App iOSは `eip155:84532` を返さない
- iOSホストの内蔵ウォレット/プロバイダで Base Sepolia を有効化する手順や推奨実装があれば知りたい

### Q2. Q1がNoの場合、今回のハッカソンではどのように対応すべきか？
- Base Mainnet（8453）へデプロイして、Base App iOSでも動作させるのが推奨か？
- それとも、Farcaster Web（ブラウザ拡張ウォレット）での利用を前提にするのが推奨か？
