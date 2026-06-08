import { ReportStatus, STATUS_COLORS, STATUS_LABELS } from '@/lib/types';

export function StatusBadge({ status }: { status: ReportStatus }) {
  return <span className={`badge ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>;
}
