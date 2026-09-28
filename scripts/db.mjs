// Menyalakan/mematikan PostgreSQL lokal khusus proyek ini (port 5433).
// Data ada di ../pgdata-emigration (di luar repo). Pemakaian:
//   npm run db:start | db:stop | db:status
import { spawnSync } from "node:child_process";
import path from "node:path";

const PG_BIN = process.env.PG_BIN ?? "C:/Program Files/PostgreSQL/17/bin";
const DATA_DIR = path.resolve(import.meta.dirname, "../../pgdata-emigration");
const PORT = 5433;

const perintah = process.argv[2];
const argumen = {
  start: ["-o", `-p ${PORT} -c listen_addresses=localhost`, "-l", path.join(DATA_DIR, "server.log"), "-w", "start"],
  stop: ["stop"],
  status: ["status"],
}[perintah];

if (!argumen) {
  console.error("Pemakaian: node scripts/db.mjs <start|stop|status>");
  process.exit(1);
}

const hasil = spawnSync(path.join(PG_BIN, "pg_ctl"), ["-D", DATA_DIR, ...argumen], { stdio: "inherit" });
process.exit(hasil.status ?? 1);
