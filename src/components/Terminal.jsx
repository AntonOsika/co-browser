import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';

const Terminal = () => {
  const [output, setOutput] = useState([]);
  const [input, setInput] = useState('');
  const [isReady, setIsReady] = useState(false);
  const outputRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = 8080; // Ensure this matches your WebSocket server port
    const wsUrl = `${protocol}//${host}:${port}`;

    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.addEventListener('open', () => {
      console.log('Connected to WebSocket server');
      appendToOutput('Connected to server. Type a command and press Enter.');
      setIsReady(true);
    });

    socketRef.current.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      
      switch(message.type) {
        case 'output':
        case 'error':
          appendToOutput(message.data);
          break;
        case 'terminated':
          appendToOutput(`Shell terminated with code ${message.code}`);
          break;
      }
    });

    socketRef.current.addEventListener('close', () => {
      console.log('Disconnected from WebSocket server');
      appendToOutput('Disconnected from server. Attempting to reconnect...');
      setIsReady(false);
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (socketRef.current.readyState === WebSocket.CLOSED) {
          socketRef.current = new WebSocket(wsUrl);
        }
      }, 5000);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const appendToOutput = (text) => {
    setOutput(prev => [...prev, text]);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleInputKeyUp = (e) => {
    if (e.key === 'Enter' && isReady) {
      const command = input;
      appendToOutput(`$ ${command}`);
      socketRef.current.send(JSON.stringify({ type: 'command', command: command }));
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white font-mono text-sm p-4">
      <div ref={outputRef} className="flex-grow overflow-y-auto mb-4">
        {output.map((line, index) => (
          <div key={index} dangerouslySetInnerHTML={{ __html: line.replace(/\n/g, '<br>') }} />
        ))}
      </div>
      <Input
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyUp={handleInputKeyUp}
        placeholder="Enter command"
        disabled={!isReady}
        className="bg-black text-white border-white"
      />
    </div>
  );
};

export default Terminal;
