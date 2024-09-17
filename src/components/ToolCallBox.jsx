import React from 'react';

const ToolCallBox = ({ toolCall }) => {
  return (
    <div className="bg-gray-100 border border-gray-300 rounded-md p-2 mt-2">
      <h4 className="font-semibold text-sm text-gray-700 mb-1">Tool Call: {toolCall.function.name}</h4>
      <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
        <code>{JSON.stringify(toolCall.function.arguments, null, 2)}</code>
      </pre>
    </div>
  );
};

export default ToolCallBox;