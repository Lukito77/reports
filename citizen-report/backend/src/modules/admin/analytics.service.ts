/**
 * Dashboard analytics: totals + time series + breakdowns powering the shadcn
 * charts. All read-only aggregations.
 */
import { Report, User, Category, ReportStatus } from '../../models';

/** Build a zero-filled YYYY-MM-DD series for the last `days` days. */
function emptyDailySeries(days: number): { date: string; count: number }[] {
  const out: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  return out;
}

/** Build a zero-filled YYYY-MM series for the last `months` months. */
function emptyMonthlySeries(months: number): { month: string; count: number }[] {
  const out: { month: string; count: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ month: d.toISOString().slice(0, 7), count: 0 });
  }
  return out;
}

export async function getAnalytics(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const monthsBack = 12;
  const sinceMonth = new Date();
  sinceMonth.setMonth(sinceMonth.getMonth() - (monthsBack - 1));
  sinceMonth.setDate(1);
  sinceMonth.setHours(0, 0, 0, 0);

  const [
    totalReports,
    totalUsers,
    totalCategories,
    byStatusRows,
    perDayRows,
    perMonthUserRows,
    byCategoryRows,
  ] = await Promise.all([
    Report.countDocuments(),
    User.countDocuments(),
    Category.countDocuments(),
    Report.aggregate<{ _id: ReportStatus; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Report.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
    User.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: sinceMonth } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
    Report.aggregate<{ _id: string | null; count: number; name: string | null }>([
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'cat',
        },
      },
      {
        $project: {
          count: 1,
          name: { $ifNull: [{ $arrayElemAt: ['$cat.name', 0] }, 'Uncategorized'] },
          nameEn: { $arrayElemAt: ['$cat.nameEn', 0] },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  // Status breakdown (ensure every status appears, even at 0).
  const statusMap = Object.fromEntries(byStatusRows.map((r) => [r._id, r.count]));
  const byStatus = Object.values(ReportStatus).map((status) => ({
    status,
    count: statusMap[status] ?? 0,
  }));

  // Daily reports series (zero-filled).
  const dayMap = Object.fromEntries(perDayRows.map((r) => [r._id, r.count]));
  const reportsOverTime = emptyDailySeries(days).map((d) => ({
    date: d.date,
    count: dayMap[d.date] ?? 0,
  }));

  // Monthly new-users series (zero-filled).
  const monthMap = Object.fromEntries(perMonthUserRows.map((r) => [r._id, r.count]));
  const usersOverTime = emptyMonthlySeries(monthsBack).map((m) => ({
    month: m.month,
    count: monthMap[m.month] ?? 0,
  }));

  const byCategory = byCategoryRows.map((r) => ({
    name: r.name ?? 'Uncategorized',
    nameEn: (r as { nameEn?: string }).nameEn ?? null,
    count: r.count,
  }));

  const pendingReview =
    (statusMap[ReportStatus.SUBMITTED] ?? 0) + (statusMap[ReportStatus.UNDER_REVIEW] ?? 0);

  return {
    totals: {
      reports: totalReports,
      users: totalUsers,
      categories: totalCategories,
      pendingReview,
      approved: statusMap[ReportStatus.APPROVED] ?? 0,
    },
    byStatus,
    byCategory,
    reportsOverTime,
    usersOverTime,
  };
}
