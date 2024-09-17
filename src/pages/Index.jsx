import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Chat from '../components/Chat';
import Canvas from '../components/Canvas';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Rect } from 'react-konva';

const Index = () => {
  const [systemPrompt, setSystemPrompt] = useLocalStorage('systemPrompt', `You can use the canvas_api to manipulate the canvas. Available methods:
  - canvas_api.stage: Access to the Konva stage object
  - canvas_api.layer: Access to the main Konva layer
  - Use react-konva components to add shapes and elements to the canvas

You can also use the execute_javascript tool to run JavaScript code.`);
  const [apiKey, setApiKey] = useLocalStorage('apiKey', '');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    window.canvas_api = {
      stage: null,
      layer: null
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
          messages: messages.filter(msg => msg.role === 'user' || msg.role === 'assistant').concat(newMessage),
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
        let assistantMessage = { role: 'assistant', content: '' };
        for (const item of data.content) {
          if (item.type === 'text') {
            assistantMessage.content += item.text;
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
        if (assistantMessage.content) {
          setMessages(prevMessages => [...prevMessages, assistantMessage]);
        }
      } else {
        console.error('Unexpected API response format:', data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleAddRandomShape = () => {
    const shape = new Rect({
      x: Math.random() * (window.innerWidth / 2 - 50),
      y: Math.random() * (window.innerHeight - 50),
      width: 50,
      height: 50,
      fill: Konva.Util.getRandomColor(),
      draggable: true
    });
    window.canvas_api.layer.add(shape);
    window.canvas_api.layer.batchDraw();
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
        <Button onClick={handleAddRandomShape} className="mb-4">Add Random Shape</Button>
        <Chat messages={messages} onSendMessage={handleSendMessage} />
      </div>
      <div className="w-1/2 p-4">
        <Canvas />
      </div>
    </div>
  );
};

export default Index;
