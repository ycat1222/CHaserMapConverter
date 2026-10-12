# MapConverter

MapConverter は、U16旭川プロコン用の `.map` ファイルと東京大会用の `.json` ファイルを相互に変換するためのスクリプトです。

## GitHub Pages 版

このリポジトリは GitHub Pages に公開すると、ブラウザー上で変換できるWebツールとして利用できます。Pages版はJavaScriptで実装しており、サーバーやPython環境は不要です。ファイルの読み込み・変換は利用者のブラウザー内だけで行われます。

### 公開手順

1. このフォルダーの内容をGitHubリポジトリのルートに push します。
2. GitHubリポジトリの **Settings → Pages** を開きます。
3. **Build and deployment** の **Deploy from a branch** を選びます。
4. 公開するブランチ（通常は `main`）とフォルダー **`/ (root)`** を選択し、保存します。
5. Pagesの設定画面に表示されるURLを開きます。

`index.html` がリポジトリのルートにあるため、追加のビルド設定は必要ありません。GitHub Pagesへの反映後は、表示されたURLから利用できます。

### Web版の使い方

- ヘッダーの「ライト」「ダーク」「システム」からテーマを選べます。初期設定はOSの外観設定に連動する「システム」です。選択したテーマはブラウザーに保存され、次回も引き継がれます。
- 入力欄にデータを貼り付けるか、`.map` / `.json` ファイルを選択します。
- 入力形式は通常「自動判定」のままで変換できます。判定できない場合は形式を選択してください。
- **変換する** を押し、結果をコピーするかダウンロードします。

## 使い方

### 1. `.map` → `.json` に変換する

```bash
python MapConverter.py sample_1.map sample_1.json
```

- 入力ファイルの拡張子が `.map` の場合、出力は `.json` 形式になります。
- 出力ファイル名が `.json` で終わらない場合は、自動で `.json` が付加されます。

### 2. `.json` → `.map` に変換する

```bash
python MapConverter.py sample_1.json sample_1.map
```

- 入力ファイルの拡張子が `.json` の場合、出力は `.map` 形式になります。
- 出力ファイル名が `.map` で終わらない場合は、自動で `.map` が付加されます。

## 対応する入力・出力形式

- `.map` 形式
  - 1行目: マップ名
  - 2行目: ターン数
  - 3行目: マップサイズ
  - 4行目以降: マップレイアウト
  - 最後から 2 行目: Cool の位置
  - 最後の行: Hot の位置

- `.json` 形式
  - `id` ※Webへのアップロード時は無視される項目
  - `name`
  - `description`
  - `layout`
  - ※ターン数の項目はありません。

## 注意事項

- マップサイズは 15x17 である必要があります。
- 変換対象のレイアウトは、仕様に従った形式である必要があります。
- `.map` から `.json` に変換する場合、入力ファイルのターン数は無視され、`id` は固定値 `1` となります。
- `.json` から `.map` に変換する場合、`id` は無視され、ターン数は固定値 `100` となります。

## 例

```bash
python MapConverter.py sample_1.map sample_1.json
python MapConverter.py sample_2.json sample_2.map
```
