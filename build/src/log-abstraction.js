"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.abstractLog = void 0;
const utility_1 = require("./utility");
// TODO: Refactor set ops
// Create abstraction of an EventLog in order to make fewer passes when mining constraints
const abstractLog = (log) => {
    const logAbstraction = {
        events: (0, utility_1.copySet)(log.events),
        traces: { ...log.traces },
        // At first we assume all events will be seen at least once
        // Once we see them twice in a trace, they are removed from atMostOnce
        atMostOnce: (0, utility_1.copySet)(log.events),
        chainPrecedenceFor: {},
        precedenceFor: {},
        predecessor: {},
        responseTo: {},
        successor: {},
    };
    // Initialize all EventMaps in the Log Abstraction.
    // Predecessor and successor sets start empty,
    // while the rest are initialized to be all events besides itself
    for (const event of log.events) {
        logAbstraction.chainPrecedenceFor[event] = (0, utility_1.copySet)(log.events);
        logAbstraction.chainPrecedenceFor[event].delete(event);
        logAbstraction.precedenceFor[event] = (0, utility_1.copySet)(log.events);
        logAbstraction.precedenceFor[event].delete(event);
        logAbstraction.responseTo[event] = (0, utility_1.copySet)(log.events);
        logAbstraction.responseTo[event].delete(event);
        logAbstraction.predecessor[event] = new Set();
        logAbstraction.successor[event] = new Set();
    }
    const parseTrace = (trace) => {
        const localAtLeastOnce = new Set();
        const localSeenOnlyBefore = {};
        let lastEvent = "";
        for (const event of trace) {
            // All events seen before this one must be predecessors
            logAbstraction.predecessor[event].union(localAtLeastOnce);
            // If event seen before in trace, remove from atMostOnce
            if (localAtLeastOnce.has(event)) {
                logAbstraction.atMostOnce.delete(event);
            }
            localAtLeastOnce.add(event);
            // Precedence for (event): All events that occured
            // before (event) are kept in the precedenceFor set
            logAbstraction.precedenceFor[event].intersect(localAtLeastOnce);
            // Chain-Precedence for (event): Some event must occur
            // immediately before (event) in all traces
            if (lastEvent !== "") {
                // If first time this clause is encountered - leaves lastEvent in chain-precedence set.
                // The intersect is empty if this clause is encountered again with another lastEvent.
                logAbstraction.chainPrecedenceFor[event].intersect(new Set([lastEvent]));
            }
            else {
                // First event in a trace, and chainPrecedence is therefore not possible
                logAbstraction.chainPrecedenceFor[event] = new Set();
            }
            // To later compute responses we note which events were seen
            // before (event) and not after
            if (logAbstraction.responseTo[event].size > 0) {
                // Save all events seen before (event)
                localSeenOnlyBefore[event] = (0, utility_1.copySet)(localAtLeastOnce);
            }
            // Clear (event) from all localSeenOnlyBefore, since (event) has now occured after
            for (const key in localSeenOnlyBefore) {
                localSeenOnlyBefore[key].delete(event);
            }
            lastEvent = event;
        }
        for (const event in localSeenOnlyBefore) {
            // Compute set of events in trace that happened after (event)
            const seenOnlyAfter = new Set(localAtLeastOnce).difference(localSeenOnlyBefore[event]);
            // Delete self-relation
            seenOnlyAfter.delete(event);
            // Set of events that always happens after (event)
            logAbstraction.responseTo[event].intersect(seenOnlyAfter);
        }
    };
    for (const traceId in log.traces) {
        const trace = log.traces[traceId];
        parseTrace(trace);
    }
    // Compute successor set based on duality with predecessor set
    for (const i in logAbstraction.predecessor) {
        for (const j of logAbstraction.predecessor[i]) {
            logAbstraction.successor[j].add(i);
        }
    }
    return logAbstraction;
};
exports.abstractLog = abstractLog;
