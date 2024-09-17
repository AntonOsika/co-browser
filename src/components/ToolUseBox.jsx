import React from 'react';

const ToolUseBox = ({ toolUse }) => {
  return (
    <div className="bg-gray-100 border border-gray-300 rounded-md p-3 my-2">
      <h4 className="font-semibold text-sm text-gray-700 mb-1">Tool Use: {toolUse.name}</h4>
      <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
        <code>{JSON.stringify(toolUse.input, null, 2)}</code>
      </pre>
    </div>
  );
};

export default ToolUseBox;