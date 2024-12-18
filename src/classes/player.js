/**
 * Represents a player/user in the system
 */
export default class Player {
    /** The unique identifier of the player */
    /** @type { string } */
    id;

    /** The display name of the player */
    /** @type { string } */
    name;

    /**
     * Creates a new Player instance
     * @param { import("#utils/prisma")["default"]["player"] } prismaPlayer - The Prisma player record
     */
    constructor(prismaPlayer) {
        this.id = prismaPlayer.id;
        this.name = prismaPlayer.name;
    }
}
