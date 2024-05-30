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

function parseUserInput(query: string):number {
    let queryLCase = query? query.toLowerCase() : '1'
    let choice = queryLCase?.indexOf('1') >= 0 
    || queryLCase?.indexOf('plot lines') >= 0 ? 
    1 : 2;

    return choice;
}

async function furtherActions(choice:number) {
    if(choice === 1) {
        const genre = await getUserInput('Which genre would you like?')
        const location = await getUserInput('Which city, town or neighbourhood should it be based')
    
        task = StoryTasks.PLOT
      }else if(choice === 2) {
        const genre = await getUserInput('Which genre would you like?')
        const location = await getUserInput('Which city, town or neighbourhood should it be based')
    
        task = StoryTasks.CHAPTER
      }
}