import type { ImportSummary } from "../../src/lib/importer/summary";
import type { TargetKind } from "../../src/lib/importer/target";

const VALUE_FLAGS = new Set(["--target", "--file"]);

export function loadEnv(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(file);
    } catch {
      // Optional file.
    }
  }
}

export function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

export function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = process.argv.find((argument) => argument.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1];
  return undefined;
}

export function getFileArg(): string | undefined {
  const explicit = getArg("file");
  if (explicit) return explicit;

  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument) continue;

    if (argument.startsWith("--")) {
      if (!argument.includes("=") && VALUE_FLAGS.has(argument)) {
        index += 1;
      }
      continue;
    }

    return argument;
  }

  return undefined;
}

export function getTargetKind(): TargetKind {
  const value = getArg("target") ?? "auto";
  if (value === "auto" || value === "supabase" || value === "demo") {
    return value;
  }

  throw new Error(`Unknown --target "${value}". Use auto, supabase or demo.`);
}

export function printSummary(summary: ImportSummary): void {
  console.log(
    `created ${summary.created}, updated ${summary.updated}, unchanged ${summary.unchanged}`,
  );

  if (summary.heatScores > 0) {
    console.log(
      `heat scores ${summary.heatScores}, snapshots ${summary.snapshots}`,
    );
  }
  if (summary.provenance > 0) {
    console.log(`source sightings ${summary.provenance}`);
  }

  for (const warning of summary.warnings) {
    console.warn(`warning: ${warning}`);
  }
  for (const skip of summary.skipped) {
    console.warn(`skipped ${skip.name}: ${skip.reason}`);
  }
}
