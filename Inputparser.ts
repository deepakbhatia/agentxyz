import { PlotPromptRequest, buildPlotPrompt, buildChapterPrompt, buildEndingPrompt, buildGraphicsPrompt, buildTitlePrompt } from './prompts';
import * as readline from 'readline';
export enum StoryTasks{
  PLOT=1,
  CHAPTER,
  ENDING,
  GRAPHICS,
  TITLE
}


export async function getUserInput(query: string): Promise<string | undefined> {
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

export function parseUserInput(query: string):number {
    let queryLCase = query? query.toLowerCase() : '1'
    let choice = queryLCase?.indexOf('1') >= 0 
    || queryLCase?.indexOf('plot lines') >= 0 ? 
    1 : 2;

    return choice;
}

export async function furtherActions(choice:number): Promise<{query: string, stage: StoryTasks}> {
    let query: string = "Create 2 plot lines for fiction genre"
    let stage: StoryTasks = StoryTasks.PLOT
    if(choice === 1) {
        const genre = await getUserInput('Which genre would you like?')
        const location = await getUserInput('Which city, town or neighbourhood should it be based?')
    

        query = buildPlotPrompt({
            genre: genre,
            city: location
        })

        stage = StoryTasks.PLOT
      }else if(choice === 2) {
        const genre = await getUserInput('Which genre would you like?')
        const location = await getUserInput('Which city, town or neighbourhood should it be based')
        stage = StoryTasks.CHAPTER
      }

      return {
        query: query,
        stage: stage
      }
}

export async function furtherActionsFollowUp(choice:number): Promise<{query: string, stage: StoryTasks}> {
    let query: string = "Create 2 plot lines for fiction genre"
    let stage: StoryTasks = StoryTasks.PLOT
    if(choice === 1) {
        // const genre = await getUserInput('Which genre would you like?')
        // const location = await getUserInput('Which city, town or neighbourhood should it be based?')
    

        query = "Give me more plots"

        stage = StoryTasks.PLOT
      }else if(choice === 2) {
        // const genre = await getUserInput('Which genre would you like?')
        // const location = await getUserInput('Which city, town or neighbourhood should it be based')
        stage = StoryTasks.CHAPTER
      }

      return {
        query: query,
        stage: stage
      }
}

export async function selectNextStageForSystem(){

}

export async function followUpSystemPrompt(){

}

export async function parseFollowUp(stage: StoryTasks, response: string|undefined): Promise<{query: string, stage: StoryTasks}>{
    if(stage == 1) {
        if(response == undefined || response.toLowerCase().indexOf('yes')) {
            return furtherActionsFollowUp(stage)
        }else if(response.toLowerCase().indexOf('no')) {

        }else{

        }
    }

    return furtherActionsFollowUp(stage)
}