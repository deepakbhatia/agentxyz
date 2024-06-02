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
        const genre = await getUserInput('\nWhich genre would you like(fantasy, fiction, comedy, mystery)? ')
        const location = await getUserInput('\nWhich city, town or neighbourhood should it be based?    ')
    

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
    let query: string = "       Create 2 plot lines for fiction genre           \n\n"
    let stage: StoryTasks = StoryTasks.PLOT
    if(choice === 1) {
    
        query = "       Create 5 more 50 word plot lines       \n\n"

        stage = StoryTasks.PLOT
      }else if(choice === 2) {
        stage = StoryTasks.CHAPTER
        //query = "       Write 1 chapter out of 5 chapters for the story with the title " + "       \n\n"
        query = "Provide the title of the plot from above for which you want to create a story?\n\n"
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
    //console.log(stage, response, response?.toLowerCase(),response?.toLowerCase().includes('yes'), response?.toLowerCase().indexOf('no'))
    if(stage == 1 && (response != undefined && response.toLowerCase().includes('yes'))) {
            return furtherActionsFollowUp(stage)
        
    }else if((stage == 1 && (response == undefined || response.toLowerCase().includes('no')) || stage ==2) ) { 
        const query = await getUserInput((await furtherActionsFollowUp(stage + 1)).query) 
        
        let finalQuery = "Write a fantasy story based in tokyo. Create 3 chapters of 200 words each. Each chapter must have a different writing style. Describe the characters in a manner that helps to shape the story line. Generate 2 images for each chapter, one for the beginning, one for the end, in stencil style. Provide this story in ePub format";
        if(query != undefined) {
            finalQuery = "Write a story based on the plot of " + query + "." +
            "Create 3 chapters of 200 words each." +  
            "Each chapter must have a different writing style." + 
            "Describe the characters in a manner that helps to shape the story line" + 
            "Generate 2 images for each chapter, one for the beginning, one for the end, in stencil style" 
        } 

        return {
            query: finalQuery || "Write 5 chapters of a story based of the first plot line",
            stage: StoryTasks.CHAPTER
         }
    }

    return furtherActionsFollowUp(stage)
}