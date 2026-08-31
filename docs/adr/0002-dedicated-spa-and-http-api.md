# ADR 0002: Dedicated SPA and HTTP API

Status: Accepted

The frontend is a client-rendered React/Vite SPA. Business data crosses a network-visible HTTP API. The SPA does not use server actions, direct DB drivers, or backend framework imports. This preserves independent deployment and technology boundaries.
