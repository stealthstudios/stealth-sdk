import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";
import Database from "better-sqlite3";
import path from "path";

export function initializeDatabase(dataDir) {
    const filePath =
        process.env.SQLITE_FILE ?? path.resolve(dataDir, "db.sqlite");
    return new SqliteDatabaseAdapter(new Database(filePath));
}
