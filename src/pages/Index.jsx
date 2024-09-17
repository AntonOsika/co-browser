import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Chat from '../components/Chat';
import Canvas from '../components/Canvas';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';

const Index = () => {
  const [systemPrompt, setSystemPrompt] = useLocalStorage('systemPrompt', `You can use the canvas_api to manipulate the canvas. Available methods:
  - canvas_api.createIframe(url, x, y, width, height): Creates an iframe on the canvas
  - canvas_api.stage: Access to the Konva stage object for more advanced manipulations

You can also use the execute_javascript tool to run JavaScript code.`);
  const [apiKey, setApiKey] = useLocalStorage('apiKey', '');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    window.canvas_api = {
      createIframe: (url, x, y, width, height) => {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.position = 'absolute';
        iframe.style.left = `${x}px`;
        iframe.style.top = `${y}px`;
        iframe.style.width = `${width}px`;
        iframe.style.height = `${height}px`;
        document.getElementById('canvas').appendChild(iframe);
      },
      stage: null // This will be set by the Canvas component
    };
  }, []);

  const handleSendMessage = async (message) => {
    const newMessage = { role: 'user', content: message };
    setMessages(prevMessages => [...prevMessages, newMessage]);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            newMessage
          ],
          tools: [
            {
              name: 'execute_javascript',
              description: 'Execute JavaScript code',
              input_schema: {
                type: 'object',
                properties: {
                  code: {
                    type: 'string',
                    description: 'The JavaScript code to execute'
                  }
                },
                required: ['code']
              }
            }
          ]
        })
      });

      const data = await response.json();
      
      if (data.content && data.content.length > 0) {
        const aiMessage = { role: 'assistant', content: '' };
        
        for (const item of data.content) {
          if (item.type === 'text') {
            aiMessage.content += item.text;
          } else if (item.type === 'tool_use') {
            aiMessage.content += `\n[Tool Use: ${item.name}]\nInput: ${JSON.stringify(item.input)}\n`;
            if (item.name === 'execute_javascript') {
              try {
                // eslint-disable-next-line no-eval
                eval(item.input.code);
              } catch (error) {
                console.error('Error executing JavaScript:', error);
              }
            }
          }
        }
        
        setMessages(prevMessages => [...prevMessages, aiMessage]);
      } else {
        console.error('Unexpected API response format:', data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 p-4 flex flex-col">
        <Textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Enter system prompt"
          className="mb-4"
        />
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter Claude API Key"
          className="mb-4"
        />
        <Chat messages={messages} onSendMessage={handleSendMessage} />
      </div>
      <div className="w-1/2 p-4">
        <Canvas />
      </div>
    </div>
  );
};

export default Index;
