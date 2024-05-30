import { StoryTasks } from "./Inputparser"
export function getFollowUpSystemPrompt(stage: StoryTasks) : string {
    if(stage == 1) {
        return "Do you want more plot lines? Yes or No. No response defaults to a yes."
    }else if(stage == 2) {
        return "Do you want more plot lines?"
    }else if(stage == 3) {
        return "Do you want more plot lines?"
    }
    
    return "Do you want more plot lines?"
}