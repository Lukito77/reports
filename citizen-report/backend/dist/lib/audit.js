"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordAudit = recordAudit;
const models_1 = require("../models");
const logger_1 = require("./logger");
async function recordAudit({ action, actorId, reportId, metadata, req }) {
    try {
        await models_1.AuditLog.create({
            action,
            actorId: actorId ?? null,
            reportId: reportId ?? null,
            metadata: metadata ?? null,
            ip: req?.ip,
            userAgent: req?.headers['user-agent']?.toString().slice(0, 512),
        });
    }
    catch (err) {
        // Auditing must never break the request, but failures must be visible.
        logger_1.logger.error({ err, action }, 'Failed to write audit log');
    }
}
//# sourceMappingURL=audit.js.map