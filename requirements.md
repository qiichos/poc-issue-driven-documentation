了解です！\*\*「一連の流れをデモできればOK（DBなし）」\*\*前提で、最小の要件を改めて一本化します。

# 目的

* TipTapエディタで文章編集
* 範囲選択した部分にコメントを付与
* コメント送信で GitHub Issue を自動作成
* 画面に Issue 番号とリンクを即時表示（※リロードで消える）

# スコープ（最小）

1. **画面（/）**

   * TipTap（StarterKit）で編集可能な本文
   * 範囲選択時にバブルメニュー表示［コメント］
   * コメント入力モーダル（1項目：本文）
   * 成功時：選択範囲をハイライト＋右サイドバーに「抜粋・Issue番号・リンク」表示
   * コメント・ハイライトは**Reactのstateのみ**で保持（永続化なし）

2. **API**

   * `POST /api/comments`

     * 入力：`{ from, to, anchorText, body }`
     * 処理：GitHub REST `POST /repos/{owner}/{repo}/issues`
     * 出力：`{ issueNumber, issueUrl }`
   * `GET /api/comments` は**不要**

3. **認証・設定**

   * サーバー側環境変数：

     ```
     GITHUB_TOKEN=ghp_xxx
     GITHUB_OWNER=your-org
     GITHUB_REPO=your-repo
     ```
   * ユーザー認証は**なし**（PoC）

4. **開発構成**

   * Next.js (App Router) / bun / biome
   * 主要依存：`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-bubble-menu`, `zod`

# 非スコープ

* ページ再読み込み後の復元（永続化）
* 複数ユーザー・権限
* コメント解決／双方向同期
* PRやコミットへの投稿
* ドキュメントの複数管理

# 画面要件（最小UI）

* ヘッダー：「Editor PoC」
* 左：エディタ（約70%）
* 右：コメントサイドバー（約30%）

  * 表示：抜粋（最大30字）／Issue番号／外部リンク
* バブルメニュー：［コメント］ボタン
* トースト：成功・失敗通知

# データ（フロントstateのみ）

```ts
type Comment = {
  id: string;        // クライアント生成 (uuid)
  from: number;
  to: number;
  anchorText: string;
  issueNumber: number;
  issueUrl: string;
};
```

# GitHub Issue 仕様（例）

* タイトル：`[Comment] <抜粋先頭30文字>`
* 本文：

  ```
  Source: TipTap Comment PoC
  Anchor:
  > 抜粋テキスト

  Position: from=<from>, to=<to>
  ```
* ラベル（任意）：`["tiptap-comment","poc"]`

# 受け入れ基準

* [ ] 範囲選択→コメント入力→送信でGitHub Issueが作成される
* [ ] 作成直後、サイドバーにIssue番号とリンクが表示される
* [ ] ページを再読み込みするとコメントとハイライトは消える（仕様通り）
* [ ] biomeでlint/formatが通り、bunで起動できる

# 最小ファイル構成（目安）

```
app/
  page.tsx                 // UI（TipTap + サイドバー）
  api/comments/route.ts    // POSTのみ
lib/
  github.ts                // Issue作成の薄いラッパ
components/
  CommentModal.tsx         // 入力モーダル
  BubbleComment.tsx        // バブルメニュー
  Sidebar.tsx              // コメント一覧
```

# 実装のコア手順

1. TipTap初期化（StarterKit）
2. `BubbleMenu`で［コメント］ボタン → `editor.state.selection.from/to` と `textBetween`取得
3. モーダルで本文入力 → `/api/comments` へPOST
4. レスポンスの `issueNumber/issueUrl` を state に追加
5. TipTap Decorations で `[from,to]` をハイライト
6. 送信の連打防止（送信中はボタンdisabled）

# エラーハンドリング（最小）

* GitHub API失敗時：エラートースト＋再試行ボタン
* 401/403時：`.env`設定ミスを示すメッセージ

---

これで**DBなしPoC**の要件は完成です。必要なら、この要件に沿った**最小サンプルコード**もすぐ出せます。
