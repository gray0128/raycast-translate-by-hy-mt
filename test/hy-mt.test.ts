import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { interpretOcrStatus } from "../src/ocr-status";
import {
  LANGUAGE_OPTIONS,
  LESSON_SECTIONS,
  extractTranslation,
  prepareLesson,
  prepareRequest,
  readSettings,
  renderResult,
  resolveTarget,
} from "../src/hy-mt";

const root = path.join(__dirname, "..");

function settings(overrides: Record<string, unknown> = {}) {
  return readSettings({
    apiKey: "test-key",
    apiMode: "chat",
    model: "hy-mt2-plus",
    ...overrides,
  });
}

test("只有 API Key 时走官方基础翻译", () => {
  const prepared = prepareRequest(settings(), { text: "会议开始前请确认所有参会人员都收到了议程。", to: "en" });
  assert.ok(!("error" in prepared));
  if ("error" in prepared) return;
  assert.equal(prepared.url, "https://tokenhub.tencentmaas.com/v1/chat/completions");
  assert.equal(prepared.body.model, "hy-mt2-plus");
  assert.equal(prepared.body.temperature, undefined);
  const messages = prepared.body.messages as Array<{ content: string }>;
  assert.equal(
    messages[0].content,
    "将以下文本翻译为 英语，注意只需要输出翻译后的结果，不要额外解释：\n会议开始前请确认所有参会人员都收到了议程。",
  );
});

test("未填写 API Key 时拒绝翻译", () => {
  const prepared = prepareRequest(settings({ apiKey: " " }), { text: "你好", to: "en" });
  assert.ok("error" in prepared && prepared.error.type === "secretKey");
});

test("自部署根地址和可选参数只在填写后发送", () => {
  const prepared = prepareRequest(
    settings({
      baseUrl: "http://127.0.0.1:8000/v1/",
      temperature: "0",
      topP: "0.8",
      maxTokens: "128",
      extra: '{"seed":7,"model":"override"}',
    }),
    { text: "你好", to: "en" },
  );
  assert.ok(!("error" in prepared));
  if ("error" in prepared) return;
  assert.equal(prepared.url, "http://127.0.0.1:8000/v1/chat/completions");
  assert.equal(prepared.body.model, "override");
  assert.equal(prepared.body.temperature, 0);
  assert.equal(prepared.body.top_p, 0.8);
  assert.equal(prepared.body.max_tokens, 128);
  assert.equal(prepared.body.seed, 7);
});

test("多段文本、术语、背景和风格使用官方模板", () => {
  const paragraphs = prepareRequest(settings(), { text: "第一段\n第二段", to: "en" });
  assert.ok(!("error" in paragraphs));
  if ("error" in paragraphs) return;
  const content = (paragraphs.body.messages as Array<{ content: string }>)[0].content;
  assert.match(content, /保留等量的分隔符/);
  assert.match(content, /第一段<SEP>第二段/);

  const glossary = prepareRequest(settings({ glossary: "# 注释\n首播=premiere" }), { text: "首播", to: "en" });
  assert.ok(!("error" in glossary));
  if ("error" in glossary) return;
  assert.match((glossary.body.messages as Array<{ content: string }>)[0].content, /首播 翻译成 premiere/);
});

test("术语库接口发送文档字段，自动源语言省略 source", () => {
  const prepared = prepareRequest(settings({ apiMode: "translations", context: "电动汽车", glossaryIds: "g1, g2" }), {
    text: "续航",
    from: "zh-Hans",
    to: "en",
  });
  assert.ok(!("error" in prepared));
  if ("error" in prepared) return;
  assert.equal(prepared.url, "https://tokenhub.tencentmaas.com/v1/api/translations");
  assert.deepEqual(prepared.body, {
    model: "hy-mt2-plus",
    text: "续航",
    target: "en",
    source: "zh",
    context: "电动汽车",
    glossary_ids: ["g1", "g2"],
  });

  const detected = prepareRequest(settings({ apiMode: "translations" }), {
    text: "hello",
    from: "auto",
    to: "zh-Hans",
  });
  assert.ok(!("error" in detected));
  if ("error" in detected) return;
  assert.equal(detected.body.source, undefined);
  assert.equal(detected.body.target, "zh");
});

test("自动目标语言按文字判断", () => {
  assert.equal(resolveTarget("auto", "你好，世界"), "en");
  assert.equal(resolveTarget("auto", "Hello"), "zh-Hans");
  assert.equal(resolveTarget("ja", "Hello"), "ja");
});

test("译文解析和分隔符回传", () => {
  assert.equal(
    extractTranslation({ choices: [{ finish_reason: "stop", message: { content: "Hello" } }] }).text,
    "Hello",
  );
  assert.ok("error" in extractTranslation({ choices: [{ finish_reason: "sensitive", message: { content: "x" } }] }));
  assert.equal(renderResult("a <SEP> b", 2, true).text, "a\nb");
  assert.equal(renderResult("only", 2, true).format, "plain");
});

test("截图工具用退出码区分取消和没有文字", () => {
  assert.deepEqual(interpretOcrStatus(2, "", ""), { cancelled: true });
  assert.deepEqual(interpretOcrStatus(3, "", ""), { message: "截图里没有识别到文字。" });
  assert.deepEqual(interpretOcrStatus(0, " 你好 \n", ""), { text: "你好" });
  assert.match(interpretOcrStatus(1, "", "permission")?.message ?? "", /permission/);
});

test("学习模式以英语教师口吻覆盖指定知识点，并走对话补全", () => {
  const prepared = prepareLesson(settings({ apiMode: "translations", glossary: "议程=agenda" }), {
    source: "会议开始前请确认所有参会人员都收到了议程。",
    translation: "Please confirm that all attendees have received the agenda before the meeting starts.",
  });
  assert.ok(!("error" in prepared));
  if ("error" in prepared) return;
  assert.equal(prepared.url, "https://tokenhub.tencentmaas.com/v1/chat/completions");
  assert.equal(prepared.body.max_tokens, 2048);
  const content = (prepared.body.messages as Array<{ content: string }>)[0].content;
  assert.match(content, /英语教师/);
  assert.match(content, /不要只输出译文/);
  assert.match(content, /不要编造/);
  assert.match(content, /「其他表达方式」这一节只输出英文/);
  assert.match(content, /这一节不要写中文讲解或中文释义/);
  for (const section of LESSON_SECTIONS) assert.match(content, new RegExp(section));
  assert.match(content, /议程 翻译成 agenda/);
  assert.match(content, /Please confirm/);
});

test("配置项里只有 API Key 必填，语言都在模型支持范围内", () => {
  const info = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
    preferences: Array<{ name: string; required?: boolean; data?: Array<{ value: string }> }>;
    commands: Array<{ name: string; mode: string }>;
  };
  const required = info.preferences.filter((item) => item.required).map((item) => item.name);
  assert.deepEqual(required, ["apiKey"]);
  assert.deepEqual(
    info.commands.map((command) => `${command.name}:${command.mode}`),
    ["translate:view", "translate-screenshot:no-view"],
  );
  const target = info.preferences.find((item) => item.name === "targetLanguage");
  for (const choice of target?.data ?? []) {
    if (choice.value === "auto") continue;
    assert.equal(
      LANGUAGE_OPTIONS.some((language) => language.value === choice.value),
      true,
      choice.value,
    );
  }
});
