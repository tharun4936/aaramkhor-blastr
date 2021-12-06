import express from 'express'
import chalk from 'chalk';
import { populateWorkspaceSheet, getRawOrdersData, googleSpreadsheetInit, getDataFromSheet, sendWhatsappSessionMessage } from '../helpers/helpers.js'

const router = new express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }))

router.post('/webhooks/orders/created', async function (req, res) {

    try {
        console.log(req.body)
        const data = getRawOrdersData(req.body)
        if (data.errors) throw new Error(data.errors)
        const doc = await googleSpreadsheetInit();
        await populateWorkspaceSheet(doc, data);
        const io = req.app.get("io")
        io.sockets.emit('updatedOrders', data);
        res.status(200).send();
    } catch (err) {
        console.log(err);
        res.status(404).send(err);
    }

})

router.post('/webhooks/orders/fulfilled', async function (req, res) {
    try {
        const data = req.body;
        console.log('Showing all the fulfilled orders...')
        console.log(data);
        res.status(200).send()
    } catch (err) {
        console.log(err.message)
        res.status(404).send(err)
    }
})

router.post('/webhooks/sms/incoming', function (req, res) {
    try {
        console.log(req);
        res.status(200).send()

    } catch (err) {

    }
})

router.post('/webhooks/sms/status', function (req, res) {
    try {
        console.log(req.body);
        res.status(200).send()

    } catch (err) {

    }
})

router.post('/webhooks/sms/status/fallback', function (req, res) {
    try {
        // console.log(req.body);
        res.status(200).send()

    } catch (err) {

    }
})

router.post('/webhooks/whatsapp/incoming', async function (req, res) {
    try {
        const doc = await googleSpreadsheetInit();
        // console.log(req.body);
        const data = req.body;
        console.log(data);
        const receivedMessage = data.Body;
        let sessionMessage;
        // console.log(receivedMessage);
        if(receivedMessage === 'Query'){
            sessionMessage = `Thanks for getting in touch. FAQ:
        1) Track my order - pls type "1:" and your order number. Eg -"1:9716"
        2) "I want to place an order, but I want to know how long it will take to get delivered" -  Pls type "2:"followed by your pincode. E.g. - "2:400067"
        3) "I have made a succesful payment, but I don't have any order details" - Pls type "3:" followed by the name you entered at checkout. Also, pls share the screenshot of the payment transaction reference.
        4) I want to know about quality of Product - Pls type "4:" followed by the product.Eg: "4:Tshirt" or "4:Hoodie" 
        5) I want to know about return&exchange policy: Pls type "5:" followed by product. Eg: "5:Tshirt" or "5:Crop top" 
        6) I want buy T-Shirts in Bulk - what discount will i get? - Pls type "6: followed by the QTY of tshirts you're looking to buy. Eg: "6:10"
        7) *I want to customize my design * - pls type 7
        8) i want to buy on COD, but it’s not available - pls type 8 followed by product. Eg. “8: physics T-shirt”`
        }
        else if(receivedMessage === 'Order Status'){
            sessionMessage = `You can track your order by entering the tracking number or consignment number given into the official IndiaPost portal (www.indiapost.gov.in)`;
        }
        else {
            sessionMessage = `Enter a valid Query!`
        }
        const receiverPhone = req.body.From.slice(-13);
        // const sender = '+14155238886';
        // const reciever = req.body.From.slice(-13);
        // const sessionMessage = 'Your message has been recieved! \nThank you for responding! \n- From node chatbot';
        // // rowData =  order_id,order,order_quantity,customer_name,customer_phone,customer_email,consignment_no,created_at,tracking_link
        // const result = await getDataFromSheet(doc, '13361');
        const messageResult= await sendWhatsappSessionMessage(sessionMessage, receiverPhone);
        // console.log(messageResult);
        res.status(200).send();
    } catch (err) {
        console.log(err);
        res.status(400).send();
    }

})

router.post('/webhooks/whatsapp/status', function (req, res) {
    try {
        if (req.body.SmsStatus === 'sent') {
            const data = req.body;
            const phone = data.To.split(':')[1].slice(-10);
            const status = data.MessageStatus;
            console.log('WHATSAPP STATUS\n---------------\n');
            console.log(chalk`${phone} ------ {green ${status}}`);
            // console.log(req.body);
        }
        res.status(200).send();
    }
    catch (err) {
        console.log(err);
    }
})


export default router;