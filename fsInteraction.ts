import {
  EventLog,
  Trace,
  Event,
  DCRGraph,
  ClassifiedLog,
  XMLLog,
  XMLTrace,
  XMLEvent,
  ClassifiedTraces,
} from "./types";

import fs from "fs";
import parser, { j2xParser } from "fast-xml-parser";

const parserOptions = {
  attributeNamePrefix: "",
  attrNodeName: "attr", //default is 'false'
  textNodeName: "#text",
  ignoreAttributes: false,
  ignoreNameSpace: false,
  allowBooleanAttributes: false,
  parseNodeValue: true,
  parseAttributeValue: true,
  trimValues: true,
  parseTrueNumberOnly: false,
  arrayMode: true, //"strict"
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
export const parseLog = (filepath: string): EventLog => {
  if (!filepath.endsWith(".xes")) {
    throw new Error("Invalid file extension");
  }
  const data = fs.readFileSync(filepath);
  const logJson = parser.parse(data.toString(), parserOptions);
  const log: EventLog = {
    events: new Set<Event>(),
    traces: {},
  };

  for (const i in logJson.log[0].trace) {
    const trace: Trace = [];
    let traceId: string = "";
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

export const parseClassifiedLog = (filepath: string): ClassifiedTraces => {
  if (!filepath.endsWith(".xes")) {
    throw new Error("Invalid file extension");
  }
  const data = fs.readFileSync(filepath);
  const logJson = parser.parse(data.toString(), parserOptions);
  const traces: ClassifiedTraces = {};

  for (const i in logJson.log[0].trace) {
    let traceId: string = "";
    let isPos: undefined;
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

export const writeClassifiedLog = (log: ClassifiedLog, filepath: string) => {
  // Setting log metadata
  const xmlLog: XMLLog = {
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
    const traceElem: XMLTrace = {
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
      const eventElem: XMLEvent = {
        string: {
          "@key": "concept:name",
          "@value": event,
        },
      };
      traceElem.event.push(eventElem);
    }
    xmlLog.log.trace.push(traceElem);
  }
  const parser = new j2xParser(writingOptions);
  const xml = parser.parse(xmlLog);
  fs.writeFileSync(filepath, xml);
};

export const writeGraph = (graph: DCRGraph, filepath: string) => {
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
  fs.writeFileSync(filepath, data);
};
