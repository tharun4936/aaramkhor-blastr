import path from 'path'
import express, { query } from 'express'
import fetch from 'node-fetch';
import hbs from 'hbs'
import dotenv from 'dotenv'

dotenv.config();

const { API_KEY, PASSWORD, HOST_NAME, VERSION } = process.env;
const __dirname = path.resolve()
const app = express();
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
        page: "Order Status"
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

app.post('/webhooks/orders/fulfilled', function (req, res) {
    const data = req.body;
    console.log(req.body);
})

app.listen(port, function () {
    console.log('Server is up at port ' + port + '...');
})
