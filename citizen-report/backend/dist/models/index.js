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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentRecord = exports.AiAnalysis = exports.AuditLog = exports.MediaAsset = exports.Report = exports.Category = exports.RefreshToken = exports.User = void 0;
/** Central export point for all Mongoose models, enums, and document types. */
__exportStar(require("./enums"), exports);
var User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
var RefreshToken_1 = require("./RefreshToken");
Object.defineProperty(exports, "RefreshToken", { enumerable: true, get: function () { return RefreshToken_1.RefreshToken; } });
var Category_1 = require("./Category");
Object.defineProperty(exports, "Category", { enumerable: true, get: function () { return Category_1.Category; } });
var Report_1 = require("./Report");
Object.defineProperty(exports, "Report", { enumerable: true, get: function () { return Report_1.Report; } });
var MediaAsset_1 = require("./MediaAsset");
Object.defineProperty(exports, "MediaAsset", { enumerable: true, get: function () { return MediaAsset_1.MediaAsset; } });
var AuditLog_1 = require("./AuditLog");
Object.defineProperty(exports, "AuditLog", { enumerable: true, get: function () { return AuditLog_1.AuditLog; } });
var AiAnalysis_1 = require("./AiAnalysis");
Object.defineProperty(exports, "AiAnalysis", { enumerable: true, get: function () { return AiAnalysis_1.AiAnalysis; } });
var ConsentRecord_1 = require("./ConsentRecord");
Object.defineProperty(exports, "ConsentRecord", { enumerable: true, get: function () { return ConsentRecord_1.ConsentRecord; } });
//# sourceMappingURL=index.js.map