import { invokeLLM } from './server/_core/llm.js';
import fs from 'fs';

const analysisContent = fs.readFileSync('/home/ubuntu/whatsapp-qr-analysis.md', 'utf-8');

const response = await invokeLLM({
  messages: [
    {
      role: 'system',
      content: 'You are an expert full-stack developer specializing in React, tRPC, and WhatsApp Business API integrations. Analyze code issues deeply and provide definitive solutions.'
    },
    {
      role: 'user',
      content: analysisContent
    }
  ]
});

console.log('\n=== LLM ANALYSIS ===\n');
console.log(response.choices[0].message.content);
console.log('\n===================\n');
