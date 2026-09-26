export const DEFAULT_BASE_URL = "https://tokenhub.tencentmaas.com/v1";
export const DEFAULT_MODEL = "hy-mt2-plus";
export const SEPARATOR = "<SEP>";

export type Language = { code: string; name: string };

export const LANGUAGES: Record<string, Language> = {
  "zh-Hans": { code: "zh", name: "简体中文" },
  "zh-Hant": { code: "zh-TR", name: "繁体中文" },
  en: { code: "en", name: "英语" },
  fr: { code: "fr", name: "法语" },
  pt: { code: "pt", name: "葡萄牙语" },
  "pt-pt": { code: "pt", name: "葡萄牙语" },
  "pt-br": { code: "pt", name: "葡萄牙语" },
  es: { code: "es", name: "西班牙语" },
  ja: { code: "ja", name: "日语" },
  tr: { code: "tr", name: "土耳其语" },
  ru: { code: "ru", name: "俄语" },
  ar: { code: "ar", name: "阿拉伯语" },
  ko: { code: "ko", name: "韩语" },
  th: { code: "th", name: "泰语" },
  it: { code: "it", name: "意大利语" },
  de: { code: "de", name: "德语" },
  vi: { code: "vi", name: "越南语" },
  ms: { code: "ms", name: "马来语" },
  id: { code: "id", name: "印尼语" },
  fil: { code: "fil", name: "菲律宾语" },
  tl: { code: "fil", name: "菲律宾语" },
  hi: { code: "hi", name: "印地语" },
  pl: { code: "pl", name: "波兰语" },
  cs: { code: "cs", name: "捷克语" },
  nl: { code: "nl", name: "荷兰语" },
  km: { code: "km", name: "高棉语" },
  my: { code: "my", name: "缅甸语" },
  fa: { code: "fa", name: "波斯语" },
  gu: { code: "gu", name: "古吉拉特语" },
  ur: { code: "ur", name: "乌尔都语" },
  te: { code: "te", name: "泰卢固语" },
  mr: { code: "mr", name: "马拉地语" },
  he: { code: "he", name: "希伯来语" },
  bn: { code: "bn", name: "孟加拉语" },
  ta: { code: "ta", name: "泰米尔语" },
  uk: { code: "uk", name: "乌克兰语" },
  bo: { code: "bo", name: "藏语" },
  kk: { code: "kk", name: "哈萨克语" },
  mn: { code: "mn", name: "蒙古语" },
  ug: { code: "ug", name: "维吾尔语" },
  yue: { code: "yue", name: "粤语" },
};

export const LANGUAGE_OPTIONS: Array<{ value: string; title: string }> = [
  { value: "zh-Hans", title: "简体中文" },
  { value: "zh-Hant", title: "繁体中文" },
  { value: "en", title: "英语" },
  { value: "ja", title: "日语" },
  { value: "ko", title: "韩语" },
  { value: "fr", title: "法语" },
  { value: "de", title: "德语" },
  { value: "es", title: "西班牙语" },
  { value: "pt", title: "葡萄牙语" },
  { value: "it", title: "意大利语" },
  { value: "ru", title: "俄语" },
  { value: "ar", title: "阿拉伯语" },
  { value: "th", title: "泰语" },
  { value: "vi", title: "越南语" },
  { value: "id", title: "印尼语" },
  { value: "ms", title: "马来语" },
  { value: "fil", title: "菲律宾语" },
  { value: "hi", title: "印地语" },
  { value: "pl", title: "波兰语" },
  { value: "cs", title: "捷克语" },
  { value: "nl", title: "荷兰语" },
  { value: "tr", title: "土耳其语" },
  { value: "uk", title: "乌克兰语" },
  { value: "yue", title: "粤语" },
  { value: "bo", title: "藏语" },
  { value: "kk", title: "哈萨克语" },
  { value: "mn", title: "蒙古语" },
  { value: "ug", title: "维吾尔语" },
  { value: "km", title: "高棉语" },
  { value: "my", title: "缅甸语" },
  { value: "fa", title: "波斯语" },
  { value: "gu", title: "古吉拉特语" },
  { value: "ur", title: "乌尔都语" },
  { value: "te", title: "泰卢固语" },
  { value: "mr", title: "马拉地语" },
  { value: "he", title: "希伯来语" },
  { value: "bn", title: "孟加拉语" },
  { value: "ta", title: "泰米尔语" },
];

export type FieldError = { type: string; message: string };

export type Settings = {
  apiKey: string;
  baseUrl: string;
  apiMode: string;
  model: string;
  sourceLanguage: string;
  targetLanguage: string;
  readSelection: boolean;
  primaryAction: string;
  context: string;
  glossary: string;
  glossaryIds: string;
  style: string;
  prompt: string;
  temperature: string;
  topP: string;
  maxTokens: string;
  extra: string;
  timeout: string;
};

export type PreparedRequest = {
  url: string;
  body: Record<string, unknown>;
  timeout: number;
  apiKey: string;
  useSeparator: boolean;
  segmentCount: number;
  target: string;
  targetName: string;
};

type RawOption = Record<string, unknown>;

export function readSettings(option: RawOption = {}): Settings {
  return {
    apiKey: trim(option.apiKey),
    baseUrl: trim(option.baseUrl),
    apiMode: trim(option.apiMode) || "chat",
    model: trim(option.model) || DEFAULT_MODEL,
    sourceLanguage: trim(option.sourceLanguage) || "auto",
    targetLanguage: trim(option.targetLanguage) || "auto",
    readSelection: option.readSelection !== false && option.readSelection !== "0" && option.readSelection !== 0,
    primaryAction: trim(option.primaryAction) || "copy",
    context: trim(option.context),
    glossary: option.glossary == null ? "" : String(option.glossary),
    glossaryIds: option.glossaryIds == null ? "" : String(option.glossaryIds),
    style: trim(option.style),
    prompt: option.prompt == null ? "" : String(option.prompt),
    temperature: trim(option.temperature),
    topP: trim(option.topP),
    maxTokens: trim(option.maxTokens),
    extra: option.extra == null ? "" : String(option.extra),
    timeout: trim(option.timeout),
  };
}

export function resolveTarget(preference: string, text: string): string {
  if (preference && preference !== "auto") return preference;
  const cjk = text.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const latin = text.match(/[A-Za-z]/g)?.length ?? 0;
  return cjk > 0 && cjk >= latin ? "en" : "zh-Hans";
}

export function prepareRequest(
  settings: Settings,
  input: { text: string; from?: string; to: string },
): { error: FieldError } | PreparedRequest {
  if (!settings.apiKey) {
    return {
      error: {
        type: "secretKey",
        message: "未填写 API Key。请在扩展配置中填写腾讯云 TokenHub 的密钥后再翻译。",
      },
    };
  }
  if (settings.apiMode !== "chat" && settings.apiMode !== "translations") {
    return { error: { type: "param", message: "调用方式无效。请选择「对话补全」或「术语库接口」。" } };
  }

  const endpoint = resolveEndpoint(settings.baseUrl, settings.apiMode);
  if ("error" in endpoint) return endpoint;

  const targetCode = languageOf(input.to);
  if (!targetCode) {
    return { error: { type: "unsupportedLanguage", message: `不支持的目标语言：${input.to || "未指定"}。` } };
  }
  const sourceCode = languageOf(input.from);
  const text = input.text ?? "";
  if (!trim(text)) return { error: { type: "param", message: "没有需要翻译的文本。" } };

  const extra = parseExtra(settings.extra);
  if ("error" in extra) return extra;
  const temperature = parseNumber(settings.temperature, "Temperature", { min: 0 });
  if ("error" in temperature) return temperature;
  const topP = parseNumber(settings.topP, "Top P", { min: 0, max: 1 });
  if ("error" in topP) return topP;
  const maxTokens = parseInteger(settings.maxTokens, "Max Tokens", { min: 1 });
  if ("error" in maxTokens) return maxTokens;
  const timeout = resolveTimeout(settings.timeout);
  if ("error" in timeout) return timeout;
  const glossary = parseGlossary(settings.glossary);
  if ("error" in glossary) return glossary;
  const glossaryIds = parseIdList(settings.glossaryIds, 10);
  if ("error" in glossaryIds) return glossaryIds;

  const segments = splitSegments(text);
  const useSeparator = settings.apiMode === "chat" && segments.length > 1 && !containsSeparator(segments);
  const sourceText = useSeparator ? segments.join(SEPARATOR) : text;
  const body: Record<string, unknown> =
    settings.apiMode === "translations"
      ? {
          model: settings.model,
          text,
          target: targetCode.code,
          ...(sourceCode ? { source: sourceCode.code } : {}),
          ...(settings.context ? { context: settings.context } : {}),
          ...(glossaryIds.ids.length ? { glossary_ids: glossaryIds.ids } : {}),
        }
      : {
          model: settings.model,
          messages: [
            {
              role: "user",
              content: buildChatContent({
                targetName: targetCode.name,
                sourceName: sourceCode?.name ?? "",
                sourceText,
                context: settings.context,
                glossaryPairs: glossary.pairs,
                style: settings.style,
                customPrompt: trim(settings.prompt),
                useSeparator,
              }),
            },
          ],
        };

  if ("value" in temperature && temperature.set) body.temperature = temperature.value;
  if ("value" in topP && topP.set) body.top_p = topP.value;
  if ("value" in maxTokens && maxTokens.set) body.max_tokens = maxTokens.value;
  if (extra.value) Object.assign(body, extra.value);

  return {
    url: endpoint.url,
    body,
    timeout: timeout.value,
    apiKey: settings.apiKey,
    useSeparator,
    segmentCount: useSeparator ? segments.length : 1,
    target: input.to,
    targetName: targetCode.name,
  };
}

export const LESSON_SECTIONS = ["句式", "语法", "固定结构", "核心词汇", "典故", "其他表达方式"] as const;

export function buildLessonPrompt(input: {
  source: string;
  translation?: string;
  context?: string;
  glossaryText?: string;
}): string {
  const parts = [
    "你是一位英语教师。请用简体中文讲解下面的内容，帮助学习者理解相关的英语知识。不要只输出译文。",
    "请使用 Markdown，并依次写出以下标题。除「其他表达方式」外，每一项都用简体中文结合原文说明；某一项在内容里确实没有时，用一句话写明没有，不要编造：",
    LESSON_SECTIONS.map((section) => `- ${section}`).join("\n"),
    "「其他表达方式」这一节只输出英文，每行一条可以替换原文意思的英文说法。这一节不要写中文讲解或中文释义。",
    "其他标题里的英语例句和词块保留英文，并给出简体中文释义。",
  ];
  if (trim(input.context)) parts.push(`背景信息：\n${input.context}`);
  if (trim(input.glossaryText)) parts.push(`术语对照，讲解时沿用这些译法：\n${input.glossaryText}`);
  parts.push(`原文：\n${input.source}`);
  if (trim(input.translation)) parts.push(`已有译文，仅供对照：\n${input.translation}`);
  return parts.join("\n\n");
}

export function prepareLesson(
  settings: Settings,
  input: { source: string; translation?: string },
): { error: FieldError } | PreparedRequest {
  if (!settings.apiKey) {
    return {
      error: {
        type: "secretKey",
        message: "未填写 API Key。请在扩展配置中填写腾讯云 TokenHub 的密钥后再讲解。",
      },
    };
  }
  const endpoint = resolveEndpoint(settings.baseUrl, "chat");
  if ("error" in endpoint) return endpoint;
  const source = trim(input.source);
  if (!source) return { error: { type: "param", message: "没有需要讲解的内容。" } };

  const extra = parseExtra(settings.extra);
  if ("error" in extra) return extra;
  const temperature = parseNumber(settings.temperature, "Temperature", { min: 0 });
  if ("error" in temperature) return temperature;
  const topP = parseNumber(settings.topP, "Top P", { min: 0, max: 1 });
  if ("error" in topP) return topP;
  const maxTokens = parseInteger(settings.maxTokens, "Max Tokens", { min: 1 });
  if ("error" in maxTokens) return maxTokens;
  const timeout = resolveTimeout(settings.timeout);
  if ("error" in timeout) return timeout;
  const glossary = parseGlossary(settings.glossary);
  if ("error" in glossary) return glossary;

  const body: Record<string, unknown> = {
    model: settings.model,
    messages: [
      {
        role: "user",
        content: buildLessonPrompt({
          source,
          translation: input.translation,
          context: settings.context,
          glossaryText: glossary.pairs.map((pair) => `${pair.source} 翻译成 ${pair.target}`).join("\n"),
        }),
      },
    ],
  };
  if ("value" in temperature && temperature.set) body.temperature = temperature.value;
  if ("value" in topP && topP.set) body.top_p = topP.value;
  body.max_tokens = "value" in maxTokens && maxTokens.set ? maxTokens.value : 2048;
  if (extra.value) Object.assign(body, extra.value);

  return {
    url: endpoint.url,
    body,
    timeout: timeout.value,
    apiKey: settings.apiKey,
    useSeparator: false,
    segmentCount: 1,
    target: "zh-Hans",
    targetName: "学习模式",
  };
}

export async function explainText(settings: Settings, source: string, translation?: string): Promise<string> {
  const prepared = prepareLesson(settings, { source, translation });
  if ("error" in prepared) throw new Error(prepared.error.message);
  const data = await postJson(prepared);
  const extracted = extractTranslation(data);
  if ("error" in extracted) throw new Error(extracted.error.message);
  return trim(extracted.text);
}

export async function translateText(
  settings: Settings,
  text: string,
  targetOverride?: string,
): Promise<{ text: string; target: string; targetName: string }> {
  const target =
    targetOverride && targetOverride !== "auto" ? targetOverride : resolveTarget(settings.targetLanguage, text);
  const prepared = prepareRequest(settings, { text, from: settings.sourceLanguage, to: target });
  if ("error" in prepared) throw new Error(prepared.error.message);

  const data = await postJson(prepared);
  const extracted = extractTranslation(data);
  if ("error" in extracted) throw new Error(extracted.error.message);
  const rendered = renderResult(extracted.text, prepared.segmentCount, prepared.useSeparator);
  return { text: rendered.text, target: prepared.target, targetName: prepared.targetName };
}

export function resolveEndpoint(baseUrl: string, apiMode: string): { url: string } | { error: FieldError } {
  let base = trim(baseUrl) || DEFAULT_BASE_URL;
  base = base.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(base)) {
    return {
      error: { type: "param", message: "接口根地址需要以 http:// 或 https:// 开头。留空则使用腾讯云 TokenHub。" },
    };
  }
  const chatSuffix = "/chat/completions";
  const translationSuffix = "/api/translations";
  if (apiMode === "translations") {
    if (base.endsWith(translationSuffix)) return { url: base };
    if (base.endsWith(chatSuffix)) base = base.slice(0, -chatSuffix.length);
    return { url: base + translationSuffix };
  }
  if (base.endsWith(chatSuffix)) return { url: base };
  if (base.endsWith(translationSuffix)) base = base.slice(0, -translationSuffix.length);
  return { url: base + chatSuffix };
}

export function buildChatContent(options: {
  targetName: string;
  sourceName?: string;
  sourceText: string;
  context?: string;
  glossaryPairs?: Array<{ source: string; target: string }>;
  style?: string;
  customPrompt?: string;
  useSeparator?: boolean;
}): string {
  const glossaryText = formatGlossary(options.glossaryPairs ?? []);
  if (options.customPrompt) {
    return fillTemplate(options.customPrompt, {
      target_lang: options.targetName,
      source_lang: options.sourceName ?? "",
      source_text: options.sourceText,
      context: options.context ?? "",
      glossary: glossaryText,
      style: options.style ?? "",
    });
  }

  const hasGlossary = glossaryText.length > 0;
  const hasContext = Boolean(options.context);
  const hasStyle = Boolean(options.style);
  const useSeparator = Boolean(options.useSeparator);
  const target = options.targetName;
  const source = options.sourceText;

  if (!hasGlossary && !hasContext && !hasStyle && !useSeparator) {
    return `将以下文本翻译为 ${target}，注意只需要输出翻译后的结果，不要额外解释：\n${source}`;
  }
  if (!hasGlossary && !hasContext && !hasStyle && useSeparator) {
    return `请将以下文本准确翻译为 ${target}。你必须在译文中保留等量的分隔符，绝对不可遗漏、转义或翻译该符号，并注意分隔符的位置。\n${source}`;
  }
  if (!hasGlossary && hasContext && !hasStyle && !useSeparator) {
    return `【背景信息】\n${options.context}\n请结合背景信息将以下文本翻译为 ${target}。\n【待翻译文本】\n${source}`;
  }
  if (hasGlossary && !hasContext && !hasStyle && !useSeparator) {
    return `参考下面的翻译：\n${glossaryText}\n将以下文本翻译为 ${target}，注意只需要输出翻译后的结果，不要额外解释：\n${source}`;
  }
  if (!hasGlossary && !hasContext && hasStyle && !useSeparator) {
    return `请将以下文本翻译为 ${target}。注意翻译的风格要严格符合【${options.style}】\n${source}`;
  }

  const parts: string[] = [];
  if (hasGlossary) parts.push(`参考下面的翻译：\n${glossaryText}`);
  if (hasContext) parts.push(`【背景信息】\n${options.context}`);
  let instruction = `将以下文本翻译为 ${target}，注意只需要输出翻译后的结果，不要额外解释。`;
  if (hasStyle) instruction += `\n注意翻译的风格要严格符合【${options.style}】`;
  if (useSeparator) {
    instruction += "\n你必须在译文中保留等量的分隔符，绝对不可遗漏、转义或翻译该符号，并注意分隔符的位置。";
  }
  parts.push(instruction);
  if (hasContext) parts.push("【待翻译文本】");
  parts.push(source);
  return parts.join("\n");
}

export function parseGlossary(
  text: string,
): { pairs: Array<{ source: string; target: string }> } | { error: FieldError } {
  const pairs: Array<{ source: string; target: string }> = [];
  const lines = String(text || "").split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = trim(lines[i]);
    if (!line || line.startsWith("#")) continue;
    const matched = line.match(/^(.+?)(?:\s*(?:=>|->|→|=)\s*|\t)(.+)$/);
    if (!matched) {
      return {
        error: {
          type: "param",
          message: `术语表第 ${i + 1} 行无法解析。每行使用「原文=译文」，也可用「=>」「→」或制表符分隔。`,
        },
      };
    }
    const source = trim(matched[1]);
    const target = trim(matched[2]);
    if (!source || !target) {
      return { error: { type: "param", message: `术语表第 ${i + 1} 行的原文和译文都不能为空。` } };
    }
    pairs.push({ source, target });
  }
  return { pairs };
}

export function parseIdList(text: string, limit: number): { ids: string[] } | { error: FieldError } {
  const ids = String(text || "")
    .split(/[\s,，]+/)
    .map((item) => trim(item))
    .filter(Boolean);
  if (ids.length > limit) {
    return { error: { type: "param", message: `术语库 ID 最多 ${limit} 个，当前填写了 ${ids.length} 个。` } };
  }
  return { ids };
}

export function parseExtra(text: string): { value: Record<string, unknown> | null } | { error: FieldError } {
  const source = trim(text);
  if (!source) return { value: null };
  try {
    const parsed: unknown = JSON.parse(source);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: { type: "param", message: '其他参数需要是 JSON 对象，例如 {"seed": 1}。留空表示不附加参数。' } };
    }
    return { value: parsed as Record<string, unknown> };
  } catch {
    return { error: { type: "param", message: "其他参数不是合法的 JSON。请检查括号和引号，或先留空。" } };
  }
}

export function extractTranslation(data: unknown): { text: string } | { error: FieldError } {
  if (data == null || data === "") {
    return { error: { type: "api", message: "接口没有返回内容。请检查模型名和接口根地址。" } };
  }
  let payload: unknown = data;
  if (typeof data === "string") {
    try {
      payload = JSON.parse(data) as unknown;
    } catch {
      return { error: { type: "api", message: "接口返回的不是 JSON。" } };
    }
  }
  if (!payload || typeof payload !== "object") {
    return { error: { type: "api", message: "接口返回的不是 JSON 对象。" } };
  }
  const record = payload as { error?: { message?: string; code?: string }; choices?: Array<Record<string, unknown>> };
  if (record.error) {
    return { error: { type: "api", message: String(record.error.message || record.error.code || "接口返回错误。") } };
  }
  const choice = record.choices?.[0];
  if (!choice) return { error: { type: "api", message: "接口没有返回译文。" } };
  if (choice.finish_reason === "sensitive") return { error: { type: "api", message: "译文未通过内容审核。" } };
  const message = choice.message as { content?: unknown } | undefined;
  const content = typeof message?.content === "string" ? message.content : "";
  if (!trim(content)) return { error: { type: "api", message: "接口返回了空译文。" } };
  return { text: content };
}

export function renderResult(
  rawText: string,
  segmentCount: number,
  useSeparator: boolean,
): { format: "plain" | "lines"; text: string } {
  const text = trim(rawText);
  if (!useSeparator) return { format: "plain", text };
  const parts = text.split(SEPARATOR);
  if (parts.length === segmentCount) return { format: "lines", text: parts.map((part) => trim(part)).join("\n") };
  return { format: "plain", text: parts.join("\n") };
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "翻译失败。";
}

async function postJson(prepared: PreparedRequest): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), prepared.timeout * 1000);
  try {
    const response = await fetch(prepared.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${prepared.apiKey}`,
      },
      body: JSON.stringify(prepared.body),
      signal: controller.signal,
    });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const serverMessage = readServerMessage(data);
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `API Key 被拒绝（HTTP ${response.status}）。请核对密钥，以及接口根地址是否对应该密钥。${serverMessage ? ` ${serverMessage}` : ""}`,
        );
      }
      throw new Error(
        `接口返回 HTTP ${response.status}。请检查 API Key、接口根地址和模型名。${serverMessage ? ` ${serverMessage}` : ""}`,
      );
    }
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`请求超时（${prepared.timeout} 秒）。可以在配置里调高请求超时。`);
    }
    if (error instanceof Error && /HTTP|API Key|请求超时/.test(error.message)) throw error;
    throw new Error("网络请求失败。请检查接口根地址、本机网络或代理。");
  } finally {
    clearTimeout(timer);
  }
}

function readServerMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const error = (data as { error?: { message?: string; code?: string } }).error;
  return String(error?.message || error?.code || "");
}

function formatGlossary(pairs: Array<{ source: string; target: string }>): string {
  return pairs.map((pair) => `${pair.source} 翻译成 ${pair.target}`).join("\n");
}

function fillTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.split(`{${key}}`).join(value), template);
}

function parseNumber(
  text: string,
  name: string,
  bounds: { min?: number; max?: number },
): { set: false } | { set: true; value: number } | { error: FieldError } {
  if (!text) return { set: false };
  const value = Number(text);
  if (!Number.isFinite(value))
    return { error: { type: "param", message: `${name} 需要是数字。不需要该参数时请留空。` } };
  if (bounds.min != null && value < bounds.min)
    return { error: { type: "param", message: `${name} 不能小于 ${bounds.min}。` } };
  if (bounds.max != null && value > bounds.max)
    return { error: { type: "param", message: `${name} 不能大于 ${bounds.max}。` } };
  return { set: true, value };
}

function parseInteger(
  text: string,
  name: string,
  bounds: { min?: number },
): { set: false } | { set: true; value: number } | { error: FieldError } {
  if (!text) return { set: false };
  if (!/^\d+$/.test(text)) return { error: { type: "param", message: `${name} 需要是正整数。不需要该参数时请留空。` } };
  const value = Number.parseInt(text, 10);
  if (bounds.min != null && value < bounds.min)
    return { error: { type: "param", message: `${name} 不能小于 ${bounds.min}。` } };
  return { set: true, value };
}

function resolveTimeout(text: string): { value: number } | { error: FieldError } {
  if (!text) return { value: 60 };
  const parsed = parseInteger(text, "请求超时", { min: 30 });
  if ("error" in parsed) return parsed;
  if ("value" in parsed && parsed.value > 300)
    return { error: { type: "param", message: "请求超时不能大于 300 秒。" } };
  return { value: "value" in parsed ? parsed.value : 60 };
}

function splitSegments(text: string): string[] {
  const segments = text
    .split(/\r?\n/)
    .map((line) => trim(line))
    .filter(Boolean);
  return segments.length ? segments : [text];
}

function containsSeparator(segments: string[]): boolean {
  return segments.some((segment) => segment.includes(SEPARATOR));
}

function languageOf(code: string | undefined): Language | null {
  if (!code || code === "auto") return null;
  return LANGUAGES[code] ?? null;
}

function trim(value: unknown): string {
  if (value == null) return "";
  return String(value).replace(/^\s+|\s+$/g, "");
}
