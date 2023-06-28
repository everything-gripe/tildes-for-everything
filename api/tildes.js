import {NodeHtmlMarkdown} from "node-html-markdown";
import {Everything} from "everything-sdk";
import {load as cheerioLoad} from "cheerio";


let $;
let subreddit

export async function load(url, subredditName) {
    const tildesResponse = await fetch(url)
    $ = cheerioLoad(await tildesResponse.text())
    subreddit = subredditName
}

export async function getPosts(limit, subreddit) {
    await load(`https://tildes.net/${subreddit ? `~${subreddit}` : ''}`, subreddit)

    const topics = await Promise.all($('.topic-listing > li').slice(0, limit).map(buildPost))

    const list = Everything.list({
        after: null,
        dist: topics.length,
        modhash: "",
        geo_filter: null,
        children: topics,
        before: null
    })
    return list;
}


export async function buildPost() {
    // const topicElm = $('.topic, .topic-full', this)
    const topicElm = $('.topic', this)
    // const topicTitleElm = $('.topic-title a, h1', this)
    const topicTitleElm = $('.topic-title a', this)
    const topicGroupElm = $('.topic-group a', this)
    const commentsElm = $('.topic-info-comments', this)
    const commentsAElm = $('a', commentsElm)
    const commentsSpanElm = $('span', commentsAElm)
    const sourceElm = $('.topic-info-source', this)
    const votingElm = $('.topic-voting-votes', this)
    const timeElm = $('.time-responsive', this)
    // const textElm = $('.topic-text-excerpt, .topic-full-text', this).remove('summary:has(span)')
    const textElm = $('.topic-text-excerpt', this).remove('summary:has(span)')

    subreddit = topicGroupElm.text().replace('~', '') || subreddit
    const id = topicElm.attr('id').replace('topic-', '')
    const title = topicTitleElm.text();
    const subredditNamePrefixed = `r/${subreddit}`
    const numComments = Number(commentsSpanElm.text().split(' ')[0])
    const linkSegments = commentsAElm.attr('href').split('/')
    const slug = linkSegments[linkSegments.length - 1]
    const permalink = `/r/${subreddit}/comments/${id}/${slug}`
    const author = topicElm.data('topic-posted-by')
    const authorFullname = `t2_${author}`
    const ups = Number(votingElm.text())
    const createdUtc = Math.floor(new Date(timeElm.attr('datetime')).getTime() / 1000)

    if (topicElm.hasClass('topic-with-excerpt')) {
        var isSelf = true
        var selftext = NodeHtmlMarkdown.translate(textElm.html())
        var url = `https://tildes.z.gripe${permalink}`
    } else {
        isSelf = false
        var url = topicTitleElm.attr('href')
        var domain = sourceElm.attr('title')
    }

    const post = Everything.post({
        id: id,
        title: title,
        url: url,
        subreddit: subreddit,
        subreddit_name_prefixed: subredditNamePrefixed,
        num_comments: numComments,
        permalink: permalink,
        author: author,
        author_fullname: authorFullname,
        ups: ups,
        score: ups,
        created_utc: createdUtc,
        is_self: isSelf,
        selftext: selftext || '',
        selftext_html: selftext || '',
        domain: domain || '',
    })
    await post.data.buildMetadata()
    return post
}
