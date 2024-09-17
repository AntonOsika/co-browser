import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  let shell;

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'command') {
      if (!shell) {
        // Start a new shell session
        shell = spawn('bash');

        shell.stdout.on('data', (data) => {
          ws.send(JSON.stringify({ type: 'output', data: data.toString() }));
        });

        shell.stderr.on('data', (data) => {
          ws.send(JSON.stringify({ type: 'error', data: data.toString() }));
        });

        shell.on('close', (code) => {
          ws.send(JSON.stringify({ type: 'terminated', code: code }));
          shell = null;
        });
      }

      // Write the command to the shell's stdin
      shell.stdin.write(data.command + '\n');
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (shell) {
      shell.kill();
    }
  });
});

console.log('WebSocket server started on ws://localhost:8080');