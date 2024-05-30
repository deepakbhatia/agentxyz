import {Contract, ethers, TransactionReceipt, Wallet} from "ethers";
import ABI from "./abis/Agent.json";
import * as readline from 'readline';

require("dotenv").config()

interface Message {
  role: string,
  content: string,
}

enum StoryTasks{
  PLOT=1,
  CHAPTER,
  ENDING,
  GRAPHICS,
  TITLE
}

const startPrompt = "Agent's task:\n" + 
"1. Create plot lines\n" + 
"2. Write me chapters for the plot line\n" + 
"3. Create graphics for chapter\n" +
"4. Create cover page graphic\n" +
"5. Create titles for the story\n"
async function main() {
  const rpcUrl = process.env.RPC_URL
  if (!rpcUrl) throw Error("Missing RPC_URL in .env")
  const privateKey = process.env.PRIVATE_KEY_GALADRIEL
  if (!privateKey) throw Error("Missing PRIVATE_KEY in .env")
  const contractAddress = process.env.AGENT_CONTRACT_ADDRESS
  if (!contractAddress) throw Error("Missing AGENT_CONTRACT_ADDRESS in .env")

  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const wallet = new Wallet(
    privateKey, provider
  )
  const contract = new Contract(contractAddress, ABI, wallet)

  // The query you want to start the agent with
  const query = await getUserInput("Agent's task:\n1. Get me plot lines\n
  2. Here is my plot, write a story")
  let queryLCase = query? query.toLowerCase() : '1'
  let choice = queryLCase?.indexOf('1') >= 0 
  || queryLCase?.indexOf('plot lines') >= 0 ? 
  1 : 2;

let task = StoryTasks.PLOT

  if(choice === 1) {
    const genre = await getUserInput('Which genre would you like?')
    const location = await getUserInput('Which city, town or neighbourhood should it be based')

    task = StoryTasks.PLOT
  }else if(choice === 2) {
    const genre = await getUserInput('Which genre would you like?')
    const location = await getUserInput('Which city, town or neighbourhood should it be based')

    task = StoryTasks.CHAPTER
  }
  const maxIterations = await getUserInput("Max iterations: ")

  // Call the startChat function
  const transactionResponse = await contract.runAgent(query, Number(maxIterations));
  const receipt = await transactionResponse.wait()
  console.log(`Task sent, tx hash: ${receipt.hash}`)
  console.log(`Agent started with task: "${query}"`)

  // Get the agent run ID from transaction receipt logs
  let agentRunID = getAgentRunId(receipt, contract);
  console.log(`Created agent run ID: ${agentRunID}`)
  if (!agentRunID && agentRunID !== 0) {
    return
  }

  let allMessages: Message[] = []
  // Run the chat loop: read messages and send messages
  var exitNextLoop = false;
  while (true) {
    const newMessages: Message[] = await getNewMessages(contract, agentRunID, allMessages.length);
    if (newMessages) {
      for (let message of newMessages) {
        let roleDisplay = message.role === 'assistant' ? 'THOUGHT' : 'STEP';
        let color = message.role === 'assistant' ? '\x1b[36m' : '\x1b[33m'; // Cyan for thought, yellow for step
        console.log(`${color}${roleDisplay}\x1b[0m: ${message.content}`);
        allMessages.push(message)
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000))
    if (exitNextLoop){
      console.log(`agent run ID ${agentRunID} finished!`);
      break;
    }
    if (await contract.isRunFinished(agentRunID)) {
      exitNextLoop = true;
    }
  }

}

async function getUserInput(query: string): Promise<string | undefined> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, (answer) => {
        resolve(answer)
      })
    })
  }

  try {
    const input = await question(query)
    rl.close()
    return input
  } catch (err) {
    console.error('Error getting user input:', err)
    rl.close()
  }
}


function getAgentRunId(receipt: TransactionReceipt, contract: Contract) {
  let agentRunID
  for (const log of receipt.logs) {
    try {
      const parsedLog = contract.interface.parseLog(log)
      if (parsedLog && parsedLog.name === "AgentRunCreated") {
        // Second event argument
        agentRunID = ethers.toNumber(parsedLog.args[1])
      }
    } catch (error) {
      // This log might not have been from your contract, or it might be an anonymous log
      console.log("Could not parse log:", log)
    }
  }
  return agentRunID;
}

async function getNewMessages(
  contract: Contract,
  agentRunID: number,
  currentMessagesCount: number
): Promise<Message[]> {
  const messages = await contract.getMessageHistoryContents(agentRunID)
  const roles = await contract.getMessageHistoryRoles(agentRunID)

  const newMessages: Message[] = []
  messages.forEach((message: any, i: number) => {
    if (i >= currentMessagesCount) {
      newMessages.push({
        role: roles[i],
        content: messages[i]
      })
    }
  })
  return newMessages;
}

main()
  .then(() => console.log("Done"))