[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com) [![CircleCI](https://circleci.com/gh/infaspublications/media.wwdjapan.com/tree/master.svg?style=svg&circle-token=eb8c55ba6dc58240b2672a78343e73dfa6ccc082)](https://circleci.com/gh/infaspublications/media.wwdjapan.com/tree/master) [![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)

# media.wwdjapan.com
画像圧縮用のLambda@Edgeと画像配信用のAPIサービス。[API Gatewayでサーバレスな画像リサイズAPIを作る](https://qiita.com/akitsukada/items/e6d8fe68c49973d1edf6)のLambda@EdgeとAPI GatewayとLammbdaの部分を構成管理した

![Architecture](https://user-images.githubusercontent.com/1301012/63902229-648b9680-ca43-11e9-9336-07ba6b248707.png)

### 仕様
- acceptヘッダにimage/webpが含まれている場合(webp対応ブラウザ)はwebpに画像を変換
- ?w=xxxのクエリがリクエストにある場合はそのサイズに画像を変換
- widthが1600px以上の場合は1600pxに画像を変換

## インストール
```shell
$ git clone git@github.com:infaspublications/media.wwdjapan.com.git
$ cd media.wwdjapan.com
$ npm install
$ docker run -v "$PWD":/var/task lambci/lambda:build-nodejs10.x npm run all-install
```

以下の環境変数を設定してください

| TH1 | TH2 |
|----|---- |
| PRODUCTION_BUCKET | 本番環境(productionステージ)で使用するバケット |
| STAGING_BUCKET | ステージング環境(stagingステージ)で使用するバケット |
| DEFAULT_BUCKET | 開発環境で使用するバケット |
| TEST_BUCKET | テストで使用するバケット |

## テスト

`TEST_BUCKE`という環境変数に、画像を設置するS3バケットのバケット名を記載してください
```shell
$ npm run test-lambdaedge # Lambda@Edge側のユニットテスト
$ npm run test-originresponse　# 画像配信用API側のテスト
```

## デプロイ
```shell
$ cd lambdaEdge && npx serverless deploy --stage <ステージ名>
$ cd originResponse && npx serverless deploy --stage <ステージ名>
```

lambdaEdgeの方については`cloudfront-edge-<ステージ名>-viewerRequest`関数のマネジメントコンソールから
lambda@Edgeへの手動でデプロイを実施する

## 本番リリース
タグを作ることでCircleCIからデプロイが実施されます

```shell
$ git tag 1.0.0
$ git push origin 1.0.0
```

lambda@Edgeへのデプロイは、CircleCIからのデプロイ完了後に
`cloudfront-edge-production-viewerRequest`関数のマネジメントコンソールから手動で実施する
