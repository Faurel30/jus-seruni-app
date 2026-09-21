import { spawn } from "node:child_process";
import process from "node:process";

const children = [
  spawn(process.execPath, ["server/index.js"], { stdio: "inherit" }),
  spawn(process.execPath, ["node_modules/vite/bin/vite.js"], { stdio: "inherit" }),
];

function stopChildren() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopChildren();
    process.exit(0);
  });
}

for (const child of children) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      stopChildren();
      process.exit(code);
    }
  });
}
