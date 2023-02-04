import { assert } from 'console';
import { getDistance } from 'geolib';
import Event from './db/models/event';
import Tag from './db/models/tag';
import User from './db/models/user';
import { Coordinates } from './types';
import intersection from './utils/helpers';

// TODO: Remove - Deprecated

export default async function recommendationListForUser(
    user: User,
    eventList: Event[],
    userLocation: Coordinates,
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
                ranking: await eventRankingForUser(event, user, userLocation),
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

async function eventRankingForUser(event: Event, user: User, userLocation: Coordinates) {
    let score = 0;
    const explanation = {
        tagScore: 0,
        followeesScore: 0,
        ratingScore: 0,
        mediaScore: 0,
        distance: 0,
    };

    // Only consider distance if location is valid
    if (!(userLocation.lat === 0 && userLocation.lon === 0)) {
        const posEvenet = { lat: event.lat, lon: event.lon };
        const distToEventInMeters = getDistance(posEvenet, userLocation);
        score -= (distToEventInMeters * user.DistanceWeight) / 1000;
        explanation.distance = distToEventInMeters;
    }

    // Ranking based on tags / personal interests
    // Wie viele meiner Tags die ich mag sind teil des Events
    const tagsUserLikes = await user.getFavouriteTags();
    const tagsOfEvent = await event.getTags();
    const tagsUserLikesOfEvent = intersection<Tag>(tagsUserLikes, tagsOfEvent);
    score += tagsUserLikesOfEvent.length * user.TagIntersectionWeight;
    explanation.tagScore = tagsUserLikesOfEvent.length * user.TagIntersectionWeight;

    // Ranking based on leaders/followees
    // Wie viele meiner Freunde haben sich schon für das Event angemeldet
    const peopleUserFollows = await user.getFollowees();
    const peopleAtEvent = await event.getAttendees();
    const peopleUserFollowsAtEvent = intersection<User>(peopleUserFollows, peopleAtEvent);
    score += peopleUserFollowsAtEvent.length * user.FolloweeIntersectionWeight;
    explanation.followeesScore = peopleUserFollowsAtEvent.length * user.FolloweeIntersectionWeight;

    // Ranking based on general ranking of the creator (average ranking of events of creator)
    const AverageEventRatingOfUser = await event.host.getRating();
    score += AverageEventRatingOfUser! * user.AverageEventRatingWeight; // Arbitrary scalar to mach how important ratings are compared to the other features
    explanation.ratingScore = AverageEventRatingOfUser! * user.AverageEventRatingWeight;

    // Ranking based on the availability of media
    // {scope: false} due to https://github.com/sequelize/sequelize/issues/3256
    const numberOfMedias = Math.min(await event.countMedia({ scope: false }), 10); // Ignore pieces of media beyond 10
    score += numberOfMedias * user.NumberOfMediasWeight;
    explanation.mediaScore = numberOfMedias * user.NumberOfMediasWeight;

    // Ranking based on coolnes of the event
    // Magischen Bewertungsalgorithmus aus dem Arsch ziehen

    return { score: score, explanation: explanation };
}
