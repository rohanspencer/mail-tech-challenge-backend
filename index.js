var dotenv = require('dotenv')

const result = dotenv.config()

if (result.error) {
    throw result.error
}

console.log(result.parsed)

var express = require('express')
var cors = require('cors')

const PORT = 3001

const app = express()
const fetch = require('node-fetch')

app.use(cors())
app.use(express.json())

app.post('/send', function(req, res) {
    console.log(req.body.toString())
    if (Object.keys(req.body).length === 0) {
        // express.json didn't get a valid request
        res
            .status(400)
            .set('Content-Type', 'application/json')
            .send('{}')
    } else {
        var sender = req.body.sender_email
        var recipients = req.body.recipient_emails
        var subject = req.body.subject
        var body = req.body.body
        console.log('recipeints', recipients)

        //construct json for sendgrid call
        var invalidRecipeints = false
        for (var i in recipients) {
            //allow for name but ensure email is there
            if (
                !(
                    recipients[i].hasOwnProperty('email') &&
                    Object.keys(recipients[i]).length <= 2
                )
            ) {
                invalidRecipeints = true
            }
        }
        if (!invalidRecipeints) {
            sendSendgrid(sender, recipients, subject, body)
            var status = 200
            res
                .status(status)
                .set('Content-Type', 'text/html')
                .send('{}')
        }
    }
})

function sendSendgrid(sender, recipients, subject, body) {
    var sendgridBody = {
        personalizations: [
            {
                to: recipients,
                subject: subject,
            },
        ],
        from: {
            email: sender,
        },
        reply_to: {
            email: sender,
        },
        subject: subject,
        content: [
            {
                type: 'text/html',
                value: '<html><p>' + body + '</p></html>',
            },
        ],
    }

    console.log('sending', sendgridBody)

    var sendgrid = {
        method: 'POST',
        headers: {
            Accept: 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-AU,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
            Authorization: 'Bearer ' + process.env.SENDGRID_API_KEY,
            Connection: 'keep-alive',
            'Content-Length': '358',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendgridBody),
    }

    console.log(process.env.SENDGRID_API_KEY)
    // send mail via sendgrid
    fetch('https://api.sendgrid.com/v3/mail/send', sendgrid)
        .then(sendgridRes => {
            if (sendgridRes.status != 202) {
                sendMailgun(sender, recipients, subject, body)
            }
        })
        .catch(sendgirdError => {
            sendMailgun(sender, recipients, subject, body)
        })
}

function sendMailgun(sender, recipients, subject, body) {
    var mailgunTo = ''

    for (var i in recipients) {
        if (mailgunTo != '') {
            mailgunTo = mailgunTo + ','
        }
        mailgunTo = mailgunTo + recipients[i].email
    }

    var mailgunBody = {
        from: sender,
        to: mailgunTo,
        subject: subject,
        text: body,
        html: body,
    }

    console.log('sending', mailgunBody)

    var mailgun = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive',
            'Content-Length': '358',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(mailgunBody),
    }

    fetch(
        'https://api:' +
            process.env.MAILGUN_API_KEY +
            '@api.mailgun.net/v3/messages',
        mailgun
    )
        .then(mailgunRes => {
            console.log(mailgunRes.status)
            console.log('mailgun ', mailgunRes)
        })
        .catch(mailgunError => {})
}

app.listen(PORT, err => {
    if (err) {
        throw err
    }
    console.log(`Listening on http://localhost:${PORT}/`)
})
