import { buildUnevaluatedBundle } from "./bundle.js";

process.stdout.write(`${JSON.stringify(buildUnevaluatedBundle(), null, 2)}\n`);
