import dotenv from "dotenv";
import path from 'path'
import express from 'express'
import hbs from 'hbs'
import { Server } from 'socket.io'
import http from 'http';
import smsRouter from './routers/smsRouter.js';
import emailRouter from './routers/emailRouter.js';
import whatsappRouter from './routers/whatsappRouter.js';
import APIRouter from './routers/api.js'

dotenv.config();

const __dirname = path.resolve()
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const publicDirectoryPath = path.join(__dirname, './public');
const viewsPath = path.join(__dirname, './templates/views');
const partialsPath = path.join(__dirname, './templates/partials');
const port = process.env.PORT || 3000;

app.set('view engine', 'hbs');
app.set('views', viewsPath);
app.set("io", io);

hbs.registerPartials(partialsPath)

app.use(express.static(publicDirectoryPath))
app.use(express.json());

app.use(emailRouter);
app.use(smsRouter);
app.use(whatsappRouter);
app.use(APIRouter);
// app.use(APIRouter);
// app.use(WebhookRouter);

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

io.on('connection', function (socket) {
    console.log(`Client ${socket.id} connected successfully`);
})

httpServer.listen(port, () => {
    console.log('Server is up at port ' + port + '...');
})


app.use(function (req, res, next) {
    res.status(404).send("Error 404. Page Not Found:(");
    next();
})

