import { useEffect, useMemo, useState } from "react";
import {
  Action,
  ActionPanel,
  Detail,
  Form,
  LaunchProps,
  Toast,
  getPreferenceValues,
  getSelectedText,
  openExtensionPreferences,
  popToRoot,
  showToast,
} from "@raycast/api";
import { LANGUAGE_OPTIONS, errorMessage, explainText, readSettings, translateText, type Settings } from "./hy-mt";

type TranslateContext = {
  sourceText?: string;
  translation?: string;
  target?: string;
};

type TranslateArguments = {
  text?: string;
};

type ResultState = {
  status: "result";
  source: string;
  translation: string;
  target: string;
  targetName: string;
  lesson?: string;
};

type ViewState =
  | { status: "loading" }
  | { status: "form"; source: string }
  | ResultState
  | { status: "error"; message: string; source?: string; previous?: ResultState; retry?: "translate" | "lesson" };

export default function Command(
  props: LaunchProps<{ arguments: TranslateArguments; launchContext?: TranslateContext }>,
) {
  const settings = useMemo(() => readSettings(getPreferenceValues()), []);
  const [state, setState] = useState<ViewState>({ status: "loading" });
  const argumentText = props.arguments.text;
  const contextSource = props.launchContext?.sourceText;
  const contextTranslation = props.launchContext?.translation;
  const contextTarget = props.launchContext?.target;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (contextSource && contextTranslation) {
        if (!cancelled) {
          setState({
            status: "result",
            source: contextSource,
            translation: contextTranslation,
            target: contextTarget || settings.targetLanguage,
            targetName: languageTitle(contextTarget || settings.targetLanguage),
          });
        }
        return;
      }

      const typed = argumentText?.trim() || contextSource?.trim() || "";
      let text = typed;
      let selectionError = "";
      if (!text && settings.readSelection) {
        try {
          text = (await getSelectedText()).trim();
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (/accessib/i.test(message)) selectionError = "请在系统设置中允许辅助功能，然后再读取选中文本。";
          text = "";
        }
      }
      if (cancelled) return;
      if (!text) {
        if (selectionError) {
          await showToast({ style: Toast.Style.Failure, title: "无法读取选中文本", message: selectionError });
        }
        setState({ status: "form", source: "" });
        return;
      }
      await run(settings, text, undefined, setState, () => cancelled);
    })();
    return () => {
      cancelled = true;
    };
  }, [argumentText, contextSource, contextTarget, contextTranslation, settings]);

  if (state.status === "loading") return <Detail isLoading markdown="" />;
  if (state.status === "form") {
    return (
      <InputForm
        initialText={state.source}
        initialTarget={settings.targetLanguage}
        onSubmit={(text, target) => {
          setState({ status: "loading" });
          void run(settings, text, target, setState, () => false);
        }}
      />
    );
  }
  if (state.status === "error") {
    return (
      <Detail
        markdown={`**翻译失败**\n\n${state.message}`}
        actions={
          <ActionPanel>
            {state.source ? (
              <Action
                title="重试"
                onAction={() => {
                  setState({ status: "loading" });
                  if (state.retry === "lesson" && state.previous) {
                    void explain(settings, state.previous, setState);
                    return;
                  }
                  void run(settings, state.source ?? "", undefined, setState, () => false);
                }}
              />
            ) : null}
            {state.previous ? (
              <Action
                title="返回译文"
                onAction={() => {
                  const previous = state.previous;
                  if (!previous) return;
                  setState({ ...previous, lesson: undefined });
                }}
              />
            ) : null}
            {state.source && state.retry !== "lesson" ? (
              <Action
                title="学习模式"
                onAction={() => {
                  const previous: ResultState = state.previous ?? {
                    status: "result",
                    source: state.source ?? "",
                    translation: "",
                    target: settings.targetLanguage,
                    targetName: languageTitle(settings.targetLanguage),
                  };
                  setState({ status: "loading" });
                  void explain(settings, previous, setState);
                }}
              />
            ) : null}
            <Action title="修改原文" onAction={() => setState({ status: "form", source: state.source ?? "" })} />
            <Action title="打开配置" onAction={openExtensionPreferences} />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <ResultView
      state={state}
      pasteFirst={settings.primaryAction === "paste"}
      onRetranslate={(target) => {
        setState({ status: "loading" });
        void run(settings, state.source, target, setState, () => false);
      }}
      onEdit={() => setState({ status: "form", source: state.source })}
      onExplain={() => {
        setState({ status: "loading" });
        void explain(settings, state, setState);
      }}
      onCloseLesson={() => setState({ ...state, lesson: undefined })}
    />
  );
}

function InputForm(props: {
  initialText: string;
  initialTarget: string;
  onSubmit: (text: string, target: string) => void;
}) {
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="翻译"
            onSubmit={(values: { text: string; target: string }) => props.onSubmit(values.text, values.target)}
          />
          <Action title="打开配置" onAction={openExtensionPreferences} />
        </ActionPanel>
      }
    >
      <Form.TextArea id="text" title="原文" placeholder="输入要翻译的文本" defaultValue={props.initialText} />
      <Form.Dropdown id="target" title="目标语言" defaultValue={props.initialTarget}>
        <Form.Dropdown.Item value="auto" title="自动" />
        {LANGUAGE_OPTIONS.map((language) => (
          <Form.Dropdown.Item key={language.value} value={language.value} title={language.title} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}

function ResultView(props: {
  state: ResultState;
  pasteFirst: boolean;
  onRetranslate: (target: string) => void;
  onEdit: () => void;
  onExplain: () => void;
  onCloseLesson: () => void;
}) {
  const learning = Boolean(props.state.lesson);
  const copy = (
    <Action.CopyToClipboard
      title={learning ? "复制讲解" : "复制译文"}
      content={props.state.lesson || props.state.translation}
    />
  );
  const paste = (
    <Action.Paste title={learning ? "粘贴讲解" : "粘贴译文"} content={props.state.lesson || props.state.translation} />
  );
  return (
    <Detail
      markdown={props.state.lesson || props.state.translation}
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
          {props.pasteFirst ? paste : copy}
          {props.pasteFirst ? copy : paste}
          {learning ? (
            <Action title="返回译文" onAction={props.onCloseLesson} />
          ) : (
            <Action title="学习模式" onAction={props.onExplain} />
          )}
          <Action.CopyToClipboard title="复制原文" content={props.state.source} />
          <Action title="修改原文" onAction={props.onEdit} />
          {learning ? (
            <Action title="重新讲解" onAction={props.onExplain} />
          ) : (
            <ActionPanel.Submenu title="翻译为其他语言">
              {LANGUAGE_OPTIONS.map((language) => (
                <Action
                  key={language.value}
                  title={language.title}
                  onAction={() => props.onRetranslate(language.value)}
                />
              ))}
            </ActionPanel.Submenu>
          )}
          <Action
            title="返回主界面"
            onAction={() => {
              void popToRoot({ clearSearchBar: true });
            }}
          />
          <Action title="打开配置" onAction={openExtensionPreferences} />
        </ActionPanel>
      }
    />
  );
}

async function run(
  settings: Settings,
  text: string,
  target: string | undefined,
  setState: (state: ViewState) => void,
  cancelled: () => boolean,
) {
  try {
    const result = await translateText(settings, text, target);
    if (!cancelled()) {
      setState({
        status: "result",
        source: text,
        translation: result.text,
        target: result.target,
        targetName: result.targetName,
      });
    }
  } catch (error) {
    if (!cancelled()) setState({ status: "error", message: errorMessage(error), source: text });
  }
}

async function explain(settings: Settings, current: ResultState, setState: (state: ViewState) => void) {
  try {
    const lesson = await explainText(settings, current.source, current.translation);
    setState({ ...current, lesson });
  } catch (error) {
    setState({
      status: "error",
      message: errorMessage(error),
      source: current.source,
      previous: current,
      retry: "lesson",
    });
  }
}

function languageTitle(code: string): string {
  if (code === "auto") return "自动";
  return LANGUAGE_OPTIONS.find((language) => language.value === code)?.title ?? code;
}
