import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';

const ConsoleLog = ({ output, onExecute }) => {
  const [input, setInput] = useState('');
  const outputEndRef = useRef(null);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onExecute(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-green-400 p-4 font-mono text-sm">
      <div className="flex-grow overflow-y-auto mb-4">
        {output.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
        <div ref={outputEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter JavaScript code..."
          className="flex-grow mr-2 bg-gray-800 text-green-400 border-green-400"
        />
        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
          Execute
        </Button>
      </form>
    </div>
  );
};

export default ConsoleLog;
