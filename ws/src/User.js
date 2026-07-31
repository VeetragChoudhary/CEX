import { WebSocket } from "ws";
import {} from "./types/out.js";
import { SubscriptionManager } from "./SubscriptionManager.js";
import { SUBSCRIBE, UNSUBSCRIBE } from "./types/in.js";
export class User {
    id;
    ws;
    constructor(id, ws) {
        this.id = id;
        this.ws = ws;
        this.addListeners();
    }
    subscriptions = [];
    subscribe(subscription) {
        this.subscriptions.push(subscription);
    }
    unsubscribe(subscription) {
        this.subscriptions = this.subscriptions.filter(s => s !== subscription);
    }
    emit(message) {
        this.ws.send(JSON.stringify(message));
    }
    addListeners() {
        this.ws.on("message", (message) => {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.method === SUBSCRIBE) {
                parsedMessage.params.forEach(s => SubscriptionManager.getInstance().subscribe(this.id, s));
            }
            if (parsedMessage.method === UNSUBSCRIBE) {
                parsedMessage.params.forEach(s => SubscriptionManager.getInstance().unsubscribe(this.id, s));
            }
        });
    }
}
//# sourceMappingURL=User.js.map