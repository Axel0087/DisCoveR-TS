// -----------------------------------------------------------
// -------------------- Extended Set Type --------------------
// -----------------------------------------------------------

declare global {
  interface Set<T> {
    union(b: Set<T>): Set<T>;
    intersect(b: Set<T>): Set<T>;
    difference(b: Set<T>): Set<T>;
  }
}

// -----------------------------------------------------------
// --------------------- DCR Graph Types ---------------------
// -----------------------------------------------------------

export type Event = string;

export interface Marking {
  executed: Set<Event>;
  included: Set<Event>;
  pending: Set<Event>;
}

// Map from event to a set of events
// Used to denote different relations between events
export interface EventMap {
  [startEventId: string]: Set<Event>;
}

export interface DCRGraph {
  events: Set<Event>;
  conditionsFor: EventMap;
  milestonesFor: EventMap;
  responseTo: EventMap;
  includesTo: EventMap;
  excludesTo: EventMap;
  marking: Marking;
}

// -----------------------------------------------------------
// ------------------------ Log Types ------------------------
// -----------------------------------------------------------

export type Trace = Array<Event>;

export interface EventLog {
  events: Set<Event>;
  traces: {
    [traceId: string]: Trace;
  };
}

export interface ClassifiedLog {
  [traceId: string]: {
    isPositive: boolean;
    trace: Trace;
  };
}

export interface ClassifiedTraces {
  [traceId: string]: boolean;
}

export interface XMLEvent {
  string: {
    "@key": "concept:name";
    "@value": string;
  };
}

export interface XMLTrace {
  string: {
    "@key": "concept:name";
    "@value": string;
  };
  boolean: {
    "@key": "pdc:isPos";
    "@value": boolean;
  };
  event: Array<XMLEvent>;
}

export interface XMLLog {
  log: {
    "@xes.version": "1.0";
    "@xes.features": "nested-attributes";
    "@openxes.version": "1.0RC7";
    global: {
      "@scope": "event";
      string: {
        "@key": "concept:name";
        "@value": "__INVALID__";
      };
    };
    classifier: {
      "@name": "Event Name";
      "@keys": "concept:name";
    };
    trace: Array<XMLTrace>;
  };
}

// Abstraction of the log used for mining
export interface LogAbstraction {
  events: Set<Event>;
  traces: {
    [traceId: string]: Trace;
  };
  chainPrecedenceFor: EventMap;
  precedenceFor: EventMap;
  responseTo: EventMap;
  predecessor: EventMap;
  successor: EventMap;
  atMostOnce: Set<Event>;
}
