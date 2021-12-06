import express from 'express';
import validator from 'validator';
import {createTransporterObject, sendEmailNotification, emailMarkup} from '../helpers/email.js';
import {googleSpreadsheetInit, populateEmailStatusSheet} from '../helpers/spreadsheet.js';
import chalk from 'chalk';

const emailRouter = new express.Router();

emailRouter.post('/email/sendemail', async function(req,res){
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
});

export default emailRouter;
