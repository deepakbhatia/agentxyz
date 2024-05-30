import { StoryTasks } from "./Inputparser";

export interface PlotPromptRequest {
    genre: string|undefined, 
    city: string|undefined
  }
  
export interface ChapterPromptRequest {
    plot: string, 
    previousChapters: string,
    totalChapter: number
  }

  export interface GraphicsPromptRequest {
        prompt: string,
        chapter: string
  }
export function buildPlotPrompt(request: PlotPromptRequest): string {
    const genre = request.genre != undefined && request.genre!="" ? request.genre : 'fiction';
    const city = request.city != undefined && request.city != "" ? request.city : undefined;

    let plotPrompt = "Create 2 50 word plot lines for creating novels in the " + genre + " genre";
    if (city != undefined) {
        plotPrompt = plotPrompt + " based in " + city
    }

    plotPrompt = plotPrompt + " "
    return plotPrompt;
}

export function buildChapterPrompt(request: ChapterPromptRequest) {

}

export function buildEndingPrompt(request: PlotPromptRequest) {

}

export function buildGraphicsPrompt(request: GraphicsPromptRequest) {

}

export function buildTitlePrompt(request: PlotPromptRequest) {

}

export async function buildFollowUpPrompt(stage: StoryTasks) {
    // let plotPrompt = "Do you want more plot lines?" + genre + " genre";
    // if (city != undefined) {
    //     plotPrompt = plotPrompt + " based in " + city
    // }
}