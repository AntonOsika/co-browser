import { useState, useCallback } from 'react';

export const useChatLogic = (apiKey, systemPrompt) => {
  const [messages, setMessages] = useState([]);

  const ensureAlternatingRoles = (msgs) => {
    const result = [];
    let lastRole = 'assistant';

    for (const msg of msgs) {
      if (msg.role !== lastRole) {
        result.push(msg);
        lastRole = msg.role;
      } else {
        result.push({ role: lastRole === 'user' ? 'assistant' : 'user', content: '' });
        result.push(msg);
        lastRole = msg.role;
      }
    }

    if (lastRole === 'user') {
      result.push({ role: 'assistant', content: '' });
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
            },
            {
              name: 'execute_bash',
              description: 'Execute bash commands',
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
        let assistantMessage = { role: 'assistant', content: '', toolUses: [] };
        
        for (const item of data.content) {
          if (item.type === 'text') {
            assistantMessage.content += item.text;
          } else if (item.type === 'tool_use') {
            assistantMessage.toolUses.push({ name: item.name, input: item.input });
            if (item.name === 'execute_javascript') {
              executeJavaScript(item.input.code);
            } else if (item.name === 'execute_bash') {
              executeBash(item.input.command);
            }
          }
        }
        
        setMessages(prevMessages => ensureAlternatingRoles([...prevMessages, assistantMessage]));
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

  const executeBash = (command) => {
    // Simulate bash command execution
    console.log(`Simulating bash command: ${command}`);
    return `Simulated output for: ${command}\n(Note: Actual bash execution is not possible in the browser environment)`;
  };

  const handleBashOutput = useCallback((output) => {
    setMessages(prevMessages => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        const updatedMessage = {
          ...lastMessage,
          content: lastMessage.content + (lastMessage.content ? '\n\n' : '') + 'Terminal output:\n' + output
        };
        return [...prevMessages.slice(0, -1), updatedMessage];
      } else {
        return [...prevMessages, { role: 'assistant', content: 'Terminal output:\n' + output }];
      }
    });
  }, []);

  return { messages, handleSendMessage, executeJavaScript, executeBash, handleBashOutput };
};
