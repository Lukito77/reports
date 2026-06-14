'use client';

import { ReportStatus, STATUS_COLORS } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

export function StatusBadge({ status }: { status: ReportStatus }) {
  const { t } = useI18n();
  return <span className={`badge ${STATUS_COLORS[status]}`}>{t.status[status]}</span>;
}
