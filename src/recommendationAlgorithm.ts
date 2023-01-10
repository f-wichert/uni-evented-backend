import { assert } from 'console';
import { randomInt } from 'crypto';
import Event from './db/models/event';
import User from './db/models/user';

export default async function recommendationListForUser(user: User, eventList: Event[]) {
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
            return { event: event, ranking: await eventRankingForUser(event, user) };
        }),
    );

    // Sort from big to low. Highest ranking event at first index
    const sortetRankedEventList = rankedEventList.sort(
        (rankedEventA, rankedEventB) => rankedEventB.ranking - rankedEventA.ranking,
    );

    // const sortetEventList = sortetRankedEventList.map((rankedEvent) => rankedEvent.event);
    return sortetRankedEventList;
}

async function eventRankingForUser(event: Event, user: User): Promise<number> {
    // Ranking based on tags / personal interests
    // Wie viele meiner Tags die ich mag sind teil des Events

    // Ranking based on leaders/followees
    // Wie viele meiner Freunde haben sich schon für das Event angemeldet

    // Ranking based on my ranking of previous events of the creator

    // Ranking based on average public rating of the creators previous events
    const AverageEventRatingOfUser = await user.getRating();

    // Ranking based on general ranking of the creator (average ranking of events of creator)
    // Methode um den average der Bewertungen meiner Events zu erstellen

    // Ranking based on coolnes of the event
    // Magischen Bewertungsalgorithmus aus dem Arsch ziehen

    return randomInt(10);
}
