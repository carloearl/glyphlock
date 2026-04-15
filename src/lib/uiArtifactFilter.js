export function isInternalArtifactItem(item) {
  const values = [
    item?.label,
    item?.page,
    item?.href,
    item?.name,
    item?.id,
    item?.path,
    item?.category,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return values.some((value) =>
    value.includes('internal_index') ||
    value.includes('audit') ||
    value.includes('execution_report') ||
    value.includes('execution report') ||
    value.includes('report') ||
    value.includes('scan') ||
    value.includes('sitemap') ||
    value.includes('dependencygraph') ||
    value.includes('dependency graph') ||
    value.includes('site_index') ||
    value.includes('system index')
  );
}

export function filterUiArtifacts(items = []) {
  return items.filter((item) => !isInternalArtifactItem(item));
}