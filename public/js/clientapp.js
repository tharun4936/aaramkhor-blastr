const socket = io();

socket.on('connect', function () {
    console.log('Successfully connected!')
})


socket.on('updatedOrders', function (orders) {
    console.log(orders);

    // document.querySelector('.--workspace-table-body').insertAdjacentHTML('afterend', `<tr>
    //                 <th scope="row">1</th>
    //                 <td>12345</td>
    //                 <td>t-shirt</td>
    //                 <td>Tharun</td>
    //                 <td>@mdo</td>
    //                 <td>9962326281</td>
    //                 <td contenteditable="true"></td>
    //             </tr>`)
    for (let i = 0; i < orders.items.length; i++) {
        document.querySelector('.--workspace-table-body').insertAdjacentHTML('afterend', `<tr>
        <th scope="row">1</th>
        <td>${orders.items[i].itemId}</td>
        <td>${orders.items[i].order}</td>
        <td>${orders.name}</td>
        <td>${orders.contact_email}</td>
        <td>${orders.phone}</td>
        <td contenteditable="true"></td>
        </tr>`)
    }
    // const rowHTML = `<tr>
    //                 <th scope="row">1</th>
    //                 <td>12345</td>
    //                 <td>t-shirt</td>
    //                 <td>Tharun</td>
    //                 <td>@mdo</td>
    //                 <td>9962326281</td>
    //                 <td contenteditable="true"></td>
    //                 </tr>`
})


// document.querySelector('h2').addEventListener('click', function () {
//     console.log('clicked');
//     fetch('/webhooks/orders/fulfilled').then(response => {
//         return response.json()
//     }).then(data => {
//         console.log(data);
//         const items = [];
//         const { contact_email, line_items, shipping_address } = data;
//         const name = shipping_address.name;
//         const phone = shipping_address.phone;
//         line_items.forEach(item => {
//             items.push({ itemId: item.id, order: item.title })
//         });
//         console.log(contact_email, phone, items, name);
//     })
// })



// const items = [];
//     const { contact_email, line_items, shipping_address } = data;
//     const name = shipping_address.name;
//     const phone = shipping_address.phone;
//     line_items.forEach(item => {
//         items.push({ itemId: item.id, order: item.title })~
//     });
//     console.log(contact_email, phone, items, name);
