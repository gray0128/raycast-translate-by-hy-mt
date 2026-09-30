export const EUDIC_ADD_URL = "https://api.frdic.com/api/open/v1/studylist/words";
export const EUDIC_BOOKS_URL = "https://api.frdic.com/api/open/v1/studylist/category?language=en";

export type EudicBook = { id: string; name: string };

export type EudicResult = { ok: true } | { ok: false; message: string; books?: EudicBook[] };

export function eudicAddBody(bookId: string, word: string): { id: string; language: "en"; words: string[] } {
  return { id: bookId.trim(), language: "en", words: [word.trim()] };
}

export function parseEudicBooks(payload: unknown): EudicBook[] {
  const listed = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)
      ? (payload as { data: unknown[] }).data
      : [];
  const books: EudicBook[] = [];
  for (const item of listed) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const id = record.id == null ? "" : String(record.id).trim();
    const name = [record.name, record.title, record.bookName, record.book_name].find(
      (value) => typeof value === "string" && value.trim(),
    );
    if (!id || typeof name !== "string") continue;
    books.push({ id, name: name.trim() });
  }
  return books;
}

export function formatEudicBooks(books: EudicBook[]): string {
  const text = books
    .slice(0, 8)
    .map((book) => `${book.name} ${book.id}`)
    .join("；");
  return text.length > 160 ? `${text.slice(0, 160)}…` : text;
}

export async function listEudicBooks(token: string, fetcher: typeof fetch = fetch): Promise<EudicBook[]> {
  const response = await fetcher(EUDIC_BOOKS_URL, {
    headers: eudicHeaders(token),
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error("欧路授权无效或已过期。请在欧路账户管理重新获取。");
  }
  if (!response.ok) throw new Error(`欧路单词本返回 ${response.status}。`);
  return parseEudicBooks(await response.json());
}

export async function saveEudicWord(
  token: string,
  bookId: string,
  word: string,
  fetcher: typeof fetch = fetch,
): Promise<EudicResult> {
  const authorization = token.trim();
  const text = word.trim();
  if (!authorization) {
    return { ok: false, message: "未填写欧路授权。请在欧路账户管理复制 Authorization，再填入扩展配置。" };
  }
  if (!text) return { ok: false, message: "没有可以收藏的单词。" };

  const id = bookId.trim();
  if (!id) {
    try {
      const books = await listEudicBooks(authorization, fetcher);
      const summary = formatEudicBooks(books);
      return {
        ok: false,
        books,
        message: summary ? `未填写欧路单词本 ID。可选：${summary}` : "未填写欧路单词本 ID，且账号下没有英语单词本。",
      };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "无法获取欧路单词本。" };
    }
  }

  try {
    const response = await fetcher(EUDIC_ADD_URL, {
      method: "POST",
      headers: eudicHeaders(authorization),
      body: JSON.stringify(eudicAddBody(id, text)),
      signal: AbortSignal.timeout(15000),
    });
    if (response.status === 200 || response.status === 201) return { ok: true };
    if (response.status === 401 || response.status === 403) {
      return { ok: false, message: "欧路授权无效或已过期。请在欧路账户管理重新获取。" };
    }
    return { ok: false, message: (await readEudicError(response)) || `欧路单词本返回 ${response.status}。` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "无法连接欧路单词本。" };
  }
}

function eudicHeaders(token: string): Record<string, string> {
  return {
    Authorization: token.trim(),
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
  };
}

async function readEudicError(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object") return "";
    const record = payload as Record<string, unknown>;
    const message = record.message ?? record.msg ?? record.error;
    return typeof message === "string" ? message.trim() : "";
  } catch {
    return "";
  }
}
