import { readFile } from 'fs/promises';
import path from 'path'
import express from 'express'
import hbs from 'hbs'
import dotenv from 'dotenv'
import { Server } from 'socket.io'
import Shopify from 'shopify-api-node';
import http from 'http';
import { GoogleSpreadsheet } from 'google-spreadsheet'
const creds = JSON.parse(
    await readFile(
        new URL('./credentials.json', import.meta.url)
    )
);

dotenv.config();

const { API_KEY, PASSWORD, HOST_NAME, VERSION, SPREADSHEET_ID, TRACKING_LINK } = process.env;
const shopify = new Shopify({
    shopName: HOST_NAME,
    apiKey: API_KEY,
    password: PASSWORD,
    apiVersion: VERSION
});

const __dirname = path.resolve()
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const publicDirectoryPath = path.join(__dirname, './public');
const viewsPath = path.join(__dirname, './templates/views');
const partialsPath = path.join(__dirname, './templates/partials');
const port = process.env.PORT || 3000;

app.set('view engine', 'hbs');
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)
app.use(express.static(publicDirectoryPath))
app.use(express.json())



const fetchData = async function (resource, query = '') {
    try {
        let data;
        if (resource === 'orders')
            data = await shopify.order.list();
        else if (resource === 'customers')
            data = await shopify.customer.list();
        else if (resource === 'products')
            data = await shopify.product.list();
        else if (resource === 'draft_orders')
            data = await shopify.draftOrder.list();
        else throw new Error('Invalid resource')
        return data;
    } catch (err) {
        throw err
    }
}

const convertFromRawOrdersData = function (orders) {
    const converted = [];
    // console.log(orders);
    for (let i = 0; i < orders.items.length; i++) {
        converted.push({
            order_id: orders.items[i].itemId,
            order: orders.items[i].order,
            order_quantity: orders.items[i].quantity,
            customer_name: orders.name,
            customer_phone: orders.phone,
            customer_email: orders.contact_email,
            created_at: orders.created_at,
            consignment_no: '',
            tracking_link: TRACKING_LINK
        })
    }
    console.log('convertedOrdersformRqawdata', converted)
    return converted;
}

const populateWorkspaceSheet = async function (doc, data) {
    try {
        await doc.loadInfo()
        const spreadsheetData = convertFromRawOrdersData(data);
        // console.log(spreadsheetData)
        const workspaceSheet = doc.sheetsByTitle['Logistics'];
        for (let i = 0; i < spreadsheetData.length; i++) {
            // await doc.loadInfo();
            await workspaceSheet.addRow({
                Order_Number: String(spreadsheetData[i].order_id),
                Order: spreadsheetData[i].order,
                Order_Quantity: spreadsheetData[i].order_quantity,
                Customer_Name: spreadsheetData[i].customer_name,
                Customer_Phone: String(spreadsheetData[i].customer_phone),
                Email: spreadsheetData[i].customer_email,
                Tracking_Number: spreadsheetData[i].consignment_no,
                Created_At: spreadsheetData[i].created_at,
                Tracking_Link: spreadsheetData[i].tracking_link
            })
        }
    } catch (err) {
        throw err;
    }
}

const populateStatusSheet = async function (doc, spreadsheetData) {
    try {
        await doc.loadInfo();
        // console.log(spreadsheetData)
        const statusSheet = doc.sheetsByTitle['Notification Status'];
        for (let i = 0; i < spreadsheetData.length; i++) {
            // await doc.loadInfo();
            await statusSheet.addRow({
                S_No: spreadsheetData[i].s_no,
                Order_Number: String(spreadsheetData[i].order_id),
                Order: spreadsheetData[i].order,
                Order_Quantity: spreadsheetData[i].order_quantity,
                Customer_Name: spreadsheetData[i].customer_name,
                Customer_Phone: String(spreadsheetData[i].customer_phone),
                Customer_Email: spreadsheetData[i].customer_email,
                Tracking_Number: spreadsheetData[i].consignment_no,
                Created_At: spreadsheetData[i].created_at,
                Tracking_Link: spreadsheetData[i].tracking_link,
                Mail_Status: spreadsheetData[i].mail_status,
                Whatsapp_Status: spreadsheetData[i].whatsapp_status,
                SMS_Status: spreadsheetData[i].sms_status,
                Date_Modified: spreadsheetData[i].date_modified
            })
        }
    } catch (err) {
        throw err;
    }

}

const getRawOrdersData = function (requestBody) {
    try {
        let contact_email;
        let phone;
        const items = [];

        const { line_items, shipping_address, created_at } = requestBody;

        if (requestBody.contact_email) contact_email = requestBody.contact_email;
        else contact_email = "Not Provided"

        const name = shipping_address.name

        if (shipping_address.phone) phone = shipping_address.phone
        else phone = "Not Provided!";

        const dateArr = created_at.split('T')[0].split('-');
        const date = `${dateArr[2]}/${dateArr[1]}/${dateArr[0]}`;
        const time = created_at.split('T')[1];

        line_items.forEach(item => {
            items.push({ itemId: item.id, order: item.title, quantity: item.quantity })
        });

        return {
            name,
            items,
            contact_email,
            phone,
            created_at: `${date} : ${time}`
        }

    } catch (err) {
        throw err;
    }

}

const googleSpreadsheetInit = async function () {
    try {
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo();
        return doc;
    } catch (err) {
        throw err;
    }
}

const convertFromSpreadsheet = function (data) {
    const items = [];
    for (let i = 0; i < data.s_no.length; i++) {
        items.push({
            s_no: data.s_no[i],
            order_id: data.order_no[i],
            order: data.order[i],
            order_quantity: data.order_quantity[i],
            customer_name: data.customer_name[i],
            customer_phone: data.customer_phone[i],
            customer_email: data.customer_email[i],
            consignment_no: data.tracking_no[i],
            created_at: data.created_at[i],
            tracking_link: data.tracking_link[i],
            mail_status: data.mail_status[i],
            whatsapp_status: data.whatsapp_status[i],
            sms_status: data.sms_status[i],
            date_modified: data.date_modified[i]
        })
    }
    return items;

}


app.get('', async function (req, res) {

    res.render('index', {
        page: 'Orders'
    });
})

app.get('/index', function (req, res) {
    res.render('index', {
        page: 'Orders'
    });
})

app.get('/guide', function (req, res) {
    res.render('guide', {
        page: 'Guide'
    });
})

app.get('/order_status', function (req, res) {
    res.render('order_status', {
        page: "Notification Status"
    });
})


app.get('/api/orders', async function (req, res) {
    try {
        const data = await fetchData('orders', '?status=any');
        // res.status(200);
        res.send(data);
    } catch (err) {
        res.status(500);
        res.send(err);
    }
})

app.get('/api/products', async function (req, res) {
    try {
        const data = await fetchData('products');
        res.status(200);
        res.send(data);
    } catch (err) {
        res.status(500);
        res.send(err);
    }
})

app.get('/api/customers', async function (req, res) {
    try {
        const data = await fetchData('customers');
        res.status(200);
        res.send(data);
    } catch (err) {
        res.status(500);
        res.send(err);
    }
})

app.get('/api/draft_orders', async function (req, res) {
    try {
        const data = await fetchData('draft_orders');
        res.status(200);
        res.send(data);
    } catch (err) {
        res.status(500);
        res.send(err);
    }
})

app.post('/webhooks/orders/created', async function (req, res) {
    // const data = req.body;
    // console.log('Showing all the created orders...')
    // console.log(req.body);
    try {
        const data = getRawOrdersData(req.body)
        if (data.errors) throw new Error(data.errors)
        const doc = await googleSpreadsheetInit();
        // const workspaceSheet = doc.sheetsByTitle['Logistics'];
        io.sockets.emit('updatedOrders', data);
        // console.log('Webhoks route', data);
        await populateWorkspaceSheet(doc, data);
        res.status(200).send();
    } catch (err) {
        console.log(err.message);
        res.status(404).send(err);
    }

})

app.post('/api/orders/orderswithtrackingnumber', async function (req, res) {
    try {
        const data = req.body;
        const updatedSpreadsheetData = convertFromSpreadsheet(data);
        console.log(updatedSpreadsheetData);
        const doc = await googleSpreadsheetInit();
        await populateStatusSheet(doc, updatedSpreadsheetData);
        res.status(200).send()
    }
    catch (err) {
        console.log(err.message);
        res.status(400).send(err)
    }

})

app.post('/webhooks/orders/fulfilled', async function (req, res) {
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

io.on('connection', function (socket) {
    console.log(`Client ${socket.id} connected successfully`);
})

httpServer.listen(port, () => {
    console.log('Server is up at port ' + port + '...');
})


