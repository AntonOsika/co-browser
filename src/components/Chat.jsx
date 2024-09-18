import React, { useRef, useEffect } from 'react';
import { Button } from './ui/button';
import ToolCallBox from './ToolCallBox';
import autosize from 'autosize';

const Chat = ({ messages, onSendMessage, chatInput, setChatInput }) => {
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const renderMessage = (message, index) => {
    return (
      <div key={index} className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
        <span className={`inline-block p-2 rounded ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
          {message.content}
          {message.toolCalls && message.toolCalls.map((toolCall, toolIndex) => (
            <ToolCallBox key={toolIndex} toolCall={toolCall} />
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
