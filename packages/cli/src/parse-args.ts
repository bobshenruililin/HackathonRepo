/**
 * Copyright (c) 2026 Shen Ruililin
 *
 * Original Hackathon Atlas code is under the MIT License.
 * Third-party material keeps its own terms.
 */

import { parseArgs } from "node:util";

import { ANALOGUE_MODES, type AnalogueMode } from "@hackathon-atlas/analogues";

import { CliUsageError } from "./errors.js";
import type { AnaloguesSubject, FilterRequest } from "./types.js";

export type ParsedCommand =
  | { kind: "help" }
  | {
      kind: "search";
      indexPath: string;
      query: string;
      filters: FilterRequest[];
    }
  | {
      kind: "analogues";
      catalogPath: string;
      mode: AnalogueMode;
      subject: AnaloguesSubject;
    };

export function parseCommand(argv: readonly string[]): ParsedCommand {
  let parsed: ReturnType<typeof parseArgs>;
  try {
    parsed = parseArgs({
      args: [...argv],
      options: {
        index: { type: "string", short: "i" },
        filter: { type: "string", short: "f", multiple: true },
        catalog: { type: "string" },
        mode: { type: "string" },
        project: { type: "string" },
        title: { type: "string" },
        help: { type: "boolean", short: "h" },
      },
      allowPositionals: true,
      strict: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliUsageError(message);
  }

  if (parsed.values.help === true) {
    return { kind: "help" };
  }

  const positionals = parsed.positionals;
  const command = positionals[0];
  if (command === undefined) {
    throw new CliUsageError("Missing command. Expected: hackathon-atlas search or hackathon-atlas analogues");
  }
  if (command === "search") {
    return parseSearch(parsed.values, positionals);
  }
  if (command === "analogues") {
    return parseAnalogues(parsed.values, positionals);
  }
  throw new CliUsageError(`Unknown command: ${command}`);
}

function parseSearch(
  values: Record<string, unknown>,
  positionals: string[],
): ParsedCommand {
  if (
    values.catalog !== undefined ||
    values.mode !== undefined ||
    values.project !== undefined ||
    values.title !== undefined
  ) {
    throw new CliUsageError("search does not accept analogues options");
  }

  const indexPath = values.index;
  if (typeof indexPath !== "string" || indexPath.trim() === "") {
    throw new CliUsageError("search requires --index <generated.sqlite>");
  }

  const query = positionals.slice(1).join(" ").trim();
  if (query === "") {
    throw new CliUsageError("Search query must not be empty");
  }

  return {
    kind: "search",
    indexPath,
    query,
    filters: readFilters(values.filter).map(parseFilter),
  };
}

function parseAnalogues(
  values: Record<string, unknown>,
  positionals: string[],
): ParsedCommand {
  if (values.index !== undefined || values.filter !== undefined) {
    throw new CliUsageError("analogues does not read an index and does not accept --filter");
  }
  if (positionals.length > 1) {
    throw new CliUsageError("analogues does not take positional arguments");
  }

  const catalogPath = values.catalog;
  if (typeof catalogPath !== "string" || catalogPath.trim() === "") {
    throw new CliUsageError("analogues requires --catalog <catalog.json>");
  }

  const mode = parseMode(values.mode);
  const subject = parseSubject(values.project, values.title);
  return { kind: "analogues", catalogPath, mode, subject };
}

function parseMode(value: unknown): AnalogueMode {
  if (typeof value !== "string" || !(ANALOGUE_MODES as readonly string[]).includes(value)) {
    throw new CliUsageError("analogues requires --mode <direct|mechanism|demo>");
  }
  return value as AnalogueMode;
}

function parseSubject(project: unknown, title: unknown): AnaloguesSubject {
  const hasProject = typeof project === "string";
  const hasTitle = typeof title === "string";
  if (hasProject && hasTitle) {
    throw new CliUsageError("analogues accepts either --project or --title, not both");
  }
  if (hasProject) {
    if (project.trim() === "") {
      throw new CliUsageError("analogues requires --project <id> or --title <exact project name>");
    }
    return { kind: "project", projectId: project };
  }
  if (hasTitle) {
    if (title.trim() === "") {
      throw new CliUsageError("analogues requires --project <id> or --title <exact project name>");
    }
    return { kind: "title", title };
  }
  throw new CliUsageError("analogues requires --project <id> or --title <exact project name>");
}

function readFilters(value: unknown): string[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new CliUsageError("Filter must be field=value");
  }
  const filters: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      throw new CliUsageError("Filter must be field=value");
    }
    filters.push(item);
  }
  return filters;
}

function parseFilter(raw: string): FilterRequest {
  const separator = raw.indexOf("=");
  if (separator <= 0) {
    throw new CliUsageError(`Filter must be field=value: ${raw}`);
  }
  const field = raw.slice(0, separator).trim();
  const value = raw.slice(separator + 1);
  if (field === "") {
    throw new CliUsageError(`Filter must be field=value: ${raw}`);
  }
  return { field, value };
}
