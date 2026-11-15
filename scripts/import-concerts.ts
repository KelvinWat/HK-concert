import { readFile } from "node:fs/promises";
import {
  getFileArg,
  getTargetKind,
  hasFlag,
  loadEnv,
  printSummary,
} from "./lib/cli";
import { parseConcertsXml } from "../src/lib/importer/parse-concerts";
import { resolveTarget } from "../src/lib/importer/target";
import { writeConcerts } from "../src/lib/importer/write-concerts";

const USAGE =
  "Usage: npm run import:concerts -- <concerts.xml> [--dry-run] [--target auto|supabase|demo] [--strict]";

async function main(): Promise<void> {
  loadEnv();

  const file = getFileArg();
  if (!file) throw new Error(USAGE);

  const xml = await readFile(file, "utf8");
  const { records, issues } = parseConcertsXml(xml);

  if (records.length === 0 && issues.length === 0) {
    throw new Error(`No <concert> records found in ${file}.`);
  }

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`  #${issue.index + 1} ${issue.label}: ${issue.reason}`);
    }
    throw new Error(
      `${issues.length} record(s) failed validation in ${file}; nothing was imported.`,
    );
  }

  console.log(`Parsed ${records.length} concert record(s) from ${file}.`);

  if (hasFlag("dry-run")) {
    console.log("Dry run: validation passed, nothing written.");
    for (const record of records) {
      console.log(`  ${record.source} ${record.sourceEventId}: ${record.name}`);
    }
    return;
  }

  const target = await resolveTarget(getTargetKind());
  const summary = await writeConcerts(target, records, {
    strict: hasFlag("strict"),
  });
  await target.commit();

  console.log(`Imported concerts into ${target.kind}.`);
  printSummary(summary);

  if (summary.skipped.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(
    `Concert import failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
