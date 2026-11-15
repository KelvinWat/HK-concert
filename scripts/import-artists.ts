import { readFile } from "node:fs/promises";
import {
  getFileArg,
  getTargetKind,
  hasFlag,
  loadEnv,
  printSummary,
} from "./lib/cli";
import { parseArtistsXml } from "../src/lib/importer/parse-artists";
import { resolveTarget } from "../src/lib/importer/target";
import { writeArtists } from "../src/lib/importer/write-artists";

const USAGE =
  "Usage: npm run import:artists -- <artists.xml> [--dry-run] [--target auto|supabase|demo]";

async function main(): Promise<void> {
  loadEnv();

  const file = getFileArg();
  if (!file) throw new Error(USAGE);

  const xml = await readFile(file, "utf8");
  const { records, issues } = parseArtistsXml(xml);

  if (records.length === 0 && issues.length === 0) {
    throw new Error(`No <artist> records found in ${file}.`);
  }

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`  #${issue.index + 1} ${issue.label}: ${issue.reason}`);
    }
    throw new Error(
      `${issues.length} record(s) failed validation in ${file}; nothing was imported.`,
    );
  }

  console.log(`Parsed ${records.length} artist record(s) from ${file}.`);

  if (hasFlag("dry-run")) {
    console.log("Dry run: validation passed, nothing written.");
    for (const record of records) {
      console.log(`  ${record.name}`);
    }
    return;
  }

  const target = await resolveTarget(getTargetKind());
  const summary = await writeArtists(target, records);
  await target.commit();

  console.log(`Imported artists into ${target.kind}.`);
  printSummary(summary);

  if (summary.skipped.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(
    `Artist import failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
