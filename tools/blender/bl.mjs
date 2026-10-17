// Sends a Python script to the running Blender MCP add-on (port 9876) and prints the result.
// Usage: node tools/blender/bl.mjs <script.py> [timeoutSeconds]
import net from 'node:net';
import fs from 'node:fs';

const [, , scriptPath, timeoutArg] = process.argv;
if (!scriptPath) {
  console.error('Usage: node tools/blender/bl.mjs <script.py> [timeoutSeconds]');
  process.exit(1);
}

const code = fs.readFileSync(scriptPath, 'utf8');
const timeoutMs = Number(timeoutArg ?? 600) * 1000;
const socket = net.connect(9876, '127.0.0.1');
let buffer = '';

const timer = setTimeout(() => {
  console.error('Timed out waiting for Blender');
  socket.destroy();
  process.exit(2);
}, timeoutMs);

socket.on('connect', () => {
  socket.write(JSON.stringify({ type: 'execute_code', params: { code } }));
});

socket.on('data', (chunk) => {
  buffer += chunk.toString('utf8');
  let reply;
  try {
    reply = JSON.parse(buffer);
  } catch {
    return; // response not complete yet
  }
  clearTimeout(timer);
  socket.end();
  if (reply.status !== 'success') {
    console.error(reply.message ?? JSON.stringify(reply));
    process.exit(1);
  }
  const result = reply.result?.result ?? reply.result;
  console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
});

socket.on('error', (err) => {
  clearTimeout(timer);
  console.error(`Cannot reach Blender add-on: ${err.message}`);
  process.exit(1);
});
