import express from 'express';
import {sendSMSNotification, checkWalletBalance} from '../helpers/sms.js';
import { googleSpreadsheetInit, populateSMSStatusSheet } from '../helpers/spreadsheet.js';
import chalk from 'chalk';

const smsRouter = new express.Router();

smsRouter.post('/sms/sendsms', async function(req,res){
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

export default smsRouter;