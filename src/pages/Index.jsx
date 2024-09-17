import React, { useState, useCallback, useEffect, useRef } from 'react';
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

For bash commands, the output will be returned directly to you.

JavaScript code can use the window.llm(prompt) function to make a single-message call to Claude 3.5. This function will show an alert to the user with the prompt and ask for confirmation before making the API call. The function returns a promise that resolves to the AI's response as a string.

Example usage:
window.llm("What is the capital of France?").then(response => {
  console.log("AI response:", response);
}).catch(error => {
  console.error("Error:", error);
});`);

  const [apiKey, setApiKey] = useLocalStorage('apiKey', '');
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [bashOutput, setBashOutput] = useState('');
  const terminalRef = useRef(null);

  const appendToConsole = useCallback((message) => {
    setConsoleOutput(prev => [...prev, message]);
  }, []);

  const handleBashOutput = useCallback((output) => {
    setBashOutput(prev => prev + output + '\n');
  }, []);

  const handleBashCommand = useCallback((command) => {
    if (terminalRef.current) {
      terminalRef.current.executeBashCommand(command);
    }
  }, []);

  const { messages, handleSendMessage, executeJavaScript } = useChatLogic(apiKey, systemPrompt, handleBashCommand);

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

    window.llm = async (prompt) => {
      if (window.confirm(`Do you want to send the following prompt to Claude 3.5?\n\n${prompt}`)) {
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
              messages: [{ role: 'user', content: prompt }]
            })
          });

          const data = await response.json();
          if (data.content && data.content.length > 0 && data.content[0].type === 'text') {
            return data.content[0].text;
          } else {
            throw new Error('Unexpected API response format');
          }
        } catch (error) {
          console.error('Error calling Claude API:', error);
          throw error;
        }
      } else {
        throw new Error('User cancelled the API call');
      }
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, [appendToConsole, setChatInput, apiKey]);

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
            <Chat
              messages={messages}
              onSendMessage={handleSendMessage}
              chatInput={chatInput}
              setChatInput={setChatInput}
              bashOutput={bashOutput}
            />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50} minSize={30}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={50}>
            <Terminal ref={terminalRef} onBashCommand={handleBashCommand} onBashOutput={handleBashOutput} />
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
