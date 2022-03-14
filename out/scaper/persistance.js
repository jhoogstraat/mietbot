"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.save = exports.load = void 0;
const promises_1 = require("fs/promises");
const file = 'jobs.json';
async function load() {
    const raw = await (0, promises_1.readFile)(file, "utf-8");
    return new Map(JSON.parse(raw));
}
exports.load = load;
function save(jobs) {
    return (0, promises_1.writeFile)(file, JSON.stringify([...jobs]));
}
exports.save = save;
