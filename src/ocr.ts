import { execFile } from "child_process";
import { existsSync } from "fs";
import { arch } from "os";
import path from "path";
import { promisify } from "util";
import { environment } from "@raycast/api";
import { interpretOcrStatus } from "./ocr-status";

const execFileAsync = promisify(execFile);

export class OcrCancelled extends Error {
  constructor() {
    super("已取消截图。");
    this.name = "OcrCancelled";
  }
}

export async function prepareScreenCapture(): Promise<() => Promise<string>> {
  const binary = await resolveOcrBinary();
  return () => runCapture(binary);
}

async function resolveOcrBinary(): Promise<string> {
  const bundled = path.join(environment.assetsPath, "ocr-tool");
  if (existsSync(bundled)) {
    return bundled;
  }
  const cached = path.join(environment.supportPath, "ocr-tool");
  if (existsSync(cached)) {
    return cached;
  }
  return compileOcrTool(path.join(environment.assetsPath, "ocr.swift"));
}

async function compileOcrTool(source: string): Promise<string> {
  if (!existsSync(source)) {
    throw new Error("扩展里没有文字识别源码。请重新安装扩展，或在项目目录运行 npm run build-ocr。");
  }
  const dest = path.join(environment.supportPath, "ocr-tool");
  const target = `${arch() === "arm64" ? "arm64" : "x86_64"}-apple-macosx13.0`;
  try {
    await execFileAsync("swiftc", ["-O", "-target", target, source, "-o", dest], { timeout: 180_000 });
    await execFileAsync("codesign", ["--force", "--sign", "-", dest]);
  } catch (error) {
    const detail = commandErrorText(error);
    throw new Error(
      detail.includes("swiftc") || detail.includes("ENOENT")
        ? "没有找到 swiftc。请安装 Xcode 命令行工具（xcode-select --install），或使用 GitHub Release 里已经编译好的扩展包。"
        : `文字识别工具编译失败。${detail}`,
    );
  }
  return dest;
}

async function runCapture(binary: string, allowCompileFallback = true): Promise<string> {
  try {
    const { stdout } = await execFileAsync(binary, ["capture"], { timeout: 180_000, maxBuffer: 2_000_000 });
    const result = interpretOcrStatus(0, stdout, "");
    if ("text" in result) return result.text;
    throw new Error("message" in result ? result.message : "截图里没有识别到文字。");
  } catch (error) {
    if (error instanceof OcrCancelled) throw error;
    const status = commandStatus(error);
    if (status === 2) throw new OcrCancelled();
    if (allowCompileFallback && isLaunchFailure(error)) {
      const compiled = await compileOcrTool(path.join(environment.assetsPath, "ocr.swift"));
      if (compiled === binary) {
        const interpreted = interpretOcrStatus(null, "", commandErrorText(error));
        throw new Error("message" in interpreted ? interpreted.message : "无法运行文字识别工具。");
      }
      return runCapture(compiled, false);
    }
    if (status == null && error instanceof Error && !("code" in (error as { code?: unknown }))) throw error;
    const result = interpretOcrStatus(status, commandStdout(error), commandErrorText(error));
    if ("cancelled" in result) throw new OcrCancelled();
    if ("text" in result) return result.text;
    throw new Error(result.message);
  }
}

function commandStatus(error: unknown): number | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "number" ? code : null;
}

function commandErrorText(error: unknown): string {
  if (!error || typeof error !== "object") return error instanceof Error ? error.message : "";
  const stderr = "stderr" in error ? String((error as { stderr?: unknown }).stderr ?? "") : "";
  if (stderr.trim()) return stderr.trim();
  return error instanceof Error ? error.message : "";
}

function commandStdout(error: unknown): string {
  if (!error || typeof error !== "object" || !("stdout" in error)) return "";
  return String((error as { stdout?: unknown }).stdout ?? "");
}

function isLaunchFailure(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  const code = String((error as { code?: unknown }).code);
  return code === "ENOENT" || code === "EACCES" || code === "ENOEXEC" || code === "EPERM";
}
