"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copySet = exports.copyEventMap = void 0;
// Makes deep copy of a eventMap
const copyEventMap = (eventMap) => {
    const copy = {};
    for (const startEvent in eventMap) {
        copy[startEvent] = new Set(eventMap[startEvent]);
    }
    return copy;
};
exports.copyEventMap = copyEventMap;
const copySet = (set) => {
    return new Set(set);
};
exports.copySet = copySet;
