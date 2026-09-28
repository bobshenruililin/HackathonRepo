#!/usr/bin/env node
/**
 * Copyright (c) 2026 Shen Ruililin
 *
 * Original Hackathon Atlas code is under the MIT License.
 * Third-party material keeps its own terms.
 */
import { runCli } from "./cli.js";

process.exitCode = runCli(process.argv.slice(2));
