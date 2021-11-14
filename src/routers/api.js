import unirest from "unirest";
import express from 'express';
import { fetchData, populateStatusSheet, googleSpreadsheetInit, createTransporterObject, sendEmailNotification, emailMarkup } from '../helpers.js'
import validator from 'validator';

const router = new express.Router();

router.get('/api/orders', async function (req, res) {
    try {
        const data = await fetchData('orders', '?status=any');
        // res.status(200);
        res.send(data);
    } catch (err) {
        res.status(500);
        res.send(err);
    }
})

router.get('/api/products', async function (req, res) {
    try {
        const data = await fetchData('products');
        res.status(200);
        res.send(data);
    } catch (err) {
        res.status(500);
        res.send(err);
    }
})

router.get('/api/customers', async function (req, res) {
    try {
        const data = await fetchData('customers');
        res.status(200);
        res.send(data);
    } catch (err) {
        res.status(500);
        res.send(err);
    }
})

router.get('/api/draft_orders', async function (req, res) {
    try {
        const data = await fetchData('draft_orders');
        res.status(200);
        res.send(data);
    } catch (err) {
        res.status(500);
        res.send(err);
    }
})

router.post('/api/orders/sendemail', async function (req, res) {
    try {
        const doc = await googleSpreadsheetInit();
        const data = req.body.data;
        const notification = req.body.notification;
        console.log(req.body)

        const transporter = createTransporterObject();
        const totalNoOfMails = data.length;
        let mailsSent = 0;
        let flag = 0;
        console.log('MAIL STATUS\n___________\n');
        data.forEach(order => {
            if (validator.isEmail(order.customer_email)) {

                sendEmailNotification({
                    senderName: 'Aaramkhor Apparels',
                    sender: 'shirtonomics@gmail.com',
                    receiver: order.customer_email,
                    subject: 'Your Order has been Processed',
                    templateMessage: emailMarkup(order.customer_name, order.order, order.order_id, order.consignment_no),
                }, transporter)
                    .then((result) => {
                        flag++;
                        if (result.accepted.includes(order.customer_email)) {
                            order.mail_status = 'Sent';
                            console.log(order.order_id + '--------------' + order.customer_email + '--------------' + 'Sent');
                            mailsSent++;
                        }
                        else {
                            console.log(order_id + '--------------' + order.customer_email + '--------------' + 'Not Sent');
                        }
                        if (flag == totalNoOfMails) {
                            console.log(`\n${mailsSent} of ${totalNoOfMails} mails sent!`);
                            populateStatusSheet(doc, data);
                        }

                        // console.log(order)
                    })
                    .catch(err => {
                        throw err;
                    });

                // order.mail_status = 'Sent';
            }
        })

        res.status(200).send()
    }
    catch (err) {
        console.log(err);
        res.status(400).send(err)
    }
})

router.post('/api/orders/sendsms', function (req, res) {
    try {
        const request = unirest("GET", "https://www.fast2sms.com/dev/bulkV2");
        const data = req.body.data;
        let sent = 0;
        console.log('SMS Status\n----------\n');
        request.headers({
            "cache-control": "no-cache"
        });
        data.forEach((order, index) => {
            request.query({
                "authorization": "iLuCRAWPsIT2m8ObaBqrp5MwFzJQoKgx69jX4DNtnlE1S0HydkZfE5UH7gXkJlVntyN3xOpcmsQGeWw2",
                "sender_id": "ARMKHR",
                "message": "132707",
                "variables_values": `${order.order_id}|IndiaPost|${order.consignment_no}|www.indiapost.gov.in|shirtonomics@gmail.com|`,
                "route": "dlt",
                "numbers": `${order.customer_phone}`,
            });
            request.end(function (res) {
                if (res.body.message.includes("SMS sent successfully.")) sent++;
                if (res.error) throw new Error(res.error);
                console.log(order.order_id + '--------------' + order.customer_phone + '--------------' + res.body.message);
                if (index === data.length - 1) console.log(`\n${sent} of ${data.length} sent!\n`);
                // console.log(res.body);
            });

        })
        res.status(200).send();
    } catch (err) {
        res.status(400).send();
    }
})

export default router;