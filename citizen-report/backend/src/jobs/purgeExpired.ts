/**
 * Data-retention purge. Permanently deletes reports (and their media objects)
 * older than DATA_RETENTION_DAYS that are in a terminal state (CLOSED/REJECTED).
 * Run on a schedule (cron / k8s CronJob): npm run purge:expired
 */
import { ReportStatus, Report } from '../models';
import { connectMongo, disconnectMongo } from '../lib/mongoose';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { hardDeleteReport } from '../modules/reports/reports.service';

async function main() {
  await connectMongo();

  const cutoff = new Date(Date.now() - env.DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const expired = await Report.find({
    updatedAt: { $lt: cutoff },
    status: { $in: [ReportStatus.CLOSED, ReportStatus.REJECTED] },
  }).select('_id');

  logger.info(`Retention purge: ${expired.length} report(s) older than ${env.DATA_RETENTION_DAYS} days`);
  for (const r of expired) {
    try {
      await hardDeleteReport(r.id);
    } catch (err) {
      logger.error({ err, reportId: r.id }, 'Failed to purge report');
    }
  }
  logger.info('Retention purge complete');
}

main()
  .catch((err) => {
    logger.error({ err }, 'Purge job failed');
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMongo();
  });
