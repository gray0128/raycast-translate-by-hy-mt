# 混元翻译 HY-MT2

Raycast 扩展，调用腾讯混元翻译模型 HY-MT2。Tinycast 可以直接运行同一套扩展。

支持两种入口：

- **翻译**：读取当前选中的文本并立即翻译。没有选中文本时手动输入。
- **截图翻译**：框选屏幕区域，本地识别文字后再翻译。

配置里只有 API Key 必填。

## 安装

### Raycast

```bash
npm install
npm run dev
```

Raycast 会导入这个目录。给「翻译」和「截图翻译」分别设置快捷键后，就可以在其他应用里直接调用。

### Tinycast

下载 [Releases](https://github.com/gray0128/raycast-translate-by-hy-mt/releases) 中的 `raycast-translate-by-hy-mt-1.1.0.zip`，解压后在 Tinycast 的「设置 → 扩展 → 从文件夹添加」里选择解压出的目录。

也可以在本机执行 `npm install` 和 `npm run build`，再添加生成的 `dist` 目录。Tinycast 从源码安装时会执行构建；截图识别需要本机有 Swift 编译器。

## 使用

1. 在任意应用里选中文字，运行「翻译」。扩展读取选区并显示译文。
2. 运行「截图翻译」，框选屏幕上的文字。识别使用 macOS Vision，在本机完成，然后把识别结果发给 HY-MT2。
3. 回车按配置执行复制或粘贴。也可以改目标语言、修改原文后重新翻译。
4. 在译文页面选择「学习模式」。扩展以英语教师的角色，用简体中文讲解当前原文的句式、语法、固定结构、核心词汇、典故和其他表达方式。已有译文只作为对照。选择「返回译文」回到翻译结果。没有依据的典故不会被写成既定事实。

选中文本需要辅助功能权限。截图需要屏幕录制权限。系统会在第一次使用时询问。

目标语言默认为自动：中文原文译成英语，其他原文译成简体中文。

## 配置

| 配置项                                              | 是否必填 | 说明                                                                         |
| --------------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| API Key                                             | 必填     | 腾讯云 TokenHub 的密钥。                                                     |
| 接口根地址                                          | 否       | 留空为 `https://tokenhub.tencentmaas.com/v1`。自部署填写 OpenAI 兼容根地址。 |
| 调用方式                                            | 否       | 默认对话补全。术语库接口只适用于 TokenHub。                                  |
| 模型                                                | 否       | 默认 `hy-mt2-plus`。                                                         |
| 源语言 / 目标语言                                   | 否       | 默认自动。                                                                   |
| 自动读取选中文本                                    | 否       | 默认开启。                                                                   |
| 背景信息、术语表、术语库 ID、译文风格、自定义提示词 | 否       | 与 HY-MT2 文档中的对应模板一致。                                             |
| Temperature / Top P / Max Tokens / 其他参数         | 否       | 填写后才发送。其他参数是 JSON 对象。                                         |
| 请求超时                                            | 否       | 30 到 300 秒，留空为 60 秒。                                                 |

对话补全请求 `POST {根地址}/chat/completions`。术语库接口请求 `POST {根地址}/api/translations`。

## 开发

```bash
npm test
npm run lint
npm run build
```

`npm run build` 会先编译 `assets/ocr.swift`，再打包扩展。GitHub Actions 在 macOS 运行同样的步骤，并把 `dist` 发布到 Release。

## 参考

- [Raycast 扩展文档](https://developers.raycast.com/)
- [Tinycast 扩展兼容性](https://tinycast.dev/docs/extensions/compatibility)
- [腾讯云混元调用指南](https://cloud.tencent.com/document/product/1823/132252)
