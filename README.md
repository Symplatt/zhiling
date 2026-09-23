# 织灵 · 角色关系网

本软件由 Symplatt 设计并主导开发，GPT-6 Astra（推理强度：高）辅助实现。

README也是ChatGPT生成的，开发者自己都没看完过，反正UI清晰交互简单，安装完自己摸索着用就行。

## 安装

在 [Releases](https://github.com/Symplatt/zhiling/releases/latest) 下载 **Zhiling-Setup-2.1.6.exe**，双击安装，以后从桌面快捷方式打开。支持 Windows 10/11（64 位），无需 Python 或 Node.js。

更新前保存作品、导出 JSON 备份并关闭旧版，再运行新安装包。

## 使用

- 新建关系网，添加角色、头像和关系，或导入 JSON。书架最多保存 1,000 张关系网。
- 滚轮缩放、拖动浏览或调整角色位置；点击角色、关系查看详情。
- 图谱设置可切换五套主题、自然或环形布局、五档大小与间距，以及已有头像角色的姓名显示。环形自动排列的节点中心组成正多边形。
- 内容和位置自动保存，底栏显示保存状态及最近编辑时间。全屏按 Esc 退出。
- PNG 导出保留当前布局；JSON 用于备份和迁移。两种文件可分别设置默认导出位置。

作品只保存在本机。请定期备份完整书架 JSON；其中包含头像，但不包含本机布局坐标。安装包不包含你的作品。

## 从源码运行

技术栈：Vue 3、TypeScript、Cytoscape.js、Electron。开发需要 Node.js（本项目使用 24.x）。

```powershell
npm.cmd ci
npm.cmd run dev       # 浏览器开发模式
npm.cmd run desktop   # Electron 桌面模式
npm.cmd test          # 自动测试
npm.cmd run pack:release  # 生成 Windows 安装包
```

详细步骤见 [打包教程](docs/从源码打包安装包.md)，更新记录见 [CHANGELOG](CHANGELOG.md)。问题反馈请到 [Issues](https://github.com/Symplatt/zhiling/issues)。
