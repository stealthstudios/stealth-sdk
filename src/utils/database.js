// temporary JSON database
// we keep a copy of the database in memory and replicate it to the file system

import fs from "fs";
import path from "path";

const DATABASE_PATH = path.join(process.cwd(), "data", "database.json");

if (!fs.existsSync(DATABASE_PATH)) {
    fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });
    fs.writeFileSync(DATABASE_PATH, "{}", { flag: "w" });
}

const database = JSON.parse(fs.readFileSync(DATABASE_PATH, "utf8"));

class Database {
    constructor() {
        this.database = database;
    }

    save() {
        fs.writeFileSync(
            DATABASE_PATH,
            JSON.stringify(this.database, null, 2),
            { flag: "w" },
        );
    }

    get(key) {
        return this.database[key];
    }

    getAll() {
        return this.database;
    }

    getWhere(predicate) {
        return Object.fromEntries(
            Object.entries(this.database).filter(([key, value]) =>
                predicate(key, value),
            ),
        );
    }

    set(key, value) {
        this.database[key] = value;
        this.save();
    }
}

export default new Database();
