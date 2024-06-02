import { StoryTasks } from "./Inputparser"
export function getFollowUpSystemPrompt(stage: StoryTasks) : string|undefined {
    if(stage == 1) {
        return "\n\nDo you want more plot lines? Yes or No."
    }
    
    return undefined
}