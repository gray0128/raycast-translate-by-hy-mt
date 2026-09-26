import {
  Clipboard,
  LaunchType,
  Toast,
  closeMainWindow,
  getPreferenceValues,
  launchCommand,
  showHUD,
  showToast,
} from "@raycast/api";
import { errorMessage, readSettings, translateText } from "./hy-mt";
import { OcrCancelled, prepareScreenCapture } from "./ocr";

export default async function Command() {
  try {
    await showToast({ style: Toast.Style.Animated, title: "准备截图" });
    const capture = await prepareScreenCapture();
    await closeMainWindow();
    const text = await capture();
    await showHUD("正在翻译");
    const result = await translateText(readSettings(getPreferenceValues()), text);
    try {
      await launchCommand({
        name: "translate",
        type: LaunchType.UserInitiated,
        context: {
          sourceText: text,
          translation: result.text,
          target: result.target,
        },
      });
    } catch {
      await Clipboard.copy(result.text);
      await showHUD("译文已复制");
    }
  } catch (error) {
    if (error instanceof OcrCancelled) return;
    const message = errorMessage(error);
    await showToast({ style: Toast.Style.Failure, title: "截图翻译失败", message });
    await showHUD(message.length > 80 ? `${message.slice(0, 80)}…` : message);
  }
}
