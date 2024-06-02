import {Contract, ethers, TransactionReceipt, Wallet} from "ethers";
import ABI from "./abis/Test8Agent.json";

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
"1. Create plot lines\n\n" 

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

      let completed =  false

      for (let message of newMessages) {
        
        let roleDisplay = message.role === 'assistant' ? 'AI RESPONSE' : 'CUSTOMER INPUT';
        let color = message.role === 'assistant' ? '\x1b[36m' : '\x1b[33m'; // Cyan for thought, yellow for step
        
        if(message.role === 'assistant'){
          console.log(`${color}${roleDisplay}\x1b\x1b[0m: ${message.content}`);
        }
        
        allMessages.push(message)

        if(message.role === 'assistant'){
          completed = true
        }
        
      }

      if(completed === true){
        agentRunStage[agentRunID].completed++;
        
        let inputForAiAvail:boolean = false
        let inputForAi: string = "End this agent run"
        while(!inputForAiAvail){

          const nextAction = whatShouldAgentDoNext(agentRunStage[agentRunID])

          if(nextAction === undefined){
            exitNextLoop = true;
            break;
          }
          const yesOrNo = await getUserInput(nextAction)
          
          let response = await parseFollowUp(agentRunStage[agentRunID].stage, yesOrNo)

          agentRunStage[agentRunID].stage = response.stage

          if (response.query != undefined) {
            inputForAi = response.query;
            inputForAiAvail=true
          }
        }

        if (exitNextLoop){
          console.log(`agent run ID ${agentRunID} finished!`);
          break;
        }
         // Call the startChat function
         const transactionResponse = await contract.continueAgent(inputForAi, agentRunID);
         const receipt = await transactionResponse.wait()
        
      }      
      
    }
    await new Promise(resolve => setTimeout(resolve, 2000))
  
  }

}

function whatShouldAgentDoNext(status: AgentRunStage): string |undefined {
    if(status.stage < 2){
      return getFollowUpSystemPrompt(status.stage)
    }

    return undefined
}

function getAgentRunId(receipt: TransactionReceipt, contract: Contract) {
  let agentRunID
  for (const log of receipt.logs) {
    try {
      const parsedLog = contract.interface.parseLog(log)
      if (parsedLog && parsedLog.name === ("AgentRunCreated" || "FunctionCallExecuted")) {
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