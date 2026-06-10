"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
/**
 * JWT access-token helpers. Access tokens are short-lived and stateless; the
 * embedded `tv` (tokenVersion) lets us revoke all of a user's access tokens by
 * bumping their stored tokenVersion (e.g. on logout / password change).
 */
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function signAccessToken(payload) {
    const opts = { expiresIn: env_1.env.JWT_ACCESS_TTL };
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, opts);
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
}
//# sourceMappingURL=jwt.js.map