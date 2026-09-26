import { execFile } from "child_process";
import { useEffect, useMemo, useState } from "react";
import { promisify } from "util";
import {
  Action,
  ActionPanel,
  Detail,
  PopToRootType,
  Toast,
  closeMainWindow,
  getPreferenceValues,
  openExtensionPreferences,
  showToast,
} from "@raycast/api";
import { errorMessage, explainText, readSettings, translateText } from "./hy-mt";
import { OcrCancelled, prepareScreenCapture } from "./ocr";

const execFileAsync = promisify(execFile);

type ScreenshotState =
  | { status: "loading"; message: string }
  | { status: "result"; source: string; translation: string; targetName: string; lesson?: string }
  | { status: "error"; message: string }
  | { status: "cancelled" };

export default function Command() {
  const settings = useMemo(() => readSettings(getPreferenceValues()), []);
  const [state, setState] = useState<ScreenshotState>({ status: "loading", message: "请框选要翻译的区域" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const capture = await prepareScreenCapture();
        await new Promise((resolve) => setTimeout(resolve, 50));
        await closeMainWindow({ popToRootType: PopToRootType.Suspended });
        const text = await capture();
        if (cancelled) return;
        setState({ status: "loading", message: "正在翻译" });
        const result = await translateText(settings, text);
        if (cancelled) return;
        setState({
          status: "result",
          source: text,
          translation: result.text,
          targetName: result.targetName,
        });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof OcrCancelled) {
          setState({ status: "cancelled" });
        } else {
          setState({ status: "error", message: errorMessage(error) });
        }
      } finally {
        if (!cancelled) await revealRaycast();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [settings]);

  if (state.status === "loading") return <Detail isLoading markdown={state.message} />;
  if (state.status === "cancelled") return <Detail markdown="已取消截图。" />;
  if (state.status === "error") return <Detail markdown={`**截图翻译失败**\n\n${state.message}`} />;
  return <ScreenshotResult settings={settings} state={state} onChange={setState} />;
}

function ScreenshotResult(props: {
  settings: ReturnType<typeof readSettings>;
  state: Extract<ScreenshotState, { status: "result" }>;
  onChange: (state: ScreenshotState) => void;
}) {
  const learning = Boolean(props.state.lesson);
  const content = props.state.lesson || props.state.translation;
  const copy = <Action.CopyToClipboard title={learning ? "复制讲解" : "复制译文"} content={content} />;
  const paste = <Action.Paste title={learning ? "粘贴讲解" : "粘贴译文"} content={content} />;
  const pasteFirst = props.settings.primaryAction === "paste";

  return (
    <Detail
      isLoading={false}
      markdown={content}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title={learning ? "模式" : "目标语言"}
            text={learning ? "学习模式" : props.state.targetName}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="原文" text={props.state.source} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          {pasteFirst ? paste : copy}
          {pasteFirst ? copy : paste}
          {learning ? (
            <Action title="返回译文" onAction={() => props.onChange({ ...props.state, lesson: undefined })} />
          ) : (
            <Action
              title="学习模式"
              onAction={() => {
                void (async () => {
                  props.onChange({ status: "loading", message: "正在讲解" });
                  try {
                    const lesson = await explainText(props.settings, props.state.source, props.state.translation);
                    props.onChange({ ...props.state, lesson });
                  } catch (error) {
                    const message = errorMessage(error);
                    props.onChange(props.state);
                    await showToast({ style: Toast.Style.Failure, title: "讲解失败", message });
                  }
                })();
              }}
            />
          )}
          <Action.CopyToClipboard title="复制原文" content={props.state.source} />
          <Action title="打开配置" onAction={openExtensionPreferences} />
        </ActionPanel>
      }
    />
  );
}

async function revealRaycast() {
  try {
    await execFileAsync("osascript", ["-e", 'tell application "Raycast" to activate']);
  } catch {
    // 系统拒绝激活时，用户仍可从菜单栏回到挂起的译文页面。
  }
}
