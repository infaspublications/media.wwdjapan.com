[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com) [![CircleCI](https://circleci.com/gh/infaspublications/media.wwdjapan.com/tree/master.svg?style=svg&circle-token=eb8c55ba6dc58240b2672a78343e73dfa6ccc082)](https://circleci.com/gh/infaspublications/media.wwdjapan.com/tree/master) [![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)

# media.wwdjapan.com
画像圧縮用のLambda@Edgeと画像配信用のAPIサービス。[API Gatewayでサーバレスな画像リサイズAPIを作る](https://qiita.com/akitsukada/items/e6d8fe68c49973d1edf6)のLambda@EdgeとAPI GatewayとLammbdaの部分を構成管理した

![Architecture](https://user-images.githubusercontent.com/1301012/63902229-648b9680-ca43-11e9-9336-07ba6b248707.png)

### 仕様
- acceptヘッダにimage/webpが含まれている場合(webp対応ブラウザ)はwebpに画像を変換
- ?w=xxxのクエリがリクエストにある場合は[指定した許可サイズ](https://github.com/infaspublications/media.wwdjapan.com/blob/master/lambdaEdge/viewerRequest.js#L9)であれば画像を変換（Dos等で大量の画像が作られるのを防ぐため）
- widthが1600px以上の場合は1600pxに画像を変換

## インストール
```shell
$ git clone git@github.com:infaspublications/media.wwdjapan.com.git
$ cd media.wwdjapan.com
$ npm install
$ docker run -v "$PWD":/var/task lambci/lambda:build-nodejs10.x npm run all-install
```

direnvを使用して環境変数を管理します。以下の環境変数を設定してください

```shell
$ cp -pr .envrc.sample .envrc
$ vi .envrc # edit

# allow
$ direnv allow
```

| 環境変数名 | 用途 |
|----|---- |
| AWS_ACCESS_KEY_ID | AWSアクセスキーID |
| AWS_SECRET_ACCESS_KEY | AWSシークレットキー |
| PRODUCTION_BUCKET | 本番環境(productionステージ)で使用するバケット |
| STAGING_BUCKET | ステージング環境(stagingステージ)で使用するバケット |
| DEFAULT_BUCKET | 開発環境で使用するバケット |
| TEST_BUCKET | インテグレーションテストで使用するバケット |
| PRODUCTION_DISTRIBUTION_ID | 本番環境(productionステージ)のdistribution_id |
| STAGING_DISTRIBUTION_ID | ステージング環境(stagingステージ)のdistribution_id|
| DEFAULT_DISTRIBUTION_ID | 開発環境のdistribution_id|

## テスト

`TEST_BUCKE`という環境変数に、画像を設置するS3バケットのバケット名を記載してください
```shell
$ npm run test-lambdaedge # Lambda@Edge側のユニットテスト
$ npm run test-originresponse　# 画像配信用API側のテスト
```

## デプロイ
以下のコマンドで任意のステージにデプロイされます。また、masterブランチへのpushのタイミングで、developmentとstagingブランチへは自動でデプロイが走ります
```shell
$ npm run deploy:edge -- --stage <ステージ名> # lambdaEdgeのデプロイ
$ npm run deploy:origin -- --stage <ステージ名>　# originResponseのデプロイ
```

lambdaEdgeの方については`cloudfront-edge-<ステージ名>-viewerRequest`関数のマネジメントコンソールから
lambda@Edgeへの手動でデプロイを実施してください。

**注) `lambdaEdge`と`originResponse`配下の`serverless.yml`にて`deploymentBucket`をハードコーディングしてしまっています。
ここはデプロイ前に各自の環境に合わせて書き換えを行ってください。**

## 本番リリース
タグを作ることでCircleCIからデプロイが実施されます

```shell
$ git tag 1.0.0
$ git push origin 1.0.0
```

