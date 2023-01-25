import { assert } from 'console';
import Event from './db/models/event';
import Tag from './db/models/tag';
import User from './db/models/user';
import { Coordinates } from './types';
import intersection from './utils/helpers';
import { distanceInMeters } from './utils/math';

export default async function recommendationListForUser(
    user: User,
    eventList: Event[],
    userCoordinates: Coordinates,
) {
    assert(
        user,
        `Recommendation Algorithm called without valid User. Instead the Parameter was ${user.username}`,
    );
    assert(
        eventList.length !== 0,
        `There were no events to rank. Eventlist parameter has length 0`,
    );

    const rankedEventList = await Promise.all(
        eventList.map(async (event: Event) => {
            return {
                event: event,
                ranking: await eventRankingForUser(event, user, userCoordinates),
            };
        }),
    );

    // Sort from big to low. Highest ranking event at first index
    const sortetRankedEventList = rankedEventList.sort(
        (rankedEventA, rankedEventB) => rankedEventB.ranking.score - rankedEventA.ranking.score,
    );

    // const sortetEventList = sortetRankedEventList.map((rankedEvent) => rankedEvent.event);
    return sortetRankedEventList;
}

async function eventRankingForUser(event: Event, user: User, userCoordinates: Coordinates) {
    let score = 0;
    const explanation = {
        tagScore: 0,
        followeesScore: 0,
        ratingScore: 0,
        mediaScore: 0,
        distance: 0,
    };

    const posEvenet = { lat: event.lat, lon: event.lon };
    const distToEventInMeters = distanceInMeters(posEvenet, userCoordinates);
    score -= distToEventInMeters / 1000;
    explanation.distance = distToEventInMeters;

    // Ranking based on tags / personal interests
    // Wie viele meiner Tags die ich mag sind teil des Events
    const tagsUserLikes = await user.getFavouriteTags();
    const tagsOfEvent = await event.getTags();
    const tagsUserLikesOfEvent = intersection<Tag>(tagsUserLikes, tagsOfEvent);
    score += tagsUserLikesOfEvent.length;
    explanation.tagScore = tagsUserLikesOfEvent.length;

    // Ranking based on leaders/followees
    // Wie viele meiner Freunde haben sich schon für das Event angemeldet
    const peopleUserFollows = await user.getFollowees();
    const peopleAtEvent = await event.getAttendees();
    const peopleUserFollowsAtEvent = intersection<User>(peopleUserFollows, peopleAtEvent);
    score += peopleUserFollowsAtEvent.length;
    explanation.followeesScore = peopleUserFollowsAtEvent.length;

    // Ranking based on general ranking of the creator (average ranking of events of creator)
    const AverageEventRatingOfUser = await user.getRating();
    score += AverageEventRatingOfUser! / 2; // Arbitrary scalar to mach how important ratings are compared to the other features
    explanation.ratingScore = AverageEventRatingOfUser! / 2;

    // Ranking based on the availability of media
    const numberOfMedias = Math.min(await event.countMedia(), 8); // Ignore pieces of media beyoind 8
    score += numberOfMedias / 3;
    explanation.mediaScore = numberOfMedias / 3;

    // Ranking based on coolnes of the event
    // Magischen Bewertungsalgorithmus aus dem Arsch ziehen

    return { score: score, explanation: explanation };
}
