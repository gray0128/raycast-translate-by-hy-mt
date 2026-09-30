import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  Action,
  ActionPanel,
  Detail,
  Form,
  Icon,
  LaunchProps,
  Toast,
  getPreferenceValues,
  getSelectedText,
  openExtensionPreferences,
  popToRoot,
  showToast,
} from "@raycast/api";
import {
  isLexicalQuery,
  lookupDictionary,
  playDictionaryAudio,
  renderDictionary,
  type DictionaryEntry,
} from "./dictionary";
import { formatEudicBooks, listEudicBooks, saveEudicWord } from "./eudic";
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
  dictionary?: DictionaryEntry | null;
  collected?: boolean;
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
  const argumentText = props.arguments?.text;
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
      onCollect={() => {
        void collect(settings, state, setState);
      }}
      onShowWordbooks={() => {
        void showWordbooks(settings);
      }}
      onPlay={(url) => {
        void play(url);
      }}
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
  onCollect: () => void;
  onShowWordbooks: () => void;
  onPlay: (url: string) => void;
}) {
  const learning = Boolean(props.state.lesson);
  const entry = props.state.dictionary;
  const lexical = isLexicalQuery(props.state.source);
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
      markdown={
        learning
          ? props.state.lesson
          : entry
            ? renderDictionary(entry, props.state.translation)
            : props.state.translation
      }
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title={learning ? "模式" : "目标语言"}
            text={learning ? "学习模式" : props.state.targetName}
          />
          {entry?.usPhonetic ? <Detail.Metadata.Label title="美式音标" text={`/${entry.usPhonetic}/`} /> : null}
          {entry?.ukPhonetic ? <Detail.Metadata.Label title="英式音标" text={`/${entry.ukPhonetic}/`} /> : null}
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="原文" text={props.state.source} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          {props.pasteFirst ? paste : copy}
          {props.pasteFirst ? copy : paste}
          {entry?.usAudio ? (
            <Action icon={Icon.Play} title="播放美式发音" onAction={() => props.onPlay(entry.usAudio ?? "")} />
          ) : null}
          {entry?.ukAudio ? (
            <Action icon={Icon.Play} title="播放英式发音" onAction={() => props.onPlay(entry.ukAudio ?? "")} />
          ) : null}
          {lexical ? (
            <Action
              icon={Icon.Star}
              title={props.state.collected ? "已收藏到欧路" : "收藏到欧路"}
              onAction={props.onCollect}
            />
          ) : null}
          {lexical ? <Action icon={Icon.List} title="查看欧路单词本" onAction={props.onShowWordbooks} /> : null}
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
  setState: Dispatch<SetStateAction<ViewState>>,
  cancelled: () => boolean,
) {
  try {
    const lexical = isLexicalQuery(text);
    const dictionaryPromise = lexical && settings.dictionary ? lookupDictionary(text) : Promise.resolve(null);
    const result = await translateText(settings, text, target);
    const dictionary = await dictionaryPromise;
    if (cancelled()) return;
    const next: ResultState = {
      status: "result",
      source: text,
      translation: result.text,
      target: result.target,
      targetName: result.targetName,
      dictionary,
    };
    setState(next);
    if (settings.autoSaveWord && lexical) void autoSave(settings, text, setState, cancelled);
  } catch (error) {
    if (!cancelled()) setState({ status: "error", message: errorMessage(error), source: text });
  }
}

async function autoSave(
  settings: Settings,
  text: string,
  setState: Dispatch<SetStateAction<ViewState>>,
  cancelled: () => boolean,
) {
  const outcome = await saveEudicWord(settings.eudicToken, settings.eudicBookId, text);
  if (cancelled()) return;
  if (outcome.ok) {
    setState((current) =>
      current.status === "result" && current.source === text ? { ...current, collected: true } : current,
    );
    await showToast({ style: Toast.Style.Success, title: "已加入欧路单词本", message: text });
    return;
  }
  await showToast({ style: Toast.Style.Failure, title: "未能自动收藏", message: outcome.message });
}

async function collect(settings: Settings, current: ResultState, setState: Dispatch<SetStateAction<ViewState>>) {
  if (current.collected) {
    await showToast({ style: Toast.Style.Success, title: "已在欧路单词本中", message: current.source });
    return;
  }
  const outcome = await saveEudicWord(settings.eudicToken, settings.eudicBookId, current.source);
  if (!outcome.ok) {
    await showToast({ style: Toast.Style.Failure, title: "收藏失败", message: outcome.message });
    return;
  }
  setState((state) =>
    state.status === "result" && state.source === current.source ? { ...state, collected: true } : state,
  );
  await showToast({ style: Toast.Style.Success, title: "已加入欧路单词本", message: current.source });
}

async function showWordbooks(settings: Settings) {
  if (!settings.eudicToken) {
    await showToast({
      style: Toast.Style.Failure,
      title: "未填写欧路授权",
      message: "请在欧路账户管理复制 Authorization，再填入扩展配置。",
    });
    return;
  }
  try {
    const books = await listEudicBooks(settings.eudicToken);
    const summary = formatEudicBooks(books);
    await showToast({
      style: summary ? Toast.Style.Success : Toast.Style.Failure,
      title: summary ? "欧路单词本" : "没有英语单词本",
      message: summary || "当前授权下没有可写入的英语单词本。",
    });
  } catch (error) {
    await showToast({ style: Toast.Style.Failure, title: "无法获取欧路单词本", message: errorMessage(error) });
  }
}

async function play(url: string) {
  try {
    await playDictionaryAudio(url);
  } catch (error) {
    await showToast({ style: Toast.Style.Failure, title: "无法播放发音", message: errorMessage(error) });
  }
}

async function explain(settings: Settings, current: ResultState, setState: Dispatch<SetStateAction<ViewState>>) {
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
