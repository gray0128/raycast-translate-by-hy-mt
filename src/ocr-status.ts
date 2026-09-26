export type OcrStatus = { text: string } | { cancelled: true } | { message: string };

export function interpretOcrStatus(status: number | null, stdout: string, stderr: string): OcrStatus {
  if (status === 2) return { cancelled: true };
  if (status === 0) {
    const text = stdout.replace(/^\s+|\s+$/g, "");
    if (!text) return { message: "截图里没有识别到文字。" };
    return { text };
  }
  if (status === 3) return { message: "截图里没有识别到文字。" };
  const detail = stderr.replace(/^\s+|\s+$/g, "");
  if (status == null) return { message: detail || "无法运行文字识别工具。请确认已经安装 Xcode 命令行工具。" };
  return { message: detail || "截图或文字识别失败。请在系统设置中允许屏幕录制后再试。" };
}
