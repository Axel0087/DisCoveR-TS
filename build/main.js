"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const init_1 = __importDefault(require("./init"));
const fsInteraction_1 = require("./fsInteraction");
const log_abstraction_1 = require("./src/log-abstraction");
const mining_1 = __importDefault(require("./src/mining"));
(0, init_1.default)();
const logPath = "../eventlogs/Dreyers Foundation.xes";
const log = (0, fsInteraction_1.parseLog)(logPath);
const logAbstraction = (0, log_abstraction_1.abstractLog)(log);
const model = (0, mining_1.default)(logAbstraction);
console.log(model);
