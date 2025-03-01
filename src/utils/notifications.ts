import { Expo, ExpoPushErrorTicket, ExpoPushMessage } from 'expo-server-sdk';
import { Op } from 'sequelize';

import PushToken from '../db/models/pushToken';

export type NotificationParams = Omit<ExpoPushMessage, 'to'>;

/**
 * See https://docs.expo.dev/push-notifications/sending-notifications and
 * https://github.com/expo/expo-server-sdk-node.
 */

// NOTE: the documentation recommends 15 minutes, but at our scale a low value *should* be fine
const TICKET_CHECK_DELAY = 10; // seconds

const expo = new Expo();

export async function sendNotification(userIDs: string[], params: NotificationParams) {
    if (!userIDs.length) return;

    const tokens = await PushToken.findAll({ where: { userId: { [Op.in]: userIDs } } });
    if (!tokens.length) {
        // n.b. this is not really an issue, users don't necessarily have push tokens
        console.log('no push tokens found for given users');
        return;
    }

    console.log(
        `sending push notification to ${tokens.length} token(s) (${userIDs.length} user(s))`,
    );

    const message: ExpoPushMessage = {
        channelId: 'default',
        to: tokens.map((t) => t.token),
        ...params,
    };

    // intentionally not awaiting this, since it can take some time (at least `TICKET_CHECK_DELAY` seconds),
    // and we don't really need to know the result
    sendMessages([message]).catch(console.error);
}

// TODO: improve error handling, remove invalid/unregistered push tokens from database
function handleError(ticket: ExpoPushErrorTicket) {
    console.error(`failed to send notification:`, ticket);
}

async function sendMessages(messages: ExpoPushMessage[]) {
    const ticketIDs: string[] = [];

    // send messages, receive tickets
    for (const chunk of expo.chunkPushNotifications(messages)) {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        for (const ticket of tickets) {
            if (ticket.status !== 'ok') handleError(ticket);
            else ticketIDs.push(ticket.id);
        }
    }

    if (!ticketIDs.length) return;

    // sleep for `TICKET_CHECK_DELAY` seconds before checking tickets
    await new Promise((resolve) => setTimeout(resolve, TICKET_CHECK_DELAY * 1000));

    // check tickets for errors
    await checkTickets(ticketIDs);
}

async function checkTickets(ticketIDs: string[]) {
    for (const chunk of expo.chunkPushNotificationReceiptIds(ticketIDs)) {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        for (const receipt of Object.values(receipts)) {
            if (receipt.status !== 'ok') handleError(receipt);
        }
    }
}
