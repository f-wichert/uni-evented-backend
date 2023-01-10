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
    // Wie viele meiner Tags die ich mag sind teil des Events

    // Ranking based on friends
    // Wie viele meiner Freunde haben sich schon für das Event angemeldet

    // Ranking based on my ranking of previous events of the creator
    // methode bei welchen Events ich von diesem Creator schon war

    // Ranking based on general ranking of the creator (average ranking of events of creator)
    // Methode um den average der Bewertungen meiner Events zu erstellen

    // Ranking based on coolnes of the event
    // Magischen Bewertungsalgorithmus aus dem Arsch ziehen

    return randomInt(10);
}
