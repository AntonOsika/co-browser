import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import ToolUseBox from './ToolUseBox';

const Chat = ({ messages, onSendMessage, chatInput, setChatInput }) => {
  useEffect(() => {
    // This effect will run whenever chatInput changes
  }, [chatInput]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(chatInput);
      setChatInput('');
    }
  };

  const renderMessage = (message, index) => {
    if (message.role === 'tool_use') {
      return <ToolUseBox key={index} toolUse={message} />;
    }

    return (
      <div key={index} className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
        <span className={`inline-block p-2 rounded ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
          {message.content}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto mb-4">
        {messages.map((message, index) => renderMessage(message, index))}
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <Input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow mr-2"
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
};

export default Chat;
