import * as dotenv from 'dotenv';
import { random } from 'lodash';
dotenv.config();

import { sequelize, setupDatabase } from '../db';
import Event from '../db/models/event';
import Tag from '../db/models/tag';
import User from '../db/models/user';

export async function generateTestdata() {
    // Wait for DB Setup bevore saving data
    await setupDatabase(true);
    console.log('Successfully reset Database');

    const [
        PartyTag,
        BoardgamesTag,
        CardgamesTag,
        SportTag,
        DrinkingTag,
        HeavyDrinkingTag,
        ChillingTag,
        MusicTag,
        TechnoTag,
        BeerTag,
        AfterWorkTag,
        NSFWTag,
        BeerpongTag,
        FoodTag,
        AlternativeTag,
        TalkingTag,
    ] = await Promise.all(
        [
            {
                label: 'Party',
                value: 'party',
                color: 'blue',
            },
            {
                label: 'Boardgames',
                value: 'boardgames',
                color: 'brown',
            },
            {
                label: 'Cardgames',
                value: 'cardgames',
                color: 'crimson',
            },
            {
                label: 'Sport',
                value: 'sport',
                color: 'green',
            },
            {
                label: 'Drinking',
                value: 'drinking',
                color: 'orange',
            },
            {
                label: 'Heavy Drinking',
                value: 'heavy drinking',
                color: 'coral',
            },
            {
                label: 'Chilling',
                value: 'chilling',
                color: 'cadetblue',
            },
            {
                label: 'Music',
                value: 'music',
                color: 'violet',
            },
            {
                label: 'Techno',
                value: 'techno',
                color: 'red',
            },
            {
                label: 'Beer',
                value: 'beer',
                color: 'gold',
            },
            {
                label: 'After work',
                value: 'afterWork',
                color: 'salmon',
            },
            {
                label: 'NSFW',
                value: 'nsfw',
                color: 'orangered',
            },
            {
                label: 'Beerpong',
                value: 'beerpong',
                color: 'goldenrod',
            },
            {
                label: 'Food',
                value: 'food',
                color: 'lightsalmon',
            },
            {
                label: 'Alternative',
                value: 'alternative',
                color: 'deeppink',
            },
            {
                label: 'Talking',
                value: 'talking',
                color: 'dodgerblue',
            },
        ].map((tag) => Tag.create(tag)),
    );

    const users = await Promise.all(
        [
            {
                id: 'b4dd7b74-e531-4b42-b683-f2a9ec92f59b',
                username: 'Lorenzo',
                password: 'Verysecure',
                email: 'test1@evented.live',
            },
            {
                username: 'Notlorenzo',
                password: 'Verysecure',
                email: 'test2@evented.live',
            },
            {
                username: 'Reallorenzo',
                password: 'Verysecure',
                email: 'test3@evented.live',
            },
            {
                username: 'Alice',
                password: 'Verysecure',
                email: 'test4@evented.live',
            },
            {
                username: 'Bob',
                password: 'Verysecure',
                email: 'test5@evented.live',
            },
        ].map((user) => User.create(user)),
    );

    const baseDate = new Date();

    function addDays(date: Date, days: number) {
        return new Date(date.getTime() + days * 24 * 60 * 60000 + random(10000000) - 5000000);
    }

    const events = await Promise.all(
        [
            {
                name: 'Einer trinkt Warsteiner',
                startDateTime: baseDate,
                endDateTime: addDays(baseDate, 0.3),
                hostId: users[0].id,
                lat: 49.877836,
                lon: 8.653299,
                address: 'Im Herrengarten an der Eiche',
                musicStyle: 'Rock',
                description:
                    'Hi, ich habe nach einer Feier letztes Wochenende noch ein wenig zu viel Bier und wollte daher einladen mit mir im Herrengarten ein paar davon zu vernichten. Es gibt auch Kartenspiele und gute Musik. Wenn ihr Lust habt, kommt vorbei',
            },
            {
                name: 'Zwei gegen Alkoholfrei',
                startDateTime: addDays(baseDate, 1),
                endDateTime: addDays(baseDate, 1.3),
                hostId: users[1].id,
                lat: 49.872655,
                lon: 8.67185,
                address: 'Große Insel Woog',
                musicStyle: 'Pop/Electro',
                description:
                    'Servus, nachem mein Kumpel und ich wegen Uni schon lange nicht mehr trinken waren, haben wir uns entschlossen uns demnächst mal wieder richtig das Blechdach zu verbiegen. Bierpong steht bereit und wir willkommen jeden der Spaß daran hat sich mit uns gnadenlos Bier rein zu römern',
            },
            {
                name: 'Drei werden high',
                startDateTime: addDays(baseDate, 2),
                endDateTime: addDays(baseDate, 2.3),
                hostId: users[2].id,
                lat: 49.887014,
                lon: 8.666231,
                address: 'Im Bürgerpark',
                musicStyle: 'Reggae',
                description:
                    'Christian Lindner sagt Bubatz bald legal, also trainieren wir schonmal auf den großen Einstieg. Wir haben Brownies, Cupcakes und genug Chips um einen Airbag zu ersetzen. Wenn jemand selber was beisteuert wäre appreciated',
            },
            {
                name: 'Vier mit Bier',
                startDateTime: addDays(baseDate, 3),
                endDateTime: addDays(baseDate, 3.3),
                hostId: users[3].id,
                lat: 49.859685,
                lon: 8.670859,
                address: 'Beim Hochschulstadion',
                musicStyle: 'RnB',
                description:
                    'An diesem Abend wird dich auch kein Elotrans mehr retten. Nach dem Motto "Wer sich morgen noch dran erinnert war nicht dabei" wird sich hier so lange einer reingeorgelt bis ihr auf Werkseinstellungen zurückgesetzt seit. Wir wollen uns so hart die Kante geben, dass ihr eure Muttersprache vergesst und gegangen wird erst wenn ihr so zu seid wie eure Handbremse. Wir kennen auch die gemütlichsten Gräben, wenn ihr es nicht nach Hause schafft',
            },
            {
                name: 'Fünf stoßen an',
                startDateTime: addDays(baseDate, 4),
                endDateTime: addDays(baseDate, 4.3),
                hostId: users[4].id,
                lat: 49.845268,
                lon: 8.633742,
                address: 'An der SKV Rot-Weiß im Restaurant',
                musicStyle: 'Schlager',
                description:
                    'Wir sind ein Tennisteam aus Arbeitskolegen und haben letztens recht erfolgreich an unserem ersten Turnier teilgenommen. Um diesen Umstand zu gebührend zu feiern, laden wir alle Sportsfreunde ein mit uns einen entspannten Feierabend zu verbringen',
            },
        ].map((event) => Event.create(event)),
    );

    await Promise.all([
        users[0].setCurrentEvent(events[4]),
        users[1].setCurrentEvent(events[4]),
        users[2].setCurrentEvent(events[2]),
        users[3].setCurrentEvent(events[3]),
        users[4].setCurrentEvent(events[4]),

        events[0].addTags(BoardgamesTag, DrinkingTag, CardgamesTag, MusicTag, SportTag),
        events[1].addTags(ChillingTag, DrinkingTag, BeerTag, SportTag, BeerpongTag),
        events[2].addTags(ChillingTag, MusicTag, FoodTag, AlternativeTag),
        events[3].addTags(DrinkingTag, HeavyDrinkingTag, FoodTag, NSFWTag, BeerpongTag),
        events[4].addTags(AfterWorkTag, BeerTag, CardgamesTag, BoardgamesTag, TalkingTag, FoodTag),
    ]);

    // Not yet implemented
    await users[0].follow(users[1]);
    await users[1].follow(users[2]);
    await users[2].follow(users[3]);
    await users[3].follow(users[4]);
    await users[4].follow(users[0]);

    await users[0].addFavouriteTags(SportTag, ChillingTag, CardgamesTag, TalkingTag, BeerTag);
    await users[1].addFavouriteTags(
        SportTag,
        DrinkingTag,
        BeerTag,
        BeerpongTag,
        TalkingTag,
        MusicTag,
        AlternativeTag,
    );
    await users[2].addFavouriteTags(
        ChillingTag,
        TalkingTag,
        MusicTag,
        FoodTag,
        AlternativeTag,
        NSFWTag,
    );
    await users[3].addFavouriteTags(
        HeavyDrinkingTag,
        BeerTag,
        BeerpongTag,
        NSFWTag,
        MusicTag,
        TechnoTag,
    );
    await users[4].addFavouriteTags(SportTag, CardgamesTag, BeerTag, BoardgamesTag, TalkingTag);

    // You can not yet rate an event you are not affiliated with, because there is no EventAttendee Entry.
    // However as of now therer is no way to create this except to make it the current Event of the user.
    await users[0].rateEvent(events[0], 5);
    // await users[0].rateEvent(events[1], 4);
    // await users[0].rateEvent(events[2], 2);
    await users[1].rateEvent(events[1], 5);
    // await users[1].rateEvent(events[2], 1);
    // await users[1].rateEvent(events[3], 3);
    await users[2].rateEvent(events[2], 5);
    // await users[2].rateEvent(events[3], 1);
    // await users[2].rateEvent(events[4], 4);
    await users[3].rateEvent(events[3], 5);
    // await users[3].rateEvent(events[4], 3);
    // await users[3].rateEvent(events[0], 3);
    await users[4].rateEvent(events[4], 5);
    // await users[4].rateEvent(events[3], 3);
    // await users[4].rateEvent(events[1], 3);

    // speed up script exit
    await sequelize.close();
    console.log('Successfully created new Data!');
}

// only run if module invoked directly
if (require.main === module) {
    void generateTestdata();
}
