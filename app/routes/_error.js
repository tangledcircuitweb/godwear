import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";

const handler = (e, c) => {
    return c.render(_jsxs("div", { children: [_jsx("h1", { children: "Error!" }), _jsx("p", { children: e.message })] }));
};
export default handler;
//# sourceMappingURL=_error.js.map