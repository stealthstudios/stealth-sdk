import { CacheManager, DbCacheAdapter } from "@elizaos/core";

export function initializeDbCache(character, db) {
    return new CacheManager(new DbCacheAdapter(db, character.id));
}
