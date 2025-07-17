import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";

const handler = (c) => {
    return c.render(_jsxs("div", { children: [_jsx("h1", { children: "404 - Page Not Found" }), _jsx("p", { children: "Sorry, the page you're looking for doesn't exist." })] }));
};
export default handler;
//# sourceMappingURL=_404.js.map