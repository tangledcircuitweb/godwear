export declare class GodWearSession {
    private state;
    private env;
    constructor(state: DurableObjectState, env: CloudflareBindings);
    fetch(request: Request): Promise<Response>;
    private handleGet;
    private handleSet;
    private handleDelete;
}
//# sourceMappingURL=GodWearSession.d.ts.map