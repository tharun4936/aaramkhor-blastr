import workspaceOrderView from "./views/workspaceOrderView.js";

const socket = io();

class App {
    constructor() {

        workspaceOrderView.getLocalStorage();
        workspaceOrderView.renderAll();

    }
}

const app = new App();

window.addEventListener('beforeunload', function (e) {

    workspaceOrderView.setLocalStorage();

})

socket.on('connect', function () {

    console.log('Successfully connected!')

})

socket.on('updatedOrders', function (orders) {

    workspaceOrderView.addOrders(orders)
    workspaceOrderView.renderRows(orders);

})


