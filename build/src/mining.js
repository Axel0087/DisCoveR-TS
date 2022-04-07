"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utility_1 = require("./utility");
// TODO: Refactor set ops
// Removes redundant relations based on transitive closure
const optimizeRelation = (relation) => {
    for (const eventA in relation) {
        for (const eventB of relation[eventA]) {
            relation[eventA].difference(relation[eventB]);
        }
    }
};
// Main mining method, the findAdditionalConditions flag breaks the discovered model when converting to petri-net
const mineFromAbstraction = (logAbstraction, findAdditionalConditions = true) => {
    // Initialize graph
    const graph = {
        // Note that events become an alias, but this is irrelevant since events are never altered
        events: logAbstraction.events,
        conditionsFor: {},
        excludesTo: {},
        includesTo: {},
        milestonesFor: {},
        responseTo: {},
        marking: {
            executed: new Set(),
            pending: new Set(),
            included: (0, utility_1.copySet)(logAbstraction.events),
        },
    };
    // Initialize all mappings to avoid indexing errors
    for (const event of graph.events) {
        graph.conditionsFor[event] = new Set();
        graph.excludesTo[event] = new Set();
        graph.includesTo[event] = new Set();
        graph.responseTo[event] = new Set();
        graph.milestonesFor[event] = new Set();
    }
    // Mine self-exclusions
    for (const event of logAbstraction.atMostOnce) {
        graph.excludesTo[event].add(event);
    }
    // Mine responses from logAbstraction
    graph.responseTo = (0, utility_1.copyEventMap)(logAbstraction.responseTo);
    // Remove redundant responses
    optimizeRelation(graph.responseTo);
    // Mine conditions from logAbstraction
    graph.conditionsFor = (0, utility_1.copyEventMap)(logAbstraction.precedenceFor);
    // remove redundant conditions
    optimizeRelation(graph.conditionsFor);
    // For each chainprecedence(i,j) we add: include(i,j) exclude(j,j)
    for (const j in logAbstraction.chainPrecedenceFor) {
        for (const i of logAbstraction.chainPrecedenceFor[j]) {
            graph.includesTo[i].add(j);
            graph.excludesTo[j].add(j);
        }
    }
    // Additional excludes based on predecessors / successors
    for (const event of logAbstraction.events) {
        // Union of predecessor and successors sets, i.e. all events occuring in the same trace as event
        const coExisters = new Set(logAbstraction.predecessor[event]).union(logAbstraction.successor[event]);
        const nonCoExisters = new Set(logAbstraction.events).difference(coExisters);
        nonCoExisters.delete(event);
        // Note that if events i & j do not co-exist, they should exclude each other.
        // Here we only add i -->% j, but on the iteration for j, j -->% i will be added.
        graph.excludesTo[event].union(nonCoExisters);
        // if s precedes (event) but never succeeds (event) add (event) -->% s if s -->% s does not exist
        const precedesButNeverSuceeds = new Set(logAbstraction.predecessor[event]).difference(logAbstraction.successor[event]);
        for (const s of precedesButNeverSuceeds) {
            if (!graph.excludesTo[s].has(s)) {
                graph.excludesTo[event].add(s);
            }
        }
    }
    // Removing redundant excludes.
    // If r always precedes s, and r -->% t, then s -->% t is (mostly) redundant
    for (const s in logAbstraction.precedenceFor) {
        for (const r of logAbstraction.precedenceFor[s]) {
            for (const t of graph.excludesTo[r]) {
                graph.excludesTo[s].delete(t);
            }
        }
    }
    if (findAdditionalConditions) {
        // Mining additional conditions:
        // Every event, x, that occurs before some event, y, is a possible candidate for a condition x -->* y
        // This is due to the fact, that in the traces where x does not occur before y, x might be excluded
        const possibleConditions = (0, utility_1.copyEventMap)(logAbstraction.predecessor);
        // Replay entire log, filtering out any invalid conditions
        for (const traceId in logAbstraction.traces) {
            const trace = logAbstraction.traces[traceId];
            const localSeenBefore = new Set();
            const included = (0, utility_1.copySet)(logAbstraction.events);
            for (const event of trace) {
                // Compute conditions that still allow event to be executed
                const excluded = (0, utility_1.copySet)(logAbstraction.events).difference(included);
                const validConditions = (0, utility_1.copySet)(localSeenBefore).union(excluded);
                // Only keep valid conditions
                possibleConditions[event].intersect(validConditions);
                // Execute excludes starting from (event)
                included.difference(graph.excludesTo[event]);
                // Execute includes starting from (event)
                included.union(graph.includesTo[event]);
            }
        }
        // Now the only possibleCondtitions that remain are valid for all traces
        // These are therefore added to the graph
        for (const key in graph.conditionsFor) {
            graph.conditionsFor[key].union(possibleConditions[key]);
        }
        // Removing redundant conditions
        optimizeRelation(graph.conditionsFor);
    }
    return graph;
};
exports.default = mineFromAbstraction;
