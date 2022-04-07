import init from "./init";

import { parseLog } from "./fsInteraction";
import { abstractLog } from "./src/log-abstraction";
import mineFromAbstraction from "./src/mining";

init();

const logPath = "./some-log";

const log = parseLog(logPath);

const logAbstraction = abstractLog(log);

const model = mineFromAbstraction(logAbstraction);
