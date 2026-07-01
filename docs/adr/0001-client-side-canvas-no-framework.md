# Client-side TypeScript + Canvas, no UI framework

The simulation is a self-contained real-time loop: all state (ants, pheromone field)
lives in browser memory, mutates ~60×/second, and is drawn to a `<canvas>` pixel buffer.
There is no server, no data fetching, and no HTML generated from data — so we build it as
a plain client-side TypeScript app bundled by Vite (vanilla-ts), with no component framework.

## Considered Options

- **Next.js** — rejected. Its value (SSR, routing, data fetching) is irrelevant here, and
  React's re-render model actively fights direct canvas mutation; we'd install a large
  framework only to bypass all of it inside one imperative `useEffect`.
- **HTMX** — rejected. It swaps server-rendered HTML fragments on user events; this app has
  no server round-trips and updates a pixel buffer, not the DOM. It has nothing to attach to.
- **Vite + vanilla-ts** — chosen. Just a fast dev server + bundler: gives us TypeScript,
  hot-reload, and module imports, then gets out of the way of the canvas loop.

Rule of thumb that drove this: Next.js/HTMX are for apps whose content comes from a server;
Vite is for a browser app that runs on its own. This is emphatically the latter.
