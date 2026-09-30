import assert from "node:assert/strict";
import test from "node:test";
import { isLexicalQuery, parseYoudao, renderDictionary, youdaoForm } from "../src/dictionary";
import {
  EUDIC_ADD_URL,
  EUDIC_BOOKS_URL,
  eudicAddBody,
  formatEudicBooks,
  parseEudicBooks,
  saveEudicWord,
} from "../src/eudic";
import { readSettings } from "../src/hy-mt";

test("英语单词和不超过三个词的词组才会查词典", () => {
  assert.equal(isLexicalQuery(" hello "), true);
  assert.equal(isLexicalQuery("well-known"), true);
  assert.equal(isLexicalQuery("don't"), true);
  assert.equal(isLexicalQuery("look up"), true);
  assert.equal(isLexicalQuery("take it off"), true);
  assert.equal(isLexicalQuery("a well known phrase"), false);
  assert.equal(isLexicalQuery("Hello, world"), false);
  assert.equal(isLexicalQuery("你好"), false);
  assert.equal(isLexicalQuery("see you."), false);
});

test("有道查词签名与网页端一致", () => {
  assert.deepEqual(youdaoForm("hello"), {
    q: "hello",
    keyfrom: "webdict",
    client: "web",
    t: "2",
    sign: "3c71569a04e3231adce6ef811c67148a",
  });
});

test("解析有道词典的音标、释义、变形、例句和词组", () => {
  const entry = parseYoudao({
    input: "hello",
    ec: {
      word: {
        usphone: "həˈloʊ",
        ukphone: "həˈləʊ",
        usspeech: "hello&type=2",
        ukspeech: "hello&type=1",
        trs: [{ pos: "int.", tran: "你好；<非正式>喂" }],
        wfs: [{ wf: { name: "复数", value: "hellos" } }],
      },
    },
    phrs: { phrs: [{ headword: "say hello", translation: "打招呼" }] },
    blng_sents_part: {
      "sentence-pair": [
        {
          sentence: "Say <b>hello</b>.",
          "sentence-translation": "打个招呼。",
        },
        {
          sentence: "x".repeat(121),
          "sentence-translation": "太长",
        },
      ],
    },
  });
  assert.ok(entry);
  assert.equal(entry?.usPhonetic, "həˈloʊ");
  assert.equal(entry?.ukAudio, "https://dict.youdao.com/dictvoice?audio=hello&type=1");
  assert.equal(entry?.senses[0].meaning, "你好；〈非正式〉喂");
  assert.deepEqual(entry?.forms, [{ name: "复数", value: "hellos" }]);
  assert.deepEqual(entry?.examples, [{ source: "Say hello.", translation: "打个招呼。" }]);
  assert.equal(renderDictionary(entry, "你好").includes("**译文**"), true);
  assert.equal(renderDictionary(entry, "你好").includes("美 /həˈloʊ/"), true);
});

test("没有词典词条时不编造释义", () => {
  assert.equal(parseYoudao({ fanyi: { tran: "你好" } }), null);
  assert.equal(parseYoudao(null), null);
});

test("欧路收藏请求体和单词本列表", () => {
  assert.deepEqual(eudicAddBody(" 0 ", " hello "), { id: "0", language: "en", words: ["hello"] });
  assert.deepEqual(
    parseEudicBooks({ data: [{ id: 0, name: "生词本" }, { id: "8", title: "六级" }, { name: "缺 ID" }] }),
    [
      { id: "0", name: "生词本" },
      { id: "8", name: "六级" },
    ],
  );
  assert.equal(formatEudicBooks([{ id: "0", name: "生词本" }]), "生词本 0");
});

test("欧路收藏调用开放接口，缺少单词本 ID 时先列出单词本", async () => {
  const calls: string[] = [];
  const fetcher = (async (url: string | URL | Request, init?: RequestInit) => {
    const target = String(url);
    calls.push(`${init?.method ?? "GET"} ${target}`);
    if (target === EUDIC_BOOKS_URL) {
      return new Response(JSON.stringify({ data: [{ id: "0", name: "生词本" }] }), { status: 200 });
    }
    assert.equal(init?.body, JSON.stringify({ id: "0", language: "en", words: ["hello"] }));
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("Authorization"), "token");
    return new Response("{}", { status: 201 });
  }) as typeof fetch;

  const saved = await saveEudicWord("token", "0", "hello", fetcher);
  assert.equal(saved.ok, true);
  assert.deepEqual(calls, [`POST ${EUDIC_ADD_URL}`]);

  const missing = await saveEudicWord("token", "", "hello", fetcher);
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.match(missing.message, /生词本 0/);
});

test("词典和欧路配置有默认值", () => {
  const defaults = readSettings({ apiKey: "k" });
  assert.equal(defaults.dictionary, true);
  assert.equal(defaults.autoSaveWord, false);
  assert.equal(defaults.eudicToken, "");
  const enabled = readSettings({
    apiKey: "k",
    dictionary: false,
    autoSaveWord: "1",
    eudicToken: " token ",
    eudicBookId: " 12 ",
  });
  assert.equal(enabled.dictionary, false);
  assert.equal(enabled.autoSaveWord, true);
  assert.equal(enabled.eudicToken, "token");
  assert.equal(enabled.eudicBookId, "12");
});
