
const mailer = require('nodemailer');

let transporter = mailer.createTransport({
    host: 'smtp-relay.sendinblue.com',
    port: 587,
    secure: false,
    auth: {
        user: 'arbeit45@gmx.de',
        pass: 'M35kUprKacTGd7NW',
    },
})

export async function sendSimpleMail(email:string, sub:string, html:string){
    let info = await transporter.sendMail({
        from: '"Your Evented Team" <no-reply@evented.com>',
        to: email,
        subject: sub,
        html: html,
    }).catch(console.error);
    };

// type EmailWithName = {email:string, name:string}

// const Sib = require('sib-api-v3-sdk');
// const client = Sib.ApiClient.instance;
// const apiKey = client.authentications['api-key'].apiKey = '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';
// let TransactionalApiInstance = new Sib.TransactionalEmailsApi();




// async function sendTransacEmail(email:EmailWithName, subject:string, htmlContent:string, sender?:EmailWithName, cc?:EmailWithName, bcc?:EmailWithName, headers?:string) {

//     let emailDict: any = 
//     {
//         'subject':subject,
//         'to':[email],
//         'htmlContent':htmlContent,
//     }

//     if (sender) {
//         emailDict['sender'] = [sender];
//     }

//     if (cc) {
//         emailDict['cc'] = [cc];
//     }

//     if (bcc) {
//         emailDict['bcc'] = [bcc];
//     }

//     if (headers) {
//         emailDict.headers['headers'] = headers
//     }
    
//     TransactionalApiInstance.sendTransacEmail(
//         {
            
//         }
//     )
// }

// function expandEmail(email:string|{email:string, name:string}): [{email:string, name:string}] {
//     if (typeof email === 'string'){
//         return [{'email':email as string, 'name':'defaultName'}]
//     }
//     else {
//         return [email];
//     }
// }

