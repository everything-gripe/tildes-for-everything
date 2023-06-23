﻿import {load} from 'cheerio'
import {NodeHtmlMarkdown} from "node-html-markdown";
// import {Post} from "everything-sdk";

export default async function (request, response)/** @type {Post} */ {
    const tildesResponse = await fetch(`https://tildes.net/${request.query.subreddit}`)
    const $ = load(await tildesResponse.text())

    const topics = await Promise.all($('.topic-listing > li').map(async function(){

        const topicElm = $('.topic', this)
        const topicTitleElm = $('.topic-title a', this)
        const topicGroupElm = $('.topic-group a', this)
        const commentsElm = $('.topic-info-comments', this)
        const commentsAElm = $('a', commentsElm)
        const commentsSpanElm = $('span', commentsAElm)
        const sourceElm = $('.topic-info-source', this)
        const votingElm = $('.topic-voting-votes', this)
        const timeElm = $('.time-responsive', this)
        const textElm = $('.topic-text-excerpt', this).remove('summary:has(span)')

        const id = topicElm.attr('id').replace('topic-', '')
        const title = topicTitleElm.text();
        const subreddit = topicGroupElm.text() || request.query.subreddit//.replace('~', '')
        const subredditNamePrefixed = `r/${subreddit}`
        const numComments =  Number(commentsSpanElm.text().split(' ')[0])
        const permalink = commentsAElm.attr('href')
        const author = topicElm.data('topic-posted-by')
        const authorFullname = `t2_${author}`
        const ups = Number(votingElm.text())
        const createdUtc = Math.floor(new Date(timeElm.attr('datetime')).getTime() / 1000)

        if (topicElm.hasClass('topic-with-excerpt')) {
            var isSelf = true
            var selftext = NodeHtmlMarkdown.translate(textElm.html())
        } else {
            isSelf = false
            var url = topicTitleElm.attr('href')
            var domain = sourceElm.attr('title')
        }

        return {
            kind: "t3",
            data: {
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
                selftext: selftext,
                domain: domain
            }
        }
    }))

    const listing = {
        kind: "Listing",
        data: {
            after: null,
            dist: topics.length,
            modhash: "",
            geo_filter: null,
            children: topics,
            before: null
        }
    }
    response.send(listing)
}