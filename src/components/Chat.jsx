import React, { useRef, useEffect } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import ToolUseBox from './ToolUseBox';

const Chat = ({ messages, onSendMessage, chatInput, setChatInput }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(chatInput);
      setChatInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const renderMessage = (message, index) => {
    return (
      <div key={index} className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
        <span className={`inline-block p-2 rounded ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
          {message.content}
          {message.toolUses && message.toolUses.map((toolUse, toolIndex) => (
            <ToolUseBox key={toolIndex} toolUse={toolUse} />
          ))}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto mb-4 pr-2">
        {messages.map((message, index) => renderMessage(message, index))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <Textarea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-grow mr-2 resize-none"
          rows={3}
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
};

export default Chat;
