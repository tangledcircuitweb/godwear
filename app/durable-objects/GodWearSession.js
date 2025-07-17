export class GodWearSession {
    state;
    env;
    constructor(state, env) {
        this.state = state;
        this.env = env;
    }
    fetch(request) {
        const url = new URL(request.url);
        switch (url.pathname) {
            case "/get":
                return this.handleGet(request);
            case "/set":
                return this.handleSet(request);
            case "/delete":
                return this.handleDelete(request);
            default:
                return Promise.resolve(new Response("Not found", { status: 404 }));
        }
    }
    async handleGet(request) {
        const url = new URL(request.url);
        const key = url.searchParams.get("key");
        if (!key) {
            return new Response("Key parameter required", { status: 400 });
        }
        const value = await this.state.storage.get(key);
        return new Response(JSON.stringify({ key, value }), {
            headers: { "Content-Type": "application/json" },
        });
    }
    async handleSet(request) {
        const body = (await request.json());
        if (!body.key) {
            return new Response("Key required", { status: 400 });
        }
        await this.state.storage.put(body.key, body.value);
        return new Response(JSON.stringify({ success: true, key: body.key, value: body.value }), {
            headers: { "Content-Type": "application/json" },
        });
    }
    async handleDelete(request) {
        const url = new URL(request.url);
        const key = url.searchParams.get("key");
        if (!key) {
            return new Response("Key parameter required", { status: 400 });
        }
        await this.state.storage.delete(key);
        return new Response(JSON.stringify({ success: true, deleted: key }), {
            headers: { "Content-Type": "application/json" },
        });
    }
}
//# sourceMappingURL=GodWearSession.js.map