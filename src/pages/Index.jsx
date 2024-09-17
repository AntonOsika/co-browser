import React, { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Chat from '../components/Chat';
import Terminal from '../components/Terminal';
import ConsoleLog from '../components/ConsoleLog';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from '../components/ui/resizable';
import { useChatLogic } from '../hooks/useChatLogic';

const Index = () => {
  const [systemPrompt, setSystemPrompt] = useLocalStorage('systemPrompt', `You can use the execute_javascript tool to run JavaScript code and the execute_bash tool to run bash commands.

A function js_observation(message) is available to communicate back from javascript. When called, it prepends the following text to the chat input box:
"javascript observation:
[message]

"
Use this function to report observations from JavaScript code execution to the AI assistant.

For bash commands, the output will be returned directly to you.`);
  const [apiKey, setApiKey] = useLocalStorage('apiKey', '');
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const { messages, handleSendMessage, executeJavaScript, executeBash } = useChatLogic(apiKey, systemPrompt);

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
    };
  }, [appendToConsole, setChatInput]);

  const handleBashCommand = (command) => {
    handleSendMessage(`Executing bash command: ${command}`);
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
          <ResizablePanel defaultSize={50}>
            <Terminal onBashCommand={handleBashCommand} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50}>
            <ConsoleLog output={consoleOutput} onExecute={executeJavaScript} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Index;
