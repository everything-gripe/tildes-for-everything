import {Everything, Group, User} from "everything-sdk";

export default async function (request, response) {
    response.send(Everything.group(new Group({
        name: `t5_${request.query.subreddit}`,
        display_name: `${request.query.subreddit}`,
        display_name_prefixed: `r/${request.query.subreddit}`
    })))
}
