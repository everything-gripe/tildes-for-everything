import {getPosts} from "../../tildes";

export default async function (request, response) {
    const subreddit = request.query.subreddit
    const limit = Number(request.query.limit ?? 25)
    const list = await getPosts(limit, subreddit);

    response.send(list)
}
