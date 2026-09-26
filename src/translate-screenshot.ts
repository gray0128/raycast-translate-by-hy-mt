import {
  LocalStorage,
  PopToRootType,
  Toast,
  closeMainWindow,
  environment,
  getPreferenceValues,
  open,
  showHUD,
  showToast,
} from "@raycast/api";
import { errorMessage, readSettings, translateText } from "./hy-mt";
import { OcrCancelled, prepareScreenCapture } from "./ocr";
import { PENDING_SCREENSHOT_TRANSLATION, translationCommandLink } from "./pending-translation";

export default async function Command() {
  try {
    const capture = await prepareScreenCapture();
    await closeMainWindow({ popToRootType: PopToRootType.Suspended });
    const text = await capture();
    await showHUD("正在翻译");
    const result = await translateText(readSettings(getPreferenceValues()), text);
    await LocalStorage.setItem(
      PENDING_SCREENSHOT_TRANSLATION,
      JSON.stringify({
        sourceText: text,
        translation: result.text,
        target: result.target,
      }),
    );
    await open(translationCommandLink(environment.ownerOrAuthorName, environment.extensionName));
  } catch (error) {
    if (error instanceof OcrCancelled) return;
    const message = errorMessage(error);
    await showToast({ style: Toast.Style.Failure, title: "截图翻译失败", message });
    await showHUD(message.length > 80 ? `${message.slice(0, 80)}…` : message);
  }
}
