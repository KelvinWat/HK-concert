export interface ImportSummary {
  created: number;
  updated: number;
  unchanged: number;
  snapshots: number;
  heatScores: number;
  provenance: number;
  skipped: { name: string; reason: string }[];
  warnings: string[];
}

export function createSummary(): ImportSummary {
  return {
    created: 0,
    updated: 0,
    unchanged: 0,
    snapshots: 0,
    heatScores: 0,
    provenance: 0,
    skipped: [],
    warnings: [],
  };
}

export function summaryLines(summary: ImportSummary): string[] {
  const lines = [
    `created ${summary.created}, updated ${summary.updated}, unchanged ${summary.unchanged}`,
  ];

  if (summary.heatScores > 0) {
    lines.push(`heat scores ${summary.heatScores}, snapshots ${summary.snapshots}`);
  }
  if (summary.provenance > 0) {
    lines.push(`source sightings ${summary.provenance}`);
  }

  for (const warning of summary.warnings) {
    lines.push(`warning: ${warning}`);
  }
  for (const skip of summary.skipped) {
    lines.push(`skipped ${skip.name}: ${skip.reason}`);
  }

  return lines;
}

export function mergeSummaries(
  left: ImportSummary,
  right: ImportSummary,
): ImportSummary {
  return {
    created: left.created + right.created,
    updated: left.updated + right.updated,
    unchanged: left.unchanged + right.unchanged,
    snapshots: left.snapshots + right.snapshots,
    heatScores: left.heatScores + right.heatScores,
    provenance: left.provenance + right.provenance,
    skipped: [...left.skipped, ...right.skipped],
    warnings: [...left.warnings, ...right.warnings],
  };
}
