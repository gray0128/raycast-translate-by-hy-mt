import { LaunchType, closeMainWindow, launchCommand, showHUD } from "@raycast/api";
import { errorMessage } from "./hy-mt";
import { OcrCancelled, prepareScreenCapture } from "./ocr";

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
  } catch (error) {
    if (error instanceof OcrCancelled) return;
    const message = errorMessage(error);
    await showHUD(message.length > 80 ? `${message.slice(0, 80)}…` : message);
  }
}
