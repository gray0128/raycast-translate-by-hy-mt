# 配置 API Key

在腾讯云 TokenHub 创建密钥，粘贴到 API Key。

接口根地址、模型和其他参数可以不填。留空时使用 `https://tokenhub.tencentmaas.com/v1` 和 `hy-mt2-plus`。

自部署服务填写 OpenAI 兼容根地址，通常以 `/v1` 结尾。调用方式保持「对话补全」。

说明见 [混元调用指南](https://cloud.tencent.com/document/product/1823/132252)。

## 单词释义和欧路单词本

英语单词，或不超过 3 个词的英语词组，会额外显示音标、词性和释义，并可以播放美式或英式发音。句子只显示译文。

收藏到欧路需要两项配置：

1. 在 [欧路开放平台](https://my.eudic.net/OpenAPI/Authorization) 登录后，复制 Authorization，填入「欧路授权」。
2. 填写「欧路单词本 ID」。不知道 ID 时先留空，翻译一个英语单词后选择「查看欧路单词本」。

「自动收藏」默认关闭。关闭时，在单词结果页选择「收藏到欧路」。
