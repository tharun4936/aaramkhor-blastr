import unirest from "unirest";
import express from 'express';
import { fetchData, populateEmailStatusSheet, populateSMSStatusSheet, googleSpreadsheetInit, createTransporterObject, sendEmailNotification, emailMarkup, sendSMSNotification, checkWalletBalance } from '../helpers.js'
import validator from 'validator';
import chalk from "chalk";

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
                            // console.log(order.order_id + '--------------' + order.customer_email + '--------------' + 'Sent');
                            console.log(chalk`{yellow ${order.order_id}} ------ ${order.customer_email} ------ {green Sent}`)
                            mailsSent++;
                        }
                        else {
                            console.log(chalk`{yellow ${order.order_id}} ------ ${order.customer_email} ------ {red Not Sent}`)
                        }
                        if (flag === totalNoOfMails) {
                            console.log(`\n${mailsSent} of ${totalNoOfMails} mails sent!\n`);
                            populateEmailStatusSheet(doc, data);
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

router.post('/api/orders/sendsms', async function (req, res) {
    try {
        const doc = await googleSpreadsheetInit();
        const data = req.body.data;
        let sent = 0;
        let flag = 0;
        console.log('SMS Status\n----------\n');
        data.forEach((order) => {

            sendSMSNotification({
                order_id: order.order_id,
                consignment_no: order.consignment_no,
                customer_phone: order.customer_phone,
                service: 'IndiaPost',
                service_url: 'www.indiapost.gov.in',
                feedback_email: 'shirtonomics@gmail.com'
            }).then(result => {
                flag++;
                if (result.message.includes('SMS sent successfully.')) {
                    sent++;
                    console.log(chalk`{yellow ${order.order_id}} ------ ${order.customer_phone} ------ {green ${result.message}}`)
                    order.sms_status = 'Sent';
                }
                if (flag === data.length) {
                    console.log(`\n${sent} of ${flag} sent!`);
                    checkWalletBalance().then(wallet => {
                        console.log(chalk`Wallet balance: {green ${wallet}}`);
                    })
                    populateSMSStatusSheet(doc, data);
                }
            })
        })
        res.status(200).send();
    } catch (err) {
        res.status(400).send();
    }
})

export default router;