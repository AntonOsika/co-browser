import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Chat from '../components/Chat';
import Canvas from '../components/Canvas';
import ConsoleLog from '../components/ConsoleLog';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from '../components/ui/resizable';

const Index = () => {
  const [systemPrompt, setSystemPrompt] = useLocalStorage('systemPrompt', `You can use the canvas_api to manipulate the canvas. Available methods:
  - canvas_api.createIframe(url, x, y, width, height): Creates an iframe on the canvas
  - canvas_api.stage: Access to the stage object for more advanced manipulations (currently null)

You can also use the execute_javascript tool to run JavaScript code. The output will be displayed in the console log on the right side of the screen.`);
  const [apiKey, setApiKey] = useLocalStorage('apiKey', '');
  const [messages, setMessages] = useState([]);
  const [consoleOutput, setConsoleOutput] = useState([]);

  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      setConsoleOutput(prev => [...prev, args.join(' ')]);
      originalConsoleLog(...args);
    };

    return () => {
      console.log = originalConsoleLog;
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
          system: systemPrompt,
          messages: messages.filter(msg => msg.role !== 'tool_use').concat(newMessage),
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
        for (const item of data.content) {
          if (item.type === 'text') {
            setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: item.text }]);
          } else if (item.type === 'tool_use') {
            setMessages(prevMessages => [...prevMessages, { role: 'tool_use', name: item.name, input: item.input }]);
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
      } else {
        console.error('Unexpected API response format:', data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen">
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="p-4 flex flex-col h-full">
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
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50} minSize={30}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={70}>
            <Canvas />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={30}>
            <ConsoleLog output={consoleOutput} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Index;
