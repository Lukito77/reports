"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Data-retention purge. Permanently deletes reports (and their media objects)
 * older than DATA_RETENTION_DAYS that are in a terminal state (CLOSED/REJECTED).
 * Run on a schedule (cron / k8s CronJob): npm run purge:expired
 */
const models_1 = require("../models");
const mongoose_1 = require("../lib/mongoose");
const env_1 = require("../config/env");
const logger_1 = require("../lib/logger");
const reports_service_1 = require("../modules/reports/reports.service");
async function main() {
    await (0, mongoose_1.connectMongo)();
    const cutoff = new Date(Date.now() - env_1.env.DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const expired = await models_1.Report.find({
        updatedAt: { $lt: cutoff },
        status: { $in: [models_1.ReportStatus.CLOSED, models_1.ReportStatus.REJECTED] },
    }).select('_id');
    logger_1.logger.info(`Retention purge: ${expired.length} report(s) older than ${env_1.env.DATA_RETENTION_DAYS} days`);
    for (const r of expired) {
        try {
            await (0, reports_service_1.hardDeleteReport)(r.id);
        }
        catch (err) {
            logger_1.logger.error({ err, reportId: r.id }, 'Failed to purge report');
        }
    }
    logger_1.logger.info('Retention purge complete');
}
main()
    .catch((err) => {
    logger_1.logger.error({ err }, 'Purge job failed');
    process.exit(1);
})
    .finally(async () => {
    await (0, mongoose_1.disconnectMongo)();
});
//# sourceMappingURL=purgeExpired.js.map