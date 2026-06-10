"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const ctrl = __importStar(require("./users.controller"));
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get the current user's profile
 */
router.get('/me', ctrl.me);
/**
 * @openapi
 * /users/me/export:
 *   get:
 *     tags: [Users]
 *     summary: GDPR data export (download all personal data as JSON)
 */
router.get('/me/export', ctrl.exportData);
/**
 * @openapi
 * /users/me:
 *   delete:
 *     tags: [Users]
 *     summary: GDPR erasure — delete account and anonymize reports
 */
router.delete('/me', ctrl.eraseAccount);
exports.default = router;
//# sourceMappingURL=users.routes.js.map