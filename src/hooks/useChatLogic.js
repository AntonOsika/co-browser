import { useState } from 'react';

export const useChatLogic = (apiKey, systemPrompt, onBashCommand) => {
  const [messages, setMessages] = useState([]);
  const [renderMessages, setRenderMessages] = useState([]);

  const handleSendMessage = async (message) => {
    const newMessage = { role: 'user', content: message };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setRenderMessages(prevRenderMessages => [...prevRenderMessages, newMessage]);

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
        let renderAssistantMessage = { role: 'assistant', content: '', toolUses: [] };
        
        for (const item of data.content) {
          if (item.type === 'text') {
            assistantMessage.content += item.text;
            renderAssistantMessage.content += item.text;
          } else if (item.type === 'tool_use') {
            assistantMessage.toolUses.push(item);
            renderAssistantMessage.toolUses.push(item);
            if (item.name === 'execute_javascript') {
              executeJavaScript(item.input.code);
            } else if (item.name === 'execute_bash') {
              onBashCommand(item.input.command);
            }
          }
        }

        // Ensure non-empty content for messages with only tool uses
        if (assistantMessage.content === '' && assistantMessage.toolUses.length > 0) {
          assistantMessage.content = ' '; // Add a space as minimal non-empty content
          renderAssistantMessage.content = ' '; // Add a space as minimal non-empty content
        }
        
        setMessages(prevMessages => [...prevMessages, assistantMessage]);
        setRenderMessages(prevRenderMessages => [...prevRenderMessages, renderAssistantMessage]);
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

  return { messages, renderMessages, handleSendMessage, executeJavaScript };
};
