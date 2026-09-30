import { createHash } from "crypto";
import { execFile, type ChildProcess, type ExecFileException } from "child_process";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

const YOUDAO_URL = "https://dict.youdao.com/jsonapi_s?doctype=json&jsonversion=4";
const YOUDAO_KEY = "Mk6hqtUp33DGGtoS63tTJbMUYjRrG1Lu";
const ENGLISH_WORD = /^[A-Za-z]+(?:['’-][A-Za-z]+)*$/;

export type DictionarySense = { pos: string; meaning: string };
export type DictionaryForm = { name: string; value: string };
export type DictionaryPhrase = { headword: string; translation: string };
export type DictionaryExample = { source: string; translation: string };

export type DictionaryEntry = {
  word: string;
  usPhonetic?: string;
  ukPhonetic?: string;
  usAudio?: string;
  ukAudio?: string;
  senses: DictionarySense[];
  forms: DictionaryForm[];
  phrases: DictionaryPhrase[];
  examples: DictionaryExample[];
};

type JsonRecord = Record<string, unknown>;

let playing: ChildProcess | undefined;

export function isLexicalQuery(text: string): boolean {
  const value = text.trim();
  if (!value || value.length > 48) return false;
  const parts = value.split(/\s+/);
  return parts.length >= 1 && parts.length <= 3 && parts.every((part) => ENGLISH_WORD.test(part));
}

export function youdaoForm(text: string): Record<string, string> {
  const client = "web";
  const keyfrom = "webdict";
  const time = String((text + keyfrom).length % 10);
  const digest = md5(text + keyfrom);
  return {
    q: text,
    keyfrom,
    client,
    t: time,
    sign: md5(client + text + time + YOUDAO_KEY + digest),
  };
}

export function parseYoudao(data: unknown): DictionaryEntry | null {
  const root = asRecord(data);
  const word = asRecord(asRecord(root?.ec)?.word);
  const translations = Array.isArray(word?.trs) ? word.trs : [];
  if (!word || translations.length === 0) return null;

  const simple = firstRecord(asRecord(root?.simple)?.word);
  const senses = translations.flatMap((item) => {
    const record = asRecord(item);
    const meaning = plain(record?.tran);
    if (!meaning) return [];
    return [{ pos: plain(record?.pos), meaning }];
  });
  if (senses.length === 0) return null;

  const forms = (Array.isArray(word.wfs) ? word.wfs : []).flatMap((item) => {
    const form = asRecord(asRecord(item)?.wf);
    const name = plain(form?.name);
    const value = plain(form?.value);
    if (!name || !value) return [];
    return [{ name, value }];
  });
  const prototype = plain(word.prototype);
  if (prototype) forms.push({ name: "原形", value: prototype });

  return {
    word: plain(word.returnPhrase) || plain(simple?.["return-phrase"]) || plain(root?.input) || "",
    usPhonetic: plain(word.usphone) || plain(simple?.usphone) || undefined,
    ukPhonetic: plain(word.ukphone) || plain(simple?.ukphone) || undefined,
    usAudio: audioUrl(stringOf(word.usspeech) || stringOf(simple?.usspeech)),
    ukAudio: audioUrl(stringOf(word.ukspeech) || stringOf(simple?.ukspeech)),
    senses,
    forms,
    phrases: readPhrases(root).slice(0, 5),
    examples: readExamples(root).slice(0, 2),
  };
}

export function renderDictionary(entry: DictionaryEntry, translation: string): string {
  const lines: string[] = [];
  const title = entry.word || translation;
  if (title) lines.push(`# ${title}`, "");
  const phonetics = [
    entry.usPhonetic ? `美 /${entry.usPhonetic}/` : "",
    entry.ukPhonetic ? `英 /${entry.ukPhonetic}/` : "",
  ].filter(Boolean);
  if (phonetics.length > 0) lines.push(phonetics.join(" · "), "");

  lines.push("**释义**", "");
  for (const sense of entry.senses) {
    lines.push(`- ${sense.pos ? `${sense.pos} ` : ""}${sense.meaning}`);
  }

  if (entry.forms.length > 0) {
    lines.push("", "**变形**", "");
    for (const form of entry.forms) lines.push(`- ${form.name}：${form.value}`);
  }
  if (entry.examples.length > 0) {
    lines.push("", "**例句**", "");
    for (const example of entry.examples) {
      lines.push(`- ${example.source}`, `  ${example.translation}`);
    }
  }
  if (entry.phrases.length > 0) {
    lines.push("", "**词组**", "");
    for (const phrase of entry.phrases) lines.push(`- ${phrase.headword}：${phrase.translation}`);
  }
  if (translation.trim()) lines.push("", "**译文**", "", translation.trim());
  return lines.join("\n");
}

export async function lookupDictionary(text: string, fetcher: typeof fetch = fetch): Promise<DictionaryEntry | null> {
  const query = text.trim();
  try {
    const response = await fetcher(YOUDAO_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: "https://dict.youdao.com/",
        "User-Agent": "Mozilla/5.0",
      },
      body: new URLSearchParams(youdaoForm(query)),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const entry = parseYoudao(await response.json());
    if (entry && !entry.word) entry.word = query;
    return entry;
  } catch {
    return null;
  }
}

export async function playDictionaryAudio(url: string): Promise<void> {
  const response = await fetch(url, {
    headers: { Referer: "https://dict.youdao.com/", "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`发音下载失败（${response.status}）。`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 64) throw new Error("发音文件无效。");
  const directory = await mkdtemp(path.join(tmpdir(), "hy-mt-audio-"));
  const file = path.join(directory, "word.mp3");
  await writeFile(file, bytes);
  playing?.kill();
  await new Promise<void>((resolve, reject) => {
    playing = execFile("/usr/bin/afplay", [file], (error: ExecFileException | null) => {
      void rm(directory, { recursive: true, force: true });
      if (!error || error.killed) resolve();
      else reject(error);
    });
  });
}

function readPhrases(root: JsonRecord | undefined): DictionaryPhrase[] {
  const list = asRecord(root?.phrs)?.phrs;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    const record = asRecord(item);
    const headword = plain(record?.headword);
    const translation = plain(record?.translation);
    if (!headword || !translation) return [];
    return [{ headword, translation }];
  });
}

function readExamples(root: JsonRecord | undefined): DictionaryExample[] {
  const list = asRecord(root?.blng_sents_part)?.["sentence-pair"];
  if (!Array.isArray(list)) return [];
  const examples: DictionaryExample[] = [];
  for (const item of list) {
    if (examples.length >= 2) break;
    const record = asRecord(item);
    const source = stripBold(stringOf(record?.sentence) || stringOf(record?.["sentence-eng"]));
    const translation = stripBold(stringOf(record?.["sentence-translation"]));
    if (!source || !translation || source.length > 120) continue;
    examples.push({ source, translation });
  }
  return examples;
}

function audioUrl(speech: string): string | undefined {
  if (!speech) return undefined;
  if (speech.startsWith("http://") || speech.startsWith("https://")) return speech;
  return `https://dict.youdao.com/dictvoice?audio=${speech}`;
}

function md5(value: string): string {
  return createHash("md5").update(value).digest("hex");
}

function asRecord(value: unknown): JsonRecord | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as JsonRecord;
}

function firstRecord(value: unknown): JsonRecord | undefined {
  if (!Array.isArray(value)) return undefined;
  return asRecord(value[0]);
}

function stringOf(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function plain(value: unknown): string {
  return stringOf(value).replace(/\s+/g, " ").replaceAll("<", "〈").replaceAll(">", "〉").trim();
}

function stripBold(value: string): string {
  return plain(value.replace(/<\/?b>/gi, ""));
}
