"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCaptcha = verifyCaptcha;
const env_1 = require("../config/env");
const error_1 = require("./error");
const logger_1 = require("../lib/logger");
const VERIFY_URL = {
    hcaptcha: 'https://hcaptcha.com/siteverify',
    recaptcha: 'https://www.google.com/recaptcha/api/siteverify',
};
async function verifyCaptcha(req, _res, next) {
    if (env_1.env.CAPTCHA_PROVIDER === 'none')
        return next();
    const token = req.headers['x-captcha-token'] ||
        (req.body && req.body.captchaToken);
    if (!token)
        return next(error_1.ApiError.badRequest('CAPTCHA token missing'));
    try {
        const body = new URLSearchParams({ secret: env_1.env.CAPTCHA_SECRET, response: token });
        const resp = await fetch(VERIFY_URL[env_1.env.CAPTCHA_PROVIDER], { method: 'POST', body });
        const data = (await resp.json());
        if (!data.success)
            return next(error_1.ApiError.badRequest('CAPTCHA verification failed'));
        next();
    }
    catch (err) {
        logger_1.logger.error({ err }, 'CAPTCHA provider error');
        next(error_1.ApiError.badRequest('CAPTCHA verification unavailable'));
    }
}
//# sourceMappingURL=captcha.js.map