import { useEffect, useMemo, useState } from "react";
import {
  Action,
  ActionPanel,
  List,
  LocalStorage,
  PopToRootType,
  Toast,
  closeMainWindow,
  environment,
  getPreferenceValues,
  open,
  popToRoot,
  showToast,
} from "@raycast/api";
import { LANGUAGE_OPTIONS, errorMessage, explainText, readSettings, translateText } from "./hy-mt";
import { OcrCancelled, prepareScreenCapture } from "./ocr";
import {
  PENDING_SCREENSHOT_TRANSLATION,
  extensionCommandLink,
  parsePendingTranslation,
  type PendingTranslation,
} from "./pending-translation";

type ScreenshotState =
  | { status: "working"; message: string }
  | { status: "result"; source: string; translation: string; targetName: string; lesson?: string }
  | { status: "error"; message: string };

export default function Command() {
  const settings = useMemo(() => readSettings(getPreferenceValues()), []);
  const [state, setState] = useState<ScreenshotState>({ status: "working", message: "正在准备截图" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const pending = await takePendingTranslation();
      if (cancelled) return;
      if (pending?.error) {
        setState({ status: "error", message: pending.error });
        return;
      }
      if (pending) {
        setState({
          status: "result",
          source: pending.sourceText,
          translation: pending.translation,
          targetName: languageTitle(pending.target),
        });
        return;
      }

      try {
        const capture = await prepareScreenCapture();
        await closeMainWindow({ popToRootType: PopToRootType.Suspended });
        const text = await capture();
        if (cancelled) return;
        setState({ status: "working", message: "正在翻译" });
        const result = await translateText(settings, text);
        if (cancelled) return;
        await LocalStorage.setItem(
          PENDING_SCREENSHOT_TRANSLATION,
          JSON.stringify({
            sourceText: text,
            translation: result.text,
            target: result.target,
          } satisfies PendingTranslation),
        );
        await open(
          extensionCommandLink(environment.ownerOrAuthorName, environment.extensionName, "translate-screenshot"),
        );
      } catch (error) {
        if (cancelled) return;
        if (error instanceof OcrCancelled) {
          await open("raycast://");
          return;
        }
        const message = errorMessage(error);
        await LocalStorage.setItem(
          PENDING_SCREENSHOT_TRANSLATION,
          JSON.stringify({ sourceText: "", translation: "", error: message }),
        );
        await open(
          extensionCommandLink(environment.ownerOrAuthorName, environment.extensionName, "translate-screenshot"),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [settings]);

  if (state.status === "result") {
    return <ScreenshotResult settings={settings} state={state} onChange={setState} />;
  }
  if (state.status === "error") {
    return (
      <List>
        <List.Item title="截图翻译失败" subtitle={state.message} actions={<HomeActions />} />
      </List>
    );
  }
  return (
    <List>
      <List.Item title={state.message} />
    </List>
  );
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
    <List filtering={false} isShowingDetail searchBarPlaceholder="译文">
      <List.Item
        id="translation"
        title={learning ? "讲解" : "译文"}
        subtitle={props.state.targetName}
        detail={<List.Item.Detail markdown={content} />}
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
                    try {
                      const lesson = await explainText(props.settings, props.state.source, props.state.translation);
                      props.onChange({ ...props.state, lesson });
                    } catch (error) {
                      await showToast({
                        style: Toast.Style.Failure,
                        title: "讲解失败",
                        message: errorMessage(error),
                      });
                    }
                  })();
                }}
              />
            )}
            <Action.CopyToClipboard title="复制原文" content={props.state.source} />
            <Action title="返回主界面" onAction={() => void popToRoot({ clearSearchBar: true })} />
          </ActionPanel>
        }
      />
    </List>
  );
}

function HomeActions() {
  return (
    <ActionPanel>
      <Action title="返回主界面" onAction={() => void popToRoot({ clearSearchBar: true })} />
    </ActionPanel>
  );
}

async function takePendingTranslation(): Promise<PendingTranslation | undefined> {
  const raw = await LocalStorage.getItem<string>(PENDING_SCREENSHOT_TRANSLATION);
  if (typeof raw !== "string" || !raw) return undefined;
  await LocalStorage.removeItem(PENDING_SCREENSHOT_TRANSLATION);
  return parsePendingTranslation(raw);
}

function languageTitle(code: string | undefined): string {
  if (!code || code === "auto") return "自动";
  return LANGUAGE_OPTIONS.find((language) => language.value === code)?.title ?? code;
}
