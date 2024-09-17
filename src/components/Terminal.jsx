import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';

const Terminal = ({ onBashCommand }) => {
  const [output, setOutput] = useState([]);
  const [input, setInput] = useState('');
  const [isReady, setIsReady] = useState(false);
  const outputRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = new WebSocket('ws://localhost:8080');

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
      appendToOutput('Disconnected from server.');
      setIsReady(false);
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
      onBashCommand(command);
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
