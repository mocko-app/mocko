import {
  createHighlighter,
  type Highlighter,
  type LanguageRegistration,
} from "shiki";
import bigodon from "./bigodon.tmLanguage.json";
import mockoHcl from "./mocko-hcl.tmLanguage.json";

export type CodeLanguage =
  | "hcl"
  | "bigodon"
  | "ts"
  | "json"
  | "yaml"
  | "bash"
  | "dockerfile"
  | "text";

const THEME = "github-dark-default";

const grammars = [bigodon, mockoHcl] as unknown as LanguageRegistration[];

const shikiLanguage: Record<Exclude<CodeLanguage, "text">, string> = {
  hcl: "mocko-hcl",
  bigodon: "bigodon",
  ts: "typescript",
  json: "json",
  yaml: "yaml",
  bash: "bash",
  dockerfile: "docker",
};

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  highlighterPromise ??= createHighlighter({
    themes: [THEME],
    langs: [...grammars, "typescript", "json", "yaml", "bash", "docker"],
  });
  return highlighterPromise;
}

export async function highlightCode(
  code: string,
  language: Exclude<CodeLanguage, "text">,
) {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang: shikiLanguage[language],
    theme: THEME,
    structure: "inline",
  });
}
