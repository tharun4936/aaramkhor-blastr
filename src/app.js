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

const convertOrdersFromRawData = function (orders) {
    const converted = [];
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
    return converted;
}

const populateWorkspaceSheet = async function (doc, data) {
    try {
        const spreadsheetData = convertOrdersFromRawData(data);
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

const getRawOrdersCreationData = function (requestBody) {
    const items = [];
    const { line_items, shipping_address, created_at } = requestBody;
    const contact_email = requestBody.contact_email ?? "Not Provided"
    const name = shipping_address.name;
    const phone = shipping_address.phone ?? "Not Provided!";
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
    console.log('Showing all the created orders...')
    console.log(req.body);
    res.status(200).send();
    const doc = await googleSpreadsheetInit();
    // const workspaceSheet = doc.sheetsByTitle['Logistics'];
    const data = getRawOrdersCreationData(req.body)
    io.sockets.emit('updatedOrders', data);
    await populateWorkspaceSheet(doc, data);

    // res.send(data);

})

app.post('/webhooks/orders/fulfilled', function (req, res) {
    const data = req.body;
    console.log('Showing all the fulfilled orders...')
    console.log(data);
    res.status(200).send()

})

io.on('connection', function (socket) {
    console.log(`Client ${socket.id} connected successfully`);
})

httpServer.listen(port, () => {
    console.log('Server is up at port ' + port + '...');
})




