import dotenv from 'dotenv';
import express from 'express';
import {sendWhatsappShipmentTemplateMsg, sendWhatsappSessionMessage} from '../helpers/whatsapp.js';
import {googleSpreadsheetInit, populateWhatsappStatusSheet} from '../helpers/spreadsheet.js'
import chalk from 'chalk';

dotenv.config();

const {WHATSAPP_CONTACT_NUMBER, GMAIL_API_USER} = process.env

const whatsappRouter = new express.Router();

whatsappRouter.post('/whatsapp/sendwhatsapp', async function(req,res){
    try {
        // const doc = await googleSpreadsheetInit();
        const doc = await googleSpreadsheetInit();
        const data = req.body.data;
        // console.log(data);
        let result;
        console.log('WHATSAPP STATUS\n---------------');
        for (let i = 0; i < data.length; i++) {
            result = await sendWhatsappShipmentTemplateMsg({
                order_id: data[i].order_id,
                consignment_no: data[i].consignment_no,
                customer_phone: data[i].customer_phone,
                created_at: data[i].created_at,
                service: 'IndiaPost',
                service_url: 'www.indiapost.gov.in',
                feedback_email: GMAIL_API_USER,
                messaging_service: 'Whatsapp',
                messaging_number: WHATSAPP_CONTACT_NUMBER
            })
            if (result.status === 'queued') {
                console.log(chalk`{yellow ${data[i].order_id}} ------ ${data[i].customer_phone} ------ {green queued}`);
                data[i].whatsapp_status = 'Sent';
                // console.log(data);
                
                // populateWhatsappStatusSheet(doc, data);
            }
            await sendWhatsappSessionMessage(`This chat window is completely automated. It will answer ONLY the following list of queries. For other queries, please ping +918160451369 on Whatsapp or email your query to shirtonomics@gmail.com\n\n1) Track my order - pls type "1:" and your order number. Eg -1:9716\n2) I want to place an order, but I want to know how long it will take to get delivered -  Pls type "2:"followed by your pincode. E.g. - 2:400067\n3) I have made a successful payment, but I don't have any order details - Pls type "3:" followed by the number you have given at checkout shipping address.\n4) I want to know about quality of your product" - Pls type "4:" followed by the product. Eg: 4:t-shirt OR 4:hoodie \n5) I want to know about return & exchange policy: Pls type "5:" followed by product. Eg: 5:t-shirt or 5:crop-top \n6) I want buy T-Shirts in Bulk - what discount will i get? - Pls type 6: followed by the QTY of tshirts you're looking to buy. Eg: 6:10\n7) I want to customize my design * - pls type *7\n8) I want to buy on COD, but it’s not available - pls type 8 followed by product. Eg. 8: physics T-shirt\n\n_PS: If you don't get the desired answer to your query, this chat service won't be able to assist you further - we request that you email your issue to shirtonomics@gmail.com or Whatsapp to +918160451369 - we will get back within 24 hours._`, `+91` + data[i].customer_phone);
        }
        // console.log(data);
        populateWhatsappStatusSheet(doc, data);
        res.status(200).send("This is whatsapp message-sending endpoint.");
        // console.log(result);
    } catch (err) {
        console.log(err);

        res.status(400).send(err.message);
    }
})

export default whatsappRouter;