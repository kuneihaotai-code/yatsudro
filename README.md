# ヤツドロ。サイト — セットアップ・運用ガイド

## フォルダ構成

```
/
├── index.html
├── service.html
├── area.html
├── contact.html
├── news.html          ← build.js が自動生成
├── posts/             ← build.js が自動生成
│   └── 2026-04-10-website-launch.html
├── _posts/            ← ★ Notionで書いた記事をここに置く
│   └── 2026-04-10-website-launch.md
├── admin/             ← Netlify CMS 管理画面
│   ├── index.html
│   └── config.yml
├── build.js           ← ビルドスクリプト
├── netlify.toml       ← Netlify設定
└── favicon.png / icon.png / hero.mp4 / Semamojikana-Bold.woff
```

---

## 初回セットアップ手順

### 1. GitHubにリポジトリを作る
1. https://github.com/new でリポジトリを作成（例: `yatsudoro-site`）
2. このフォルダの全ファイルをアップロード  
   ```bash
   git init
   git add .
   git commit -m "初回コミット"
   git branch -M main
   git remote add origin https://github.com/あなたのユーザー名/yatsudoro-site.git
   git push -u origin main
   ```

### 2. Netlifyでサイトを公開する
1. https://netlify.com にアクセスしてGitHubでログイン
2. "Add new site" → "Import an existing project" → GitHubを選択
3. リポジトリ `yatsudoro-site` を選択
4. Build command: `node build.js`、Publish directory: `.` を確認
5. "Deploy site" をクリック → 数秒で公開完了！

### 3. Netlify CMSを有効にする
1. Netlifyのサイト設定 → "Identity" → "Enable Identity"
2. "Git Gateway" → "Enable Git Gateway"
3. "Identity" → "Invite users" で自分のメールアドレスを招待
4. `https://あなたのサイト.netlify.app/admin` にアクセスしてログイン

---

## 記事の書き方（Notionを使う場合）

Notionで記事を書いたら、以下の手順でサイトに反映します。

1. **Notionで記事を書く**（普通のページとして）
2. **エクスポート**: ページ右上メニュー → "Export" → "Markdown & CSV"
3. ダウンロードした `.md` ファイルを `_posts/` フォルダに移動
4. ファイル名を `YYYY-MM-DD-タイトル英語.md` に変更  
   例: `2026-05-01-flight-report-02.md`
5. ファイルの先頭に以下を追加（frontmatter）:

```
---
title: 記事のタイトル
category: blog
date: 2026-05-01
excerpt: 一覧に表示される概要文（100文字くらい）
emoji: 🏔️
---

（ここから本文）
```

6. GitHubにpush → Netlifyが自動でビルドして公開

---

## Netlify CMSを使う場合（より簡単）

`https://あなたのサイト.netlify.app/admin` にアクセスすると管理画面が開きます。

- "New 記事" から記事を作成
- 保存するとGitHubに自動コミット → 自動ビルド → 公開

**コード不要・GitHubも不要**でブラウザだけで記事を書けます。

---

## カテゴリの種類

| 値 | 表示名 |
|---|---|
| `news` | お知らせ |
| `blog` | ブログ |
| `report` | 飛行レポート |

---

## 記事本文で使えるMarkdown記法

```markdown
## 見出し（大）
### 見出し（中）

普通の段落テキスト。

- リスト項目1
- リスト項目2

> 引用文はこのように書きます

**太字** *イタリック*

[リンクテキスト](/contact.html)
```
