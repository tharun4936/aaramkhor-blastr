import path from 'path'
import express, { query } from 'express'
import fetch from 'node-fetch';
import hbs from 'hbs'
import dotenv from 'dotenv'
import { Server } from 'socket.io'
import http from 'http';



dotenv.config();

const { API_KEY, PASSWORD, HOST_NAME, VERSION } = process.env;
const __dirname = path.resolve()
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const publicDirectoryPath = path.join(__dirname, './public');
const viewsPath = path.join(__dirname, './templates/views');
const partialsPath = path.join(__dirname, './templates/partials');
const port = process.env.PORT || 3000;
// console.log(viewsPath, partialsPath, publicDirectoryPath);
app.set('view engine', 'hbs');
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)
app.use(express.static(publicDirectoryPath))
app.use(express.json())


const fetchData = async function (resource, query = '') {
    try {
        const apiUrl = `https://${HOST_NAME}/admin/api/${VERSION}/${resource}.json${query}`
        const response = await fetch(apiUrl, {
            method: 'GET',
            mode: 'no-cors',
            headers: {
                'X-Shopify-Access-Token': `${PASSWORD}`,
                'Authorization': `Basic ${Buffer.from(`${API_KEY}:${PASSWORD}`).toString('base64')}`
            }
        })
        const data = await response.json();
        return data;
    } catch (err) {
        throw new Error('Something went wrong!')
    }

}

app.get('', function (req, res) {
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


app.get('/products', async function (req, res) {
    res.render('products', {
        page: 'Products'
    })

})

app.get('/orders', async function (req, res) {
    try {
        const data = await fetchData('orders');
        res.status(200);
        res.send(data);
    } catch (err) {
        res.status(500);
        res.send(err);
    }
})

app.get('/customers', async function (req, res) {
    try {
        const data = await fetchData('customers');
        res.status(200);
        res.send(data);
    } catch (err) {
        res.status(500);
        res.send(err);
    }
})

app.get('/draft_orders', async function (req, res) {
    try {
        const data = await fetchData('draft_orders');
        res.status(200);
        res.send(data);
    } catch (err) {
        res.status(500);
        res.send(err);
    }
})

app.get('/api/orders', async function (req, res) {
    try {
        const data = await fetchData('orders', '?status=any');
        res.status(200);
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

app.post('/webhooks/orders/created', function (req, res) {
    const data = req.body;
    console.log('Showing all the created orders...')
    console.log(req.body);
    res.status(200).send();
    // res.send(data);

})

app.post('/webhooks/orders/fulfilled', function (req, res) {
    const data = req.body;
    console.log('Showing all the fulfilled orders...')
    console.log(req.body);
    res.status(200).send()
    const items = [];
    const { contact_email, line_items, shipping_address } = data;
    const name = shipping_address.name;
    const phone = shipping_address.phone;
    line_items.forEach(item => {
        items.push({ itemId: item.id, order: item.title })
    });
    console.log(contact_email, phone, items, name);
    io.sockets.emit('updatedOrders', {
        name,
        items,
        contact_email,
        phone
    })
    // res.send(data);
    // const items = [];
    // const { contact_email, line_items, shipping_address } = data;
    // const name = shipping_address.name;
    // const phone = shipping_address.phone;
    // line_items.forEach(item => {
    //     items.push({ itemId: item.id, order: item.title })
    // });
    // console.log(contact_email, phone, items, name);
    // res.send(data);
})


io.on('connection', function (socket) {
    console.log(`Client ${socket.id} connected successfully`);
})

httpServer.listen(port, function () {
    console.log('Server is up at port ' + port + '...');
})



