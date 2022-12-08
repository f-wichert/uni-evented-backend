import mailer from 'nodemailer';

import config from '../config';

const transporter = mailer.createTransport(config.SMTP_URL, {
    connectionTimeout: 15 * 1000,
    greetingTimeout: 15 * 1000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: true,
});

export async function sendMail(
    recipient: string,
    subject: string,
    options: Omit<mailer.SendMailOptions, 'from' | 'to' | 'subject'>,
) {
    await transporter.sendMail({
        from: '"Your Evented Team" <no-reply@evented.live>',
        to: recipient,
        subject: subject,
        ...options,
    });
}
