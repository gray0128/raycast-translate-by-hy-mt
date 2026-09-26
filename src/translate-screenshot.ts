import {
  LaunchType,
  PopToRootType,
  Toast,
  closeMainWindow,
  getPreferenceValues,
  launchCommand,
  open,
  showHUD,
  showToast,
} from "@raycast/api";
import { errorMessage, readSettings, translateText } from "./hy-mt";
import { OcrCancelled, prepareScreenCapture } from "./ocr";

export default async function Command() {
  try {
    const capture = await prepareScreenCapture();
    await closeMainWindow({ popToRootType: PopToRootType.Suspended });
    const text = await capture();
    await showHUD("正在翻译");
    const result = await translateText(readSettings(getPreferenceValues()), text);
    await launchCommand({
      name: "translate",
      type: LaunchType.UserInitiated,
      context: {
        sourceText: text,
        translation: result.text,
        target: result.target,
      },
    });
    // Tinycast 会把扩展里的 raycast:// 留在自己的调色板里。
    // 用 AppleScript 激活 Raycast 应用会在只安装 Tinycast 时找不到窗口。
    await open("raycast://");
  } catch (error) {
    if (error instanceof OcrCancelled) return;
    const message = errorMessage(error);
    await showToast({ style: Toast.Style.Failure, title: "截图翻译失败", message });
    await showHUD(message.length > 80 ? `${message.slice(0, 80)}…` : message);
    await open("raycast://");
  }
}
