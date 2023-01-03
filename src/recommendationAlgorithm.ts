import User from "./db/models/user";
import Event from "./db/models/event";
import { randomInt } from "crypto";
import { assert } from "console";

export default async function recommendationListForUser(user: User) {
    assert(user, `Recommendation Algorithm called without valid User. Instead the Parameter was ${user}`);

    const listOfAllEvents = await Event.findAll();

    // Have to use const for now, because of linter. But Array.sort says it modifies the original array, so const might throw an error. In that case the linter is just dumm
    const rankedEventList = listOfAllEvents.map( (event: Event) => { return {event: event, ranking: eventRankingForUser(event, user)}})

    // Sort from big to low. Highest ranking event at first index
    const sortetRankedEventList = rankedEventList.sort((rankedEventA, rankedEventB) => rankedEventB.ranking - rankedEventA.ranking)

    const sortetEventList = sortetRankedEventList.map( (rankedEvent) => rankedEvent.event)

    return sortetEventList;
}


function eventRankingForUser(event: Event, user:User) {
    return randomInt(10);
}