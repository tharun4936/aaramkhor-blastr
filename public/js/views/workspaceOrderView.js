import orderView from "./orderView.js";

class workspaceOrderView extends orderView {
    orderArray = [];
    parentEl = document.querySelector('.--workspace-table-body');
    table_name = 'workspace-table';

    generateMarkup(orders) {
        console.log('inside generateMarkup...', orders)
        let markup = ``;
        for (let i = 0; i < orders.items.length; i++) {
            markup += `<tr>
            <th scope="row">1</th>
            <td>${orders.items[i].itemId}</td>
            <td>${orders.items[i].order}</td>
            <td>${orders.name}</td>
            <td>${orders.contact_email}</td>
            <td>${orders.phone}</td>
            <td contenteditable="true"></td>
            </tr>`
        }
        console.log('generated markup...', markup)
        return markup;
    }
}

export default new workspaceOrderView();