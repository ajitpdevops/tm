// Placeholder integration test: proves CI's Postgres and Redis services are reachable.
// Replace with real vitest integration tests once the Drizzle schema lands (M1).
import net from "node:net";

function check(name, url) {
  const { hostname, port } = new URL(url);
  return new Promise((resolve, reject) => {
    const s = net.connect({ host: hostname, port: Number(port) }, () => { s.end(); resolve(); });
    s.setTimeout(5000, () => reject(new Error(`${name} timeout`)));
    s.on("error", (e) => reject(new Error(`${name}: ${e.message}`)));
  });
}

await check("postgres", process.env.DATABASE_URL ?? "");
await check("redis", process.env.REDIS_URL ?? "");
console.log("integration: postgres and redis reachable");
