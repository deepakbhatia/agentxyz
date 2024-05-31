import { StoryTasks } from "./Inputparser"
export function getFollowUpSystemPrompt(stage: StoryTasks) : string {
    if(stage == 1) {
        return "\n\nDo you want more plot lines? Yes or No."
    }else if(stage == 2) {
        return "\n\nWhich title do you like to create story for?"
    }else if(stage == 3) {
        return "Do you want more plot lines?"
    }
    
    return "Do you want more plot lines?"
}