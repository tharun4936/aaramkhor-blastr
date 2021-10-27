export default class orderView {



    renderRows(orders) {
        const markup = this.generateMarkup(orders);
        this.parentEl.insertAdjacentHTML('beforeend', markup)
    }

    addOrders(order) {
        this.orderArray.push(order);

    }

    setLocalStorage() {
        localStorage.setItem(this.table_name, JSON.stringify(this.orderArray));
    }

    getLocalStorage() {
        const data = JSON.parse(localStorage.getItem(this.table_name));
        if (!data) return;
        this.orderArray = data;

    }

    resetOrders() {
        localStorage.removeItem(this.table_name);
        location.reload();
    }

}
