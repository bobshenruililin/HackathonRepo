import { parseArgs } from "node:util";

import { CliUsageError } from "./errors.js";
import type { FilterRequest } from "./types.js";

export type ParsedCommand =
  | { kind: "help" }
  | {
      kind: "search";
      indexPath: string;
      query: string;
      filters: FilterRequest[];
    };

export function parseCommand(argv: readonly string[]): ParsedCommand {
  let parsed: ReturnType<typeof parseArgs>;
  try {
    parsed = parseArgs({
      args: [...argv],
      options: {
        index: { type: "string", short: "i" },
        filter: { type: "string", short: "f", multiple: true },
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
    throw new CliUsageError("Missing command. Expected: hackathon-atlas search");
  }
  if (command !== "search") {
    throw new CliUsageError(`Unknown command: ${command}`);
  }

  const indexPath = parsed.values.index;
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
    filters: readFilters(parsed.values.filter).map(parseFilter),
  };
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
