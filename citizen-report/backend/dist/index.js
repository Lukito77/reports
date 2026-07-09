"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./lib/logger");
const mongoose_1 = require("./lib/mongoose");
async function start() {
    await (0, mongoose_1.connectMongo)();
    logger_1.logger.info('Connected to MongoDB');
    // სწორად ვიღებთ app-ს ობიექტიდან, რომელსაც createApp() აბრუნებს
    const { app } = (0, app_1.createApp)();
    const server = app.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`Reports API listening on :${env_1.env.PORT} (${env_1.env.NODE_ENV})`);
        logger_1.logger.info(`API docs at http://localhost:${env_1.env.PORT}/api/docs`);
    });
    // Graceful shutdown.
    async function shutdown(signal) {
        logger_1.logger.info(`${signal} received, shutting down...`);
        server.close(async () => {
            await (0, mongoose_1.disconnectMongo)();
            process.exit(0);
        });
        // Force-exit if not closed in time.
        setTimeout(() => process.exit(1), 10_000).unref();
    }
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
}
start().catch((err) => {
    logger_1.logger.error({ err }, 'Failed to start server');
    process.exit(1);
});
//# sourceMappingURL=index.js.map