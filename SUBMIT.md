# プロジェクト名
MagoHODL
~ 孫の代まで、絶対に売れないクリプト相続 ~

## 概要
「孫の代まで、絶対に売れないクリプト相続」をコンセプト。
スマートコントラクトを用いて、cbBTC等のERC20トークンをロックし、指定日時まで絶対に売れないようにする。
ロックと同時に相続文章を作成し、Unclockのための情報を引き継ぐ。

## デモ

- **アプリURL**: 
https://base.app/post/0x0fa804e7680fc10564e0a78a69bb0f62ab639512 (Base app)
https://base-ogiri-hackathon.vercel.app/ (Web app)
- **スライド**: https://www.canva.com/design/DAG78sCDvGE/PUXPj9xr_FbVb9ildkQWfg/view?utm_content=DAG78sCDvGE&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=ha9b82be7c2
- **デモ動画**: 
https://drive.google.com/drive/u/0/folders/1hyJ5WEUepmKmm5PrHGDUbFJQUb2eSdvf

## 推しポイント

1. **ポイント1**
   - ハッシュロック・タイムロックを用いたトークンロック管理
      - ハッシュロック：Secretを用いてロックを解除する(相続時に受取主のWallet指定を不要にした)
      - タイムロック：指定日時まで絶対に売れないようにする

2. **ポイント2**
   - 相続書面の自動作成
      - ロックと同時に法的に有効な相続書面を生成
      - Secretのみ手書き等で安全に引き継ぎ

3. **ポイント3**
   - コミット→リビールの2段階Claimでフロントラン耐性
      - 先にハッシュ（commitment）だけをオンチェーンに記録し、後からsecret+saltを開示してClaim
      - commitmentに`lockId`と`msg.sender`を含めて紐付けることで、mempoolでsecretを盗み見されても第三者が横取りできない


## 使用技術

- **フロントエンド**: Next.js (App Router) + TypeScript / React、wagmi + viem、OnchainKit(MiniKit)、Farcaster Mini App SDK
- **バックエンド**: 使用なし
- **データベース**: 使用なし
- **インフラ**: Vercel
- **その他**: Solidity（HTLC + commit-reveal）、Hardhat、OpenZeppelin Contracts

## チームメンバー

- Masashi Ono (フルスタックエンジニア) - @GitHub: Masashi-Ono0611, @Discord: masashi_ono0611

---

*このプロジェクトは「12/13-20 大喜利.hack vibecoding mini hackathon」で作成されました*
