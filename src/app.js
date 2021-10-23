import path from 'path'
import express from 'express'
import { API_KEY, PASSWORD } from './helpers.js'
// const fetch = require('node-fetch');
import fetch from 'node-fetch';


const __dirname = path.resolve()
const app = express();
const publicDirectoryPath = path.join(__dirname, '../public');
const viewsPath = path.join(__dirname, './templates/views');
const partialsPath = path.join(__dirname, './templates/partials');
const port = process.env.PORT || 3000;

console.log(viewsPath, partialsPath);
app.set('view engine', 'hbs');
app.set('view')

app.use(express.static(publicDirectoryPath))
app.use(express.json())


const fetchData = async function (resource) {
    try {
        const apiUrl = `https://demo-store-aaramkhor.myshopify.com/admin/api/2021-10/${resource}.json`
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

// app.get('', function (req, res) {
//     res.send("Hey there!")
// })

app.get('/products', async function (req, res) {
    try {
        const data = await fetchData('products');
        res.status(200);
        res.send(data);
    } catch (err) {
        res.status(500);
        res.send(err);
    }
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
// app.get('/orders', async )


app.listen(port, function () {
    console.log('Server is up at port ' + port + '...');
})
