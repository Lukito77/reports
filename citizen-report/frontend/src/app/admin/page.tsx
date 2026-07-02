'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { FileText, Users, Clock, CheckCircle2 } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { AnalyticsData, ReportStatus } from '@/lib/types';

const STATUS_COLORS: Record<ReportStatus, string> = {
  SUBMITTED: '#94a3b8',
  UNDER_REVIEW: '#3b82f6',
  INFO_REQUESTED: '#f59e0b',
  APPROVED: '#22c55e',
  REJECTED: '#ef4444',
  CLOSED: '#64748b',
};

export default function AdminDashboardPage() {
  const { t, lang } = useI18n();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: number) => {
    try {
      setData(await apiFetch<AnalyticsData>(`/admin/analytics?days=${d}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load analytics');
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [load, days]);

  const tr = (ka: string, en: string) => (lang === 'ka' ? ka : en);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-center text-slate-500">{t.admin.loading}</p>;

  const reportsConfig = {
    count: { label: tr('განაცხადები', 'Reports'), color: 'rgb(var(--brand-600))' },
  } satisfies ChartConfig;
  const usersConfig = {
    count: { label: tr('მომხმარებლები', 'Users'), color: 'rgb(var(--brand-500))' },
  } satisfies ChartConfig;
  const categoryConfig = {
    count: { label: tr('განაცხადები', 'Reports'), color: 'rgb(var(--brand-600))' },
  } satisfies ChartConfig;
  const statusConfig = Object.fromEntries(
    data.byStatus.map((s) => [s.status, { label: t.status[s.status], color: STATUS_COLORS[s.status] }]),
  ) satisfies ChartConfig;

  const stats = [
    { label: tr('სულ განაცხადი', 'Total reports'), value: data.totals.reports, icon: FileText },
    { label: tr('მომხმარებლები', 'Users'), value: data.totals.users, icon: Users },
    { label: tr('განსახილველი', 'Pending review'), value: data.totals.pendingReview, icon: Clock },
    { label: tr('დამტკიცებული', 'Approved'), value: data.totals.approved, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{tr('მთავარი დაფა', 'Dashboard')}</h1>
        <select
          className="input w-auto"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>{tr('ბოლო 7 დღე', 'Last 7 days')}</option>
          <option value={30}>{tr('ბოლო 30 დღე', 'Last 30 days')}</option>
          <option value={90}>{tr('ბოლო 90 დღე', 'Last 90 days')}</option>
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <div className="text-3xl font-bold">{s.value}</div>
                  <div className="mt-1 text-xs text-slate-500">{s.label}</div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reports over time */}
      <Card>
        <CardHeader>
          <CardTitle>{tr('განაცხადები დროის მიხედვით', 'Reports over time')}</CardTitle>
          <CardDescription>{tr(`ბოლო ${days} დღე`, `Last ${days} days`)}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={reportsConfig} className="aspect-[3/1] w-full">
            <AreaChart data={data.reportsOverTime} margin={{ left: 0, right: 12, top: 8 }}>
              <defs>
                <linearGradient id="fillReports" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="count"
                type="monotone"
                stroke="var(--color-count)"
                strokeWidth={2}
                fill="url(#fillReports)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By status (donut) */}
        <Card>
          <CardHeader>
            <CardTitle>{tr('სტატუსების მიხედვით', 'By status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusConfig} className="mx-auto aspect-square max-h-[300px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
                <Pie
                  data={data.byStatus}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={55}
                  strokeWidth={3}
                >
                  {data.byStatus.map((s) => (
                    <Cell key={s.status} fill={STATUS_COLORS[s.status]} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="status" />} className="flex-wrap" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* By category (bar) */}
        <Card>
          <CardHeader>
            <CardTitle>{tr('კატეგორიების მიხედვით', 'By category')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={categoryConfig} className="aspect-square max-h-[300px] w-full">
              <BarChart
                data={data.byCategory}
                layout="vertical"
                margin={{ left: 8, right: 12 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey={lang === 'en' ? 'nameEn' : 'name'}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tickFormatter={(v: string) => (v && v.length > 16 ? `${v.slice(0, 15)}…` : v)}
                />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* User growth */}
      <Card>
        <CardHeader>
          <CardTitle>{tr('მომხმარებლების ზრდა', 'User growth')}</CardTitle>
          <CardDescription>{tr('ბოლო 12 თვე (ახალი ანგარიშები)', 'Last 12 months (new accounts)')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={usersConfig} className="aspect-[3/1] w-full">
            <LineChart data={data.usersOverTime} margin={{ left: 0, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey="count"
                type="monotone"
                stroke="var(--color-count)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
