import type { EventMap } from "../types";

// Makes deep copy of a eventMap
export const copyEventMap = (eventMap: EventMap): EventMap => {
  const copy: EventMap = {};
  for (const startEvent in eventMap) {
    copy[startEvent] = new Set(eventMap[startEvent]);
  }
  return copy;
};

export const copySet = <T>(set: Set<T>): Set<T> => {
  return new Set(set);
};
