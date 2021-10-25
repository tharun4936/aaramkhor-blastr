export default class orderView {
    // parentEl = 
    //ordersArray = [];
    //table_name = '';

    // constructor() {
    //     console.log('orderTable object created')

    // }
    // generateMarkup(orders){


    // }
    renderRows(orders) {
        console.log(orders);
        console.log(this.parentEl);
        const markup = this.generateMarkup(orders)
        console.log(markup)
        this.parentEl.insertAdjacentHTML('afterend', markup)
    }
    renderAll() {
        this.ordersArray.forEach(orders => {
            this.renderRow(orders);
        });
    }
    addOrders(order) {
        this.orderArray.push(order);
    }
    setOrders() {
        localStorage.setItem(this.table_name, JSON.stringify(this.orderArray));
    }
    getOrders() {
        const data = localStorage.getItem(this.table_name);
        this.orderArray = JSON.parse(data);
    }
}
