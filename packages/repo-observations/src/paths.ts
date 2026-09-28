const SOURCE_LANGUAGES: Readonly<Record<string, string>> = {
  ".py": "Python",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".rb": "Ruby",
  ".php": "PHP",
  ".swift": "Swift",
  ".kt": "Kotlin",
  ".kts": "Kotlin",
  ".cs": "C#",
  ".cpp": "C++",
  ".cc": "C++",
  ".cxx": "C++",
  ".hpp": "C++",
  ".hh": "C++",
  ".c": "C",
};

export type PathKind =
  | "readme"
  | "package-json"
  | "requirements"
  | "go-mod"
  | "cargo-toml"
  | "pyproject"
  | "source"
  | "other";

export function basename(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  const base = parts[parts.length - 1];
  return base ?? "";
}

export function classifyPath(filePath: string): PathKind {
  const base = basename(filePath);
  if (/^readme(?:\.(?:md|markdown|txt|rst))?$/i.test(base)) return "readme";
  if (base === "package.json") return "package-json";
  if (base === "requirements.txt") return "requirements";
  if (base === "go.mod") return "go-mod";
  if (base === "Cargo.toml") return "cargo-toml";
  if (base === "pyproject.toml") return "pyproject";
  if (languageFromExtension(filePath) !== undefined) return "source";
  return "other";
}

export function languageFromExtension(filePath: string): string | undefined {
  const base = basename(filePath);
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return undefined;
  const extension = base.slice(dot).toLowerCase();
  return SOURCE_LANGUAGES[extension];
}

/** Language evidenced by a manifest or a named source file. package.json is not a language. */
export function languageForPath(filePath: string): string | undefined {
  switch (classifyPath(filePath)) {
    case "requirements":
    case "pyproject":
      return "Python";
    case "go-mod":
      return "Go";
    case "cargo-toml":
      return "Rust";
    case "source":
      return languageFromExtension(filePath);
    default:
      return undefined;
  }
}
