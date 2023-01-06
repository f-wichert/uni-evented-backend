import { assert } from 'console';
import { randomInt } from 'crypto';
import Event from './db/models/event';
import User from './db/models/user';

export default function recommendationListForUser(user: User, eventList: Event[]) {
    assert(
        user,
        `Recommendation Algorithm called without valid User. Instead the Parameter was ${user.username}`,
    );
    assert(
        eventList.length !== 0,
        `There were no events to rank. Eventlist parameter has length 0`,
    );

    // Have to use const for now, because of linter. But Array.sort says it modifies the original array, so const might throw an error. In that case the linter is just dumm
    const rankedEventList = eventList.map((event: Event) => {
        return { event: event, ranking: eventRankingForUser(event, user) };
    });

    // Sort from big to low. Highest ranking event at first index
    const sortetRankedEventList = rankedEventList.sort(
        (rankedEventA, rankedEventB) => rankedEventB.ranking - rankedEventA.ranking,
    );

    const sortetEventList = sortetRankedEventList.map((rankedEvent) => rankedEvent.event);
    return sortetRankedEventList;
}

function eventRankingForUser(event: Event, user: User) {
    // Ranking based on tags / personal interests

    // Ranking based on friends

    // Ranking based on my ranking of previous events of the creator

    // Ranking based on general ranking of the creator (average ranking of events of creator)

    // Ranking based on coolnes of the event

    return randomInt(10);
}
