import { createRoute } from 'honox/factory';

export default createRoute((c) => {
  return c.render(
    <div>
      <h1>🔥 GodWear</h1>
      <p>Full-stack edge application powered by HonoX and Cloudflare</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>🚀 Features</h2>
        <ul>
          <li>✅ HonoX Full-Stack Framework</li>
          <li>✅ Cloudflare Pages Deployment</li>
          <li>✅ KV Storage Ready</li>
          <li>✅ D1 Database Ready</li>
          <li>✅ Durable Objects Ready</li>
          <li>✅ TypeScript Types Generated</li>
          <li>✅ Edge-First Architecture</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>🔗 Links</h2>
        <ul>
          <li><a href="/api/example">API Example</a> - Test KV and D1 bindings</li>
          <li><a href="https://developers.cloudflare.com/workers/">Cloudflare Workers Docs</a></li>
          <li><a href="https://github.com/honojs/honox">HonoX GitHub</a></li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h3>🎯 Next Steps</h3>
        <p>Your GodWear application is ready for development!</p>
        <p>All Cloudflare services are configured and TypeScript types are generated.</p>
      </div>
    </div>
  );
});
