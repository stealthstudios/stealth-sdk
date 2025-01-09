import { RobloxClientInterface } from "./robloxClient.js";

export async function initializeClient(character, runtime) {
    return await RobloxClientInterface.start(runtime);
}
