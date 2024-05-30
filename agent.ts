import {Contract, ethers, TransactionReceipt, Wallet} from "ethers";
import ABI from "./abis/Test1Agent.json";

import {StoryTasks, getUserInput, parseUserInput, furtherActions, parseFollowUp} from "./Inputparser";
import { getFollowUpSystemPrompt } from "./system_questions";
require("dotenv").config()

interface Message {
  role: string,
  content: string,
}

interface AgentRunStage {
  stage: StoryTasks,
  completed: number,
  total: number
}

let agentRunStage: {[id: number]: AgentRunStage} = {}

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
  const query = await getUserInput(startPrompt)

  let queryLCase = query? query.toLowerCase() : '1'
  let choice =parseUserInput(queryLCase)


let queryState = await furtherActions(choice)

let updatedQuery = queryState['query']
let currentState = queryState['stage']
//   if(choice === 1) {
//     const genre = await getUserInput('Which genre would you like?')
//     const location = await getUserInput('Which city, town or neighbourhood should it be based')

//     task = StoryTasks.PLOT
//   }else if(choice === 2) {
//     const genre = await getUserInput('Which genre would you like?')
//     const location = await getUserInput('Which city, town or neighbourhood should it be based')

//     task = StoryTasks.CHAPTER
//   }
  const maxIterations = await getUserInput("Max iterations: ")

  // Call the startChat function
  const transactionResponse = await contract.runAgent(updatedQuery, Number(maxIterations));
  const receipt = await transactionResponse.wait()
  console.log(`Task sent, tx hash: ${receipt.hash}`)
  console.log(`Agent started with task: "${query}"`)

  // Get the agent run ID from transaction receipt logs
  let agentRunID = getAgentRunId(receipt, contract);
  console.log(`Created agent run ID: ${agentRunID}`)
  if (!agentRunID && agentRunID !== 0) {
    return
  }

  agentRunStage[agentRunID] = {
    stage: currentState,
    completed: 0,
    total: maxIterations ? +maxIterations:1
  }
  
  let allMessages: Message[] = []
  // Run the chat loop: read messages and send messages
  var exitNextLoop = false;
  while (true) {
    const newMessages: Message[] = await getNewMessages(contract, agentRunID, allMessages.length);
    if (newMessages && newMessages.length >0 ) {
      for (let message of newMessages) {
        let roleDisplay = message.role === 'assistant' ? 'THOUGHT' : 'STEP';
        let color = message.role === 'assistant' ? '\x1b[36m' : '\x1b[33m'; // Cyan for thought, yellow for step
        console.log(`${color}${roleDisplay}\x1b[0m: ${message.content}`);
        allMessages.push(message)
      }

      console.log(agentRunStage[agentRunID])
      agentRunStage[agentRunID].completed++;

      const yesOrNo = await getUserInput(whatShouldAgentDoNext(agentRunStage[agentRunID]))
      
       // Call the startChat function
      const transactionResponse = await contract.runAgent((await parseFollowUp(agentRunStage[agentRunID].stage, yesOrNo)).query, Number(maxIterations));
      const receipt = await transactionResponse.wait()
      
    }
    await new Promise(resolve => setTimeout(resolve, 2000))
    if (exitNextLoop){
      console.log(`agent run ID ${agentRunID} finished!`);
      break;
    }
    // if (await contract.isRunFinished(agentRunID)) {
    //   exitNextLoop = true;
    // }

    
  }

}

function whatShouldAgentDoNext(status: AgentRunStage): string {
    if(status.stage){
      return getFollowUpSystemPrompt(status.stage)
    }

    return "Let it all burn baby"
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