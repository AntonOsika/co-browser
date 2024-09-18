import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import autosize from 'autosize';

const Chat = ({ renderMessages, onSendMessage, chatInput, setChatInput }) => {
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [renderMessages]);

  useEffect(() => {
    if (textareaRef.current) {
      autosize(textareaRef.current);
    }
    return () => {
      if (textareaRef.current) {
        autosize.destroy(textareaRef.current);
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(chatInput);
      setChatInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const ToolUseBox = ({ toolUse }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    const inputContent = JSON.stringify(toolUse.input, null, 2);
    const lines = inputContent.split('\n');
    const displayContent = isCollapsed ? lines.slice(0, 3).join('\n') : inputContent;

    return (
      <div className="bg-gray-100 border border-gray-300 rounded-md p-2 mt-2">
        <h4 className="font-semibold text-sm text-gray-700 mb-1">Tool Use: {toolUse.name}</h4>
        <pre className="text-xs bg-white p-2 rounded overflow-x-auto whitespace-pre-wrap">
          <code>{displayContent}</code>
        </pre>
        {lines.length > 3 && (
          <Button onClick={toggleCollapse} variant="link" size="sm" className="mt-1">
            {isCollapsed ? 'Show more' : 'Show less'}
          </Button>
        )}
      </div>
    );
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
        {renderMessages.map((message, index) => renderMessage(message, index))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <textarea
          ref={textareaRef}
          value={chatInput}
          onChange={(e) => {
            setChatInput(e.target.value);
            autosize.update(textareaRef.current);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-grow mr-2 p-2 border rounded resize-none overflow-y-auto min-h-[2.5em] max-h-[80vh] transition-all duration-200 focus:min-h-[5em]"
          rows={1}
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
};

export default Chat;
