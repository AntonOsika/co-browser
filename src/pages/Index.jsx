import React, { useState, useEffect, useCallback } from 'react';
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

You can also use the execute_javascript tool to run JavaScript code.

A function js_observation(message) is available to communicate back from javascript. When called, it prepends the following text to the chat input box:
"javascript observation:
[message]

"
Use this function to report observations from JavaScript code execution to the AI assistant.`);
  const [apiKey, setApiKey] = useLocalStorage('apiKey', '');
  const [messages, setMessages] = useState([]);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const appendToConsole = useCallback((message) => {
    setConsoleOutput(prev => [...prev, message]);
  }, []);

  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    console.log = (...args) => {
      appendToConsole(args.join(' '));
      originalConsoleLog(...args);
    };
    console.error = (...args) => {
      appendToConsole('ERROR: ' + args.join(' '));
      originalConsoleError(...args);
    };

    window.js_observation = (message) => {
      setChatInput(prev => `javascript observation:\n${message}\n\n${prev}`);
    };

    window.onerror = (message, source, lineno, colno, error) => {
      console.error(`Global error: ${message} at ${source}:${lineno}:${colno}`, error);
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      delete window.js_observation;
      window.onerror = null;
    };
  }, [appendToConsole]);

  const ensureAlternatingRoles = (msgs) => {
    const result = [];
    let lastRole = msgs.length > 0 ? msgs[msgs.length - 1].role : 'assistant';

    for (const msg of msgs) {
      if (msg.role === lastRole) {
        result.push({ role: lastRole === 'user' ? 'assistant' : 'user', content: '' });
      }
      result.push(msg);
      lastRole = msg.role;
    }

    return result;
  };

  const handleSendMessage = async (message) => {
    const newMessage = { role: 'user', content: message };
    const updatedMessages = ensureAlternatingRoles([...messages, newMessage]);
    setMessages(updatedMessages);

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
          messages: updatedMessages,
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
        const newMessages = [];
        for (const item of data.content) {
          if (item.type === 'text') {
            newMessages.push({ role: 'assistant', content: item.text });
          } else if (item.type === 'tool_use') {
            newMessages.push({ role: 'tool_use', name: item.name, input: item.input });
            if (item.name === 'execute_javascript') {
              executeJavaScript(item.input.code);
            }
          }
        }
        setMessages(prevMessages => ensureAlternatingRoles([...prevMessages, ...newMessages]));
      } else {
        console.error('Unexpected API response format:', data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const executeJavaScript = (code) => {
    try {
      // eslint-disable-next-line no-eval
      eval(code);
    } catch (error) {
      console.error('Error executing JavaScript:', error);
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
          <div className="flex-grow overflow-hidden">
            <Chat messages={messages} onSendMessage={handleSendMessage} chatInput={chatInput} setChatInput={setChatInput} />
          </div>
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
            <ConsoleLog output={consoleOutput} onExecute={executeJavaScript} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Index;
