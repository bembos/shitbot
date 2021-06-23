const ethers = require('ethers');

export class EtherHelper {

    static PROVIDER;

    initialize() {
        PROVIDER = new ethers.providers.WebSocketProvider(env('WEBSOCKET_PROVIDER'));
    }
}