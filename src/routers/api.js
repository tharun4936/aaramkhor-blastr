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

router.post('/api/orders/orderswithtrackingnumber', async function (req, res) {
    try {
        const data = req.body;
        console.log(data);
        const transporter = createTransporterObject();
        data.forEach(order => {
            if (validator.isEmail(order.customer_email)) {
                sendEmailNotification({
                    senderName: 'Tharun Ramachandran',
                    sender: 'tharun4936@gmail.com',
                    receiver: order.customer_email,
                    subject: 'Your Order has been Processed',
                    templateMessage: emailMarkup(order.customer_name, order.order, order.order_id, order.consignment_no),
                }, transporter);
                order.mail_status = 'Sent';
            }
        })
        const doc = await googleSpreadsheetInit();
        await populateStatusSheet(doc, data);
        res.status(200).send()
    }
    catch (err) {
        console.log(err);
        res.status(400).send(err)
    }
})

export default router;