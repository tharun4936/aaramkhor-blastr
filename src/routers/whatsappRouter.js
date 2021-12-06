import express from 'express';
import {sendWhatsappShipmentTemplateMsg} from '../helpers/whatsapp.js';
import {googleSpreadsheetInit, populateWhatsappStatusSheet} from '../helpers/spreadsheet.js'
import chalk from 'chalk';

const whatsappRouter = new express.Router();

whatsappRouter.post('/whatsapp/sendwhatsapp', async function(req,res){
    try {
        // const doc = await googleSpreadsheetInit();
        const data = req.body.data;
        // console.log(data);
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
                console.log(chalk`{yellow ${data[i].order_id}} ------ ${data[i].customer_phone} ------ {green queued}`);
                data[i].whatsapp_status = 'Sent';
                // populateWhatsappStatusSheet(doc, data);
            }
        }
        res.status(200).send("This is whatsapp message-sending endpoint.");
        // console.log(result);
    } catch (err) {
        // console.log(err);
        res.status(400).send();
    }
})

export default whatsappRouter;