import { createRoute } from 'honox/factory';

export default createRoute((c) => {
  return c.render(
    <div>
      <h1>Welcome to GodWear!</h1>
      <p>Your HonoX application is now properly configured.</p>
    </div>
  );
});
