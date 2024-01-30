
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
import * as dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

class ChatBot {
  constructor() {
    this.context = {};
    this.currentTopic = null;
  }

  async getUserInput(query) {
    return new Promise((resolve) => {
      rl.question(query, (answer) => {
        resolve(answer);
      });
    });
  }

  addBackgroundColor(text, colorCode) {
    return `\x1b[48;5;${colorCode}m${text}\x1b[0m`;
  }

  async selectTopic() {

    while (!this.currentTopic) {
      const topicInput = await this.getUserInput('\nEnter the topic you want to discuss: ');

      if (topicInput.toLowerCase() === 'exit') {
        break;
      }

      this.currentTopic = topicInput.toLowerCase();
      console.log(`ChatBot: You've selected the topic: ${this.currentTopic}`);
    }
  }

  isRelatedToTopic(userInput) {

    // Define keywords related to the selected topic (e.g., "ai" in this case)
    const topicKeywords = this.currentTopic.split(' '); // Split topic into individual words for more flexibility
    return topicKeywords.some(keyword => userInput.toLowerCase().includes(keyword));
  }

  async handleUserInput(userInput) {

    try {
      if (!this.isRelatedToTopic(userInput)) {
        console.log(`ChatBot: Your topic is "${this.currentTopic}". Please ask a question related to this topic.`);
        return;
      }

      const template = userInput;
      const promptTemplate = new PromptTemplate({
        template,
        inputVariables: [],
      });

      const openAIModel = new OpenAI({
        temperature: 0.5,
      });

      const llmChain = new LLMChain({
        llm: openAIModel,
        prompt: promptTemplate,
      });

      const result = await llmChain.call(this.context);

      if (result && result.text !== undefined) {
        const coloredResponse = this.addBackgroundColor(result.text, 1);
        console.log(`\nAI Response: ${coloredResponse}`);
      } else {
        console.error('Error: Invalid response from OpenAI model.');
      }

      this.context = result && result.context ? result.context : this.context;
    } catch (error) {
      console.error('Error during OpenAI model call:', error);
    }
  }

  async startChat() {
    
    console.log('ChatBot: Hello! I am your chatbot.');

    await this.selectTopic();

    while (this.currentTopic) {
      const userInput = await this.getUserInput(
        `\nEnter your question or statement on the topic "${this.currentTopic}": `
      );

      if (userInput.toLowerCase() === 'exit') {
        break;
      }

      await this.handleUserInput(userInput);
    }

    console.log('ChatBot: Goodbye!');
    rl.close();
  }
}

async function main() {
  const chatBot = new ChatBot();
  await chatBot.startChat();
}

main();
