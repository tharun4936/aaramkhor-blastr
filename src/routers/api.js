import express from 'express';
import { fetchData, populateEmailStatusSheet, populateSMSStatusSheet, populateWhatsappStatusSheet, googleSpreadsheetInit, createTransporterObject, sendEmailNotification, emailMarkup, sendSMSNotification, checkWalletBalance, sendWhatsappShipmentTemplateMsg, sendWhatsappSessionMessage, getDataFromSheet } from '../helpers.js'
import validator from 'validator';
import chalk from "chalk";

const router = new express.Router();
router.use(express.urlencoded({ extended: true }))

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
                    })
                    .catch(err => {
                        console.log(err.message);
                    });
            }
        })

        res.status(200).send()
    }
    catch (err) {
        console.log(err.message);
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
            }).catch(err => {
                console.log(err.message);
            })
        })
        res.status(200).send();
    } catch (err) {
        console.log(err.message)
        res.status(400).send();
    }
})

router.post('/api/orders/sendwhatsapp', async function (req, res) {
    try {
        const doc = await googleSpreadsheetInit();
        const data = req.body.data;
        console.log(data);
        let result;
        for (let i = 0; i < data.length; i++) {
            result = await sendWhatsappShipmentTemplateMsg({
                order_id: data[i].order_id,
                consignment_no: data[i].consignment_no,
                customer_phone: data[i].customer_phone,
                created_at: data[i].created_at,
                service: 'IndiaPost',
                service_url: 'www.indiapost.gov.in',
                feedback_email: 'shirtonomics@gmail.com'
            })
            if (result.status === 'queued') {
                // console.log(chalk`{yellow ${data[i].order_id}} ------ ${data[i].customer_phone} ------ {green ${data[i].message}}`)
                data[i].whatsapp_status = 'Sent';
                populateWhatsappStatusSheet(doc, data);
            }
        }
        res.status(200).send();
        console.log(result);
    } catch (err) {
        console.log(err);
        res.status(400).send();
    }
})

router.post('/api/orders/whatsapp/incoming', async function (req, res) {
    try {
        const doc = await googleSpreadsheetInit();
        console.log(req.body);
        const sender = '+14155238886';
        const reciever = req.body.From.slice(-13);
        const message = 'Your message has been recieved! \nThank you for responding! \n- From node chatbot';
        // rowData =  order_id,order,order_quantity,customer_name,customer_phone,customer_email,consignment_no,created_at,tracking_link
        const result = await getDataFromSheet(doc, '13361');
        // const result = await sendWhatsappSessionMessage(message, reciever);
        console.log(result);
        res.status(200).send();
    } catch (err) {
        res.status(400).send();
    }

})

export default router;