function markdownTable(rows) {
  return rows.join("\n");
}

function assetSection(group) {
  return [
    `## ${group.title}`,
    "",
    group.use,
    "",
    "| Asset | File | Size | Use |",
    "| --- | --- | ---: | --- |",
    markdownTable(
      group.assets.map(
        (asset) => `| ${asset.label} | \`${asset.file}\` | ${asset.size} | ${asset.use} |`,
      ),
    ),
    "",
  ].join("\n");
}

function logoSection(group) {
  return [
    `## ${group.title}`,
    "",
    "| Logo | Preferred file | Other files |",
    "| --- | --- | --- |",
    markdownTable(
      group.assets.map((asset) => {
        const other = asset.files.slice(1).map((file) => `\`${file}\``).join(", ");
        return `| ${asset.label} | \`${asset.preferredFile}\` | ${other || "-"} |`;
      }),
    ),
    "",
  ].join("\n");
}

export function buildMarkdown(kit) {
  return [
    "# OneMem Media Kit",
    "",
    "Generated from the current brand assets, designer briefs, video outputs, and vendor logo manifest. Do not hand-edit this file; rerun `npm run media-kit:generate` after changing brand, campaign, video, brief, or vendor-logo assets.",
    "",
    "## Identity",
    "",
    `- Product: ${kit.identity.product}`,
    `- Motto: ${kit.identity.motto}`,
    `- Social line: ${kit.identity.socialLine}`,
    `- Website: ${kit.identity.domain}`,
    `- Docs: ${kit.identity.docs}`,
    `- X: ${kit.identity.x}`,
    `- GitHub: ${kit.identity.github}`,
    "",
    "## Guardrails",
    "",
    ...kit.guardrails.map((item) => `- ${item}`),
    "",
    ...kit.assetGroups.map(assetSection),
    ...kit.logoGroups.map(logoSection),
    "## Proof Boundary",
    "",
    kit.proofBoundary,
    "",
  ].join("\n");
}
