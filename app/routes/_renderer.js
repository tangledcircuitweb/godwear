import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { jsxRenderer } from "hono/jsx-renderer";
export default jsxRenderer(({ children, ...props }) => {
    // Extract title from props if it exists
    const title = props.title || "GodWear";
    return (_jsxs("html", { lang: "en", children: [_jsxs("head", { children: [_jsx("meta", { charSet: "UTF-8" }), _jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }), _jsx("title", { children: title }), import.meta.env.PROD ? (_jsx("script", { type: "module", src: "/static/client.js" })) : (_jsx("script", { type: "module", src: "/app/client.ts" }))] }), _jsx("body", { children: children })] }));
});
//# sourceMappingURL=_renderer.js.map