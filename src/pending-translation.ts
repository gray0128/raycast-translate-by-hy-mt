export const PENDING_SCREENSHOT_TRANSLATION = "pending-screenshot-translation";

export type PendingTranslation = {
  sourceText: string;
  translation: string;
  target?: string;
};

export function translationCommandLink(owner: string, extensionName: string): string {
  return `raycast://extensions/${encodeURIComponent(owner)}/${encodeURIComponent(extensionName)}/translate`;
}

export function parsePendingTranslation(raw: string): PendingTranslation | undefined {
  try {
    const parsed = JSON.parse(raw) as Partial<PendingTranslation>;
    if (!parsed || typeof parsed.sourceText !== "string" || typeof parsed.translation !== "string") return undefined;
    if (!parsed.sourceText.trim() || !parsed.translation.trim()) return undefined;
    return {
      sourceText: parsed.sourceText,
      translation: parsed.translation,
      target: typeof parsed.target === "string" ? parsed.target : undefined,
    };
  } catch {
    return undefined;
  }
}
