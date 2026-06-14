/** Shared SQL/helpers for first_lines shipped state (W4.5 legacy + new). */

export const SHIPPED_LINE_STATUSES = ['ready', 'qa_passed'] as const;

export function shippedStatusListSql(): string {
  return SHIPPED_LINE_STATUSES.map(s => `'${s}'`).join(', ');
}

/** COUNT expression for shipped variants in verify/repair scripts. */
export function countShippedLinesSql(flAlias?: string): string {
  const statusCol = flAlias ? `${flAlias}.status` : 'status';
  return `COUNT(*) FILTER (WHERE ${statusCol} IN (${shippedStatusListSql()}))`;
}

/** Pick best delivered line: prefers is_chosen, then highest qa_score. */
export const BEST_SHIPPED_LINE_LATERAL = `
  JOIN LATERAL (
    SELECT fl2.subject, fl2.opener, fl2.bridge, fl2.variant_number, fl2.qa_score
    FROM first_lines fl2
    WHERE fl2.prospect_id = p.id
      AND fl2.status IN ('ready', 'qa_passed')
    ORDER BY fl2.is_chosen DESC NULLS LAST,
             fl2.qa_score DESC NULLS LAST,
             fl2.variant_number ASC
    LIMIT 1
  ) fl ON true`;

export function prospectHasShippedLineSql(pAlias = 'p'): string {
  return `EXISTS (
    SELECT 1 FROM first_lines fl
    WHERE fl.prospect_id = ${pAlias}.id
      AND fl.status IN (${shippedStatusListSql()})
  )`;
}
