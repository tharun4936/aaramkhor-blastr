import orderView from "./orderView.js";

class workspaceOrderView extends orderView {

    orderArray = [];
    itemIndex = 0;
    parentEl = document.querySelector('.--workspace-table-body');
    table_name = 'workspace-table';

    generateMarkup(orders) {

        let markup = ``;
        for (let i = 0; i < orders.items.length; i++) {
            markup += `<tr>
            <td>${++this.itemIndex}</th>
            <td>${orders.items[i].itemId}</td>
            <td>${orders.items[i].order}</td>
            <td>${orders.name}</td>
            <td>${orders.contact_email}</td>
            <td>${orders.phone}</td>
            <td>${orders.created_at}</td>
            <td contenteditable="true"></td>
            </tr>`
        }
        return markup;

    }

    renderAll() {

        this.orderArray.forEach(orders => {
            this.renderRows(orders);
        })

    }
}

export default new workspaceOrderView();