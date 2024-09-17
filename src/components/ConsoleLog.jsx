import React from 'react';

const ConsoleLog = ({ output }) => {
  return (
    <div className="bg-black text-green-400 p-4 h-full overflow-y-auto font-mono text-sm">
      <h3 className="text-white mb-2">Console Output:</h3>
      {output.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </div>
  );
};

export default ConsoleLog;