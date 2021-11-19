import express from 'express'
import chalk from 'chalk';
import { populateWorkspaceSheet, getRawOrdersData, googleSpreadsheetInit } from '../helpers.js'

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
        console.log(req.body);
        res.status(200).send()

    } catch (err) {

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