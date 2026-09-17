# 知交 · 角色关系网

面向小说作者的本地人物关系图工具。Vue 3 + TypeScript + Vite + Cytoscape.js + Electron，使用 JSON 存储，不需要数据库或账户。

## 直接运行

打开 `release/角色关系网.exe`，适用于 Windows 10/11 x64。它是免安装的便携程序，已包含运行环境。首次打开内置《云川旧事》示例，之后恢复本机上次保存的故事。

程序尚未购买代码签名证书。首次运行时，Windows 可能显示“未知发布者”。

## 日常使用

1. 点击 **新增角色**，填写姓名，按需添加头像、阵营、标签、小传或初始关系。
2. 点击 **添加关系**，选择起点与终点，输入关系名称、单向或双向、描述。
3. 单向“花盈 → 花绫，姐姐”表示“花盈是花绫的姐姐”。双向表示两端共享该关系。同一对人物可保存多条不同关系，也支持角色自身关系。
4. 点击节点或左侧列表查看人物档案；点击连线或详情中的关系行查看关系描述并编辑。
5. 滚轮缩放，拖动空白处平移，拖动节点微调。自动布局重新排列；适应画布显示当前筛选下的全部人物。
6. 阵营下拉框或底部图例筛选人物；**聚焦一度关系**淡化不直接相连的角色；关系标签可以隐藏。
7. 修改自动保存。**导出**生成包含头像的 JSON，建议定期备份。新建或导入前可先导出原故事。

快捷键：`Ctrl+S` 保存，`Ctrl+Z` 撤销，`Ctrl+Y` / `Ctrl+Shift+Z` 重做，`Esc` 关闭对话框。文本框保留系统原生撤销行为。支持最近 30 次图谱修改的撤销，关闭程序后撤销记录不保留。

## JSON 格式

```json
{
  "version": 1,
  "title": "我的小说",
  "description": "故事的一句话简介",
  "characters": [
    {
      "id": "001",
      "name": "花盈",
      "avatar": "images/huaying.png",
      "group": "花家",
      "color": "#4f8072",
      "tags": ["主角", "医者"],
      "notes": "花家长女，温柔而坚韧。"
    },
    { "id": "002", "name": "花绫" }
  ],
  "relations": [
    {
      "id": "r001",
      "from": "001",
      "to": "002",
      "label": "姐姐",
      "direction": "one-way",
      "description": "姐妹相依为命。"
    }
  ]
}
```

- 必需：顶层 `characters`、`relations` 数组；角色的字符串 `id` 与 `name`；关系的 `from` 与 `to`。
- `version`、故事信息及角色扩展信息可省略。省略关系 ID 时按数组顺序生成；默认方向为 `one-way`。
- `direction` 支持 `one-way` 和 `two-way`。角色 ID 与关系 ID 分别必须唯一；所有关系端点必须存在。重复 ID、悬空关系、错误版本等均阻止整份导入，不会部分覆盖当前内容。
- 角色名称可相同，但 ID 不同会被视为不同的人。新增角色自动生成 UUID。
- 原有未知 JSON 字段在导入、编辑和导出时保留，便于以后扩展。
- 桌面版头像支持 PNG、JPG、WebP、GIF，以及相应的 base64 data URL。相对路径必须位于 JSON 所在目录或其子目录；不访问网络 URL 和目录外文件。单个头像限 5 MB。头像缺失时导入预览会提示，并回退显示姓名。
- 导出的头像嵌入 JSON，无需额外复制图片目录。完整示例见 `examples/云川旧事.json`。
- 单份 JSON 限 64 MB、2,000 角色、20,000 关系。已实际验证 500 角色、499 关系图谱。运行速度受关系密度、头像大小与电脑性能影响。

## 本地存储与恢复

桌面数据保存在 Electron 的用户数据目录中（Windows `%APPDATA%` 下的应用目录），主文件为 `atlas.json`，上一份有效 JSON 为 `atlas.json.bak`。程序先写临时文件，再替换主文件；保存请求按顺序执行，关闭窗口前完成最后一次保存。

若主文件无法解析，尝试读取备份并显示恢复提示。无法读取主文件及备份时保留原文件，停止自动覆盖，允许手动导入备份恢复。建议使用“导出”保存多份独立备份。

浏览器开发预览使用 localStorage；受浏览器配额限制，容量远小于桌面版。相对路径头像仅在桌面原生导入中可解析。生产交付为桌面 exe。

## 布局说明

默认使用 fCoSE 力导向布局，另有环形布局。布局后进行包含文字边界的间距修正；角色编辑及拖动结束后也检查间距。多条关系使用曲线区分，支持双向箭头。

节点间距可以自动修正，但任意复杂图无法保证所有边完全不交叉，也无法保证密集边的标签全部互不遮挡。可按阵营筛选、隐藏标签、聚焦一度关系或放大局部查看。重新打开时重新计算布局；当前缩放、拖动位置与显示设置不写入故事 JSON。

## 开发与构建

需要 Node.js 22.12+（本项目在 Node.js 24 上构建）。

```powershell
npm ci
npm run dev       # 浏览器开发预览
npm run desktop   # 构建并启动 Electron
npm test          # 数据完整性与碰撞修正测试
npm run pack      # Windows x64 便携 exe
```

首次运行或打包会下载官方 Electron 二进制和打包工具，需要网络。`package-lock.json` 锁定构建依赖。可用 `electron_config_cache` 与 `ELECTRON_BUILDER_CACHE` 环境变量指定缓存目录。

源码结构：`src/App.vue` 负责编辑工作流，`src/model.ts` 负责数据校验，`src/layout.ts` 负责间距修正，`src/components/RelationshipGraph.vue` 负责图谱，`electron/main.cjs` / `preload.cjs` 负责受限的本地文件接口。

桌面测试脚本：`tests/electron-smoke.cjs`，会使用独立测试目录，验证原生保存、备份、头像解析与导出；加 `--verify-persist` 验证下一次启动。浏览器交互测试脚本使用 Tabbit 的浏览器运行环境。

技术参考：[Cytoscape.js](https://js.cytoscape.org/)、[fCoSE](https://github.com/iVis-at-Bilkent/cytoscape.js-fcose)、[Electron 上下文隔离](https://www.electronjs.org/docs/latest/tutorial/context-isolation)。
