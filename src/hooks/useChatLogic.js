import { useState } from 'react';

export const useChatLogic = (apiKey, systemPrompt, onBashCommand) => {
  const [messages, setMessages] = useState([]);

  const handleSendMessage = async (message) => {
    const newMessage = { role: 'user', content: message };
    const updatedMessages = [...messages, newMessage];
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
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          tools: [
            {
              type: 'function',
              name: 'execute_javascript',
              description: 'Execute JavaScript code',
              parameters: {
                type: 'object',
                properties: {
                  code: {
                    type: 'string',
                    description: 'The JavaScript code to execute'
                  }
                },
                required: ['code']
              },
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
            },
            {
              type: 'function',
              name: 'execute_bash',
              description: 'Execute bash commands',
              parameters: {
                type: 'object',
                properties: {
                  command: {
                    type: 'string',
                    description: 'The bash command to execute'
                  }
                },
                required: ['command']
              },
              input_schema: {
                type: 'object',
                properties: {
                  command: {
                    type: 'string',
                    description: 'The bash command to execute'
                  }
                },
                required: ['command']
              }
            }
          ]
        })
      });

      const data = await response.json();
      
      if (data.content && data.content.length > 0) {
        let assistantMessage = { role: 'assistant', content: '', toolCalls: [] };
        
        for (const item of data.content) {
          if (item.type === 'text') {
            assistantMessage.content += item.text;
          } else if (item.type === 'tool_call') {
            assistantMessage.toolCalls.push(item);
            if (item.function.name === 'execute_javascript') {
              executeJavaScript(item.function.arguments.code);
            } else if (item.function.name === 'execute_bash') {
              onBashCommand(item.function.arguments.command);
            }
          }
        }
        
        setMessages(prevMessages => [...prevMessages, assistantMessage]);
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

  return { messages, handleSendMessage, executeJavaScript };
};
