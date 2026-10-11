# GBF Web Bookmark Plugin

## 中文

这是一个用于《Granblue Fantasy》网页版的 Tampermonkey / 油猴书签面板插件。

### 功能

- 在游戏页面中显示可拖拽书签面板
- 支持主分类和副本分类
- 支持添加、编辑、删除书签
- 支持为单个书签设置按键或鼠标映射
- 鼠标映射支持左键、中键、右键和侧键 1-7
- 支持按键映射总开关，默认关闭
- 支持透明度、待机时间、面板宽度比例、面板高度比例和字体比例调节
- 高度比例调整面板垂直布局，字体不会被纵向拉伸
- 宽度比例可直接输入，限制为大于 20% 且小于 200%
- 支持贴边吸附和自动休眠
- 休眠后可通过鼠标悬停唤醒
- 浏览器窗口尺寸变化时，面板会尽量保持在可见边界内
- 支持锁定面板位置，同时保留侧边吸附和隐藏功能
- 右键列表标签可以自定义两个列表名称
- 支持键盘映射鼠标左键

### 安装

1. 安装 Tampermonkey / 油猴扩展。
2. 打开快速安装链接：`https://raw.githubusercontent.com/MoShuangYanQin/gbf-web-bookmark-plugin/main/gbf-web-bookmark-plugin-v7.2.8.user.js`。
3. 在 Tampermonkey / 油猴安装页确认安装。
4. 刷新 GBF 网页。

也可以打开 `gbf-web-bookmark-plugin-v7.2.8.user.js`，将脚本内容复制到 Tampermonkey 新脚本中保存。

### 版本文件

- 最新版本脚本放在仓库主目录。
- 旧版本脚本放在 old_versions/ 文件夹。

### 使用

- 左键拖拽面板内大部分区域可以移动面板。
- 左键点击标题 `GBF Tools` 可以开启或关闭待机模式。
- 右键点击标题可以打开设置面板。
- 右键点击书签可以编辑、删除，或设置按键映射。
- 右键标题设置中可开启按键映射功能；未开启时不会响应映射。
- 将面板拖到浏览器边界附近会自动吸附。
- 右键书签时，编辑菜单会根据当前书签行的实时位置显示，并自动避开视口边界。

### 更新日志

- `v7.2.8`：修复调整面板宽度后右键编辑菜单仍按旧面板位置显示的问题；宽度变化后立即完成布局同步，并让菜单根据当前书签行定位。
- `v7.2.7`：调整高度比例逻辑，在改变面板垂直布局的同时保持字体大小不变；宽度比例支持直接输入。
- `v7.1.8`：修复样式选择器污染，避免影响 GBF 页面列表布局。
- `v7.1.7`：整理鼠标键位命名并保持书签映射功能。

## English

This is a Tampermonkey userscript that adds a draggable bookmark panel to the web version of Granblue Fantasy.

### Features

- Draggable bookmark panel inside the game page
- Main and raid bookmark categories
- Add, edit, and delete bookmarks
- Assign keyboard or mouse bindings to individual bookmarks
- Mouse bindings support left, middle, right, and side buttons 1-7
- Optional global shortcut toggle, off by default
- Opacity, idle timer, panel width ratio, panel height ratio, and font ratio settings
- Height ratio changes the panel's vertical layout without vertically stretching the font
- Width ratio can be entered directly and must be greater than 20% and less than 200%
- Edge docking and auto-idle mode
- Wake from idle by hovering the mouse
- Keeps the panel within visible browser bounds when the viewport changes
- Position locking prevents accidental dragging while preserving docking and idle hiding
- Right-click the list tabs to customize both list names
- Keyboard-to-left-click mapping

### Installation

1. Install the Tampermonkey browser extension.
2. Open the quick install link: `https://raw.githubusercontent.com/MoShuangYanQin/gbf-web-bookmark-plugin/main/gbf-web-bookmark-plugin-v7.2.8.user.js`.
3. Confirm installation in Tampermonkey.
4. Refresh the GBF web page.

You can also open `gbf-web-bookmark-plugin-v7.2.8.user.js`, copy the script into a new Tampermonkey script, and save it.

### Version Files

- The latest userscript is kept in the repository root.
- Older userscripts are kept in the old_versions/ folder.

### Usage

- Drag most areas of the panel with the left mouse button to move it.
- Left-click the `GBF Tools` title to enable or disable idle mode.
- Right-click the title to open settings.
- Right-click a bookmark to edit, delete, or assign a binding.
- Enable bookmark bindings from the title settings panel; it stays off by default.
- Drag the panel near a browser edge to dock it.
- When a bookmark is right-clicked, the edit menu is positioned from the current row geometry and kept inside the viewport.

### Changelog

- `v7.2.8`: Fixed the edit menu using the old panel position after resizing; the layout now updates immediately and the menu anchors to the current bookmark row.
- `v7.2.7`: Adjusted the height ratio behavior to preserve font size while changing the panel's vertical layout; width ratio can be entered directly.
- `v7.1.8`: Fixed CSS selector leakage so the GBF page list layout is no longer affected.
- `v7.1.7`: Cleaned up mouse button naming while keeping bookmark bindings.

## 日本語

これは Granblue Fantasy の Web 版で使う Tampermonkey ユーザースクリプトです。ゲーム画面にドラッグ可能なブックマークパネルを追加します。

### 機能

- ゲーム画面内にドラッグ可能なブックマークパネルを表示
- メイン用とクエスト用の分類に対応
- ブックマークの追加、編集、削除
- 個別ブックマークにキーやマウスの割り当てを設定
- マウス割り当ては左、中、右クリックとサイドボタン 1-7 に対応
- 割り当て機能の全体オン/オフ切り替え、初期はオフ
- 透明度、待機時間、パネル幅比率、パネル高さ比率、フォント比率の調整
- 高さ比率を変更しても、フォントは縦方向に引き伸ばされません
- 幅比率は直接入力でき、20%より大きく200%未満で設定できます
- 画面端への吸着と自動待機モード
- マウスホバーで待機状態から復帰
- ブラウザサイズ変更時にパネルを表示範囲内へ保つ処理
- パネル位置のロックに対応し、端への吸着と待機非表示は引き続き使用可能
- リストタブを右クリックして2つのリスト名を変更可能
- キーボードで左クリックを割り当て可能

### インストール

1. Tampermonkey 拡張機能をインストールします。
2. クイックインストールリンクを開きます: `https://raw.githubusercontent.com/MoShuangYanQin/gbf-web-bookmark-plugin/main/gbf-web-bookmark-plugin-v7.2.8.user.js`
3. Tampermonkey のインストール画面で確認します。
4. GBF の Web ページを再読み込みします。

または `gbf-web-bookmark-plugin-v7.2.8.user.js` を開き、スクリプト内容を Tampermonkey の新規スクリプトに貼り付けて保存します。

### バージョンファイル

- 最新版のスクリプトはリポジトリ直下に置いています。
- 旧版のスクリプトは old_versions/ フォルダに置いています。

### 使い方

- パネル内の多くの場所を左ドラッグすると、パネル全体を移動できます。
- `GBF Tools` のタイトルを左クリックすると、待機モードを切り替えます。
- タイトルを右クリックすると設定を開きます。
- ブックマークを右クリックすると編集、削除、割り当て設定ができます。
- タイトルの設定から割り当て機能を有効化できます。初期状態では無効です。
- パネルをブラウザ端へ近づけると吸着します。
- ブックマークを右クリックすると、現在の行位置に合わせて編集メニューが表示され、画面外を避けます。

### 更新履歴

- `v7.2.8`: パネル幅変更後も古い位置に表示されていた右クリック編集メニューを修正し、現在のブックマーク行に基づいて表示するようにしました。
- `v7.2.7`: フォントサイズを維持したままパネルの縦方向レイアウトを変更できるようにし、幅比率を直接入力できるようにしました。
- `v7.1.8`: CSS セレクタの影響範囲を限定し、GBF 側の一覧レイアウト崩れを修正しました。
- `v7.1.7`: ブックマーク割り当てのまま、マウスボタン名を整理しました。
