var express = require('express')
var cors = require('cors')

const PORT = 3001

const app = express()
const request = require('request')

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

        //construct json for sendgrid call
        var sendgrid = {
            personalizations: [
                {
                    to: [],
                    subject: subject,
                },
            ],
            from: {
                email: sender,
            },
            content: [
                {
                    type: 'text/plain',
                    value: body,
                },
            ],
        }

        for (var i in recipients) {
            sendgrid.personalizations.to.push({ email: i.recipient })
        }

        var options = {
            url: 'https://api.sendgrid.com/v3/mail/send',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + process.env.SENDGRID_API_KEY,
                method: 'POST',
            },
        }

        request(options, function(error, response, body) {
            console.log('error', error)
            console.log('resp', response)
            console.log('body', body)
        })

        //send http request to
        res
            .status(200)
            .set('Content-Type', 'application/json')
            .send('{"string":"hello world"}')
    }
})

app.listen(PORT, err => {
    if (err) {
        throw err
    }
    console.log(`Listening on http://localhost:${PORT}/`)
})
