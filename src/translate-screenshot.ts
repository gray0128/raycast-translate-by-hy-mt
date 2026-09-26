import { execFile } from "child_process";
import { promisify } from "util";
import { LaunchType, closeMainWindow, launchCommand, showHUD } from "@raycast/api";
import { errorMessage } from "./hy-mt";
import { OcrCancelled, prepareScreenCapture } from "./ocr";

const execFileAsync = promisify(execFile);

export default async function Command() {
  try {
    const capture = await prepareScreenCapture();
    await closeMainWindow();
    const text = await capture();
    const trimmed = text.trim();
    if (!trimmed) {
      await showHUD("截图里没有识别到文字。");
      return;
    }

    const isTinycast = typeof (globalThis as { __tinycast?: unknown }).__tinycast !== "undefined";

    if (isTinycast) {
      const url = `tinycast://extensions/translate-by-hy-mt/translate?arguments=${encodeURIComponent(
        JSON.stringify({ text: trimmed }),
      )}`;
      try {
        await execFileAsync("/usr/bin/open", [url]);
        return;
      } catch {
        // 唤起失败时回退到标准 launchCommand
      }
    }

    try {
      await launchCommand({
        name: "translate",
        type: LaunchType.UserInitiated,
        arguments: {
          text: trimmed,
        },
        context: {
          sourceText: trimmed,
        },
      });
    } catch (launchError) {
      if (isTinycast) throw launchError;
      const url = `raycast://extensions/gray0128/translate-by-hy-mt/translate?arguments=${encodeURIComponent(
        JSON.stringify({ text: trimmed }),
      )}`;
      await execFileAsync("/usr/bin/open", [url]);
    }
  } catch (error) {
    if (error instanceof OcrCancelled) return;
    const message = errorMessage(error);
    await showHUD(message.length > 80 ? `${message.slice(0, 80)}…` : message);
  }
}
