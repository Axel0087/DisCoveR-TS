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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeGraph = exports.writeClassifiedLog = exports.parseClassifiedLog = exports.parseLog = void 0;
const fs_1 = __importDefault(require("fs"));
const fast_xml_parser_1 = __importStar(require("fast-xml-parser"));
const parserOptions = {
    attributeNamePrefix: "",
    attrNodeName: "attr",
    textNodeName: "#text",
    ignoreAttributes: false,
    ignoreNameSpace: false,
    allowBooleanAttributes: false,
    parseNodeValue: true,
    parseAttributeValue: true,
    trimValues: true,
    parseTrueNumberOnly: false,
    arrayMode: true,
    stopNodes: ["parse-me-as-string"],
};
const writingOptions = {
    attributeNamePrefix: "@",
    //attrNodeName: "@", //default is false
    //textNodeName: "#text",
    ignoreAttributes: false,
    //cdataTagName: "__cdata", //default is false
    //cdataPositionChar: "\\c",
    format: true,
    arrayMode: false,
    indentBy: "  ",
    supressEmptyNode: true,
};
// Parse .xes file to an EventLog
const parseLog = (filepath) => {
    if (!filepath.endsWith(".xes")) {
        throw new Error("Invalid file extension");
    }
    const data = fs_1.default.readFileSync(filepath);
    const logJson = fast_xml_parser_1.default.parse(data.toString(), parserOptions);
    const log = {
        events: new Set(),
        traces: {},
    };
    for (const i in logJson.log[0].trace) {
        const trace = [];
        let traceId = "";
        const xmlTrace = logJson.log[0].trace[i];
        for (const elem of xmlTrace.string) {
            if (elem.attr.key === "concept:name") {
                traceId = elem.attr.value;
            }
        }
        if (traceId === "") {
            throw new Error("No trace id found!");
        }
        const events = xmlTrace.event ? xmlTrace.event : [];
        for (const elem of events) {
            for (const event of elem.string) {
                if (event.attr.key === "concept:name") {
                    trace.push(event.attr.value);
                    log.events.add(event.attr.value);
                }
            }
        }
        log.traces[traceId] = trace;
    }
    return log;
};
exports.parseLog = parseLog;
const parseClassifiedLog = (filepath) => {
    if (!filepath.endsWith(".xes")) {
        throw new Error("Invalid file extension");
    }
    const data = fs_1.default.readFileSync(filepath);
    const logJson = fast_xml_parser_1.default.parse(data.toString(), parserOptions);
    const traces = {};
    for (const i in logJson.log[0].trace) {
        let traceId = "";
        let isPos;
        const xmlTrace = logJson.log[0].trace[i];
        for (const elem of xmlTrace.string) {
            if (elem.attr.key === "concept:name") {
                traceId = elem.attr.value;
            }
        }
        for (const elem of xmlTrace.boolean) {
            if (elem.attr.key === "pdc:isPos") {
                isPos = elem.attr.value;
            }
        }
        if (traceId === "") {
            throw new Error("No trace id found!");
        }
        if (isPos === undefined) {
            throw new Error("Classification not found!");
        }
        traces[traceId] = isPos;
    }
    return traces;
};
exports.parseClassifiedLog = parseClassifiedLog;
const writeClassifiedLog = (log, filepath) => {
    // Setting log metadata
    const xmlLog = {
        log: {
            "@xes.version": "1.0",
            "@xes.features": "nested-attributes",
            "@openxes.version": "1.0RC7",
            global: {
                "@scope": "event",
                string: {
                    "@key": "concept:name",
                    "@value": "__INVALID__",
                },
            },
            classifier: {
                "@name": "Event Name",
                "@keys": "concept:name",
            },
            trace: [],
        },
    };
    // Convert the classified log to a form that can be exported as xml
    for (const traceId in log) {
        const trace = log[traceId];
        const traceElem = {
            string: {
                "@key": "concept:name",
                "@value": traceId,
            },
            boolean: {
                "@key": "pdc:isPos",
                "@value": trace.isPositive,
            },
            event: [],
        };
        for (const event of trace.trace) {
            const eventElem = {
                string: {
                    "@key": "concept:name",
                    "@value": event,
                },
            };
            traceElem.event.push(eventElem);
        }
        xmlLog.log.trace.push(traceElem);
    }
    const parser = new fast_xml_parser_1.j2xParser(writingOptions);
    const xml = parser.parse(xmlLog);
    fs_1.default.writeFileSync(filepath, xml);
};
exports.writeClassifiedLog = writeClassifiedLog;
const writeGraph = (graph, filepath) => {
    let data = "";
    // Write events
    for (const event of graph.events) {
        data += "EVENT," + event + "\n";
    }
    // Write conditions
    for (const endEvent in graph.conditionsFor) {
        for (const startEvent of graph.conditionsFor[endEvent]) {
            data += "CONDITION," + startEvent + "," + endEvent + "\n";
        }
    }
    // Write milestones
    for (const endEvent in graph.milestonesFor) {
        for (const startEvent of graph.milestonesFor[endEvent]) {
            data += "MILESTONE," + startEvent + "," + endEvent + "\n";
        }
    }
    // Write reponses
    for (const startEvent in graph.responseTo) {
        for (const endEvent of graph.responseTo[startEvent]) {
            data += "RESPONSE," + startEvent + "," + endEvent + "\n";
        }
    }
    // Write excludes
    for (const startEvent in graph.excludesTo) {
        for (const endEvent of graph.excludesTo[startEvent]) {
            data += "EXCLUDE," + startEvent + "," + endEvent + "\n";
        }
    }
    // Write includes
    for (const startEvent in graph.includesTo) {
        for (const endEvent of graph.includesTo[startEvent]) {
            data += "INCLUDE," + startEvent + "," + endEvent + "\n";
        }
    }
    // Write to file
    fs_1.default.writeFileSync(filepath, data);
};
exports.writeGraph = writeGraph;
