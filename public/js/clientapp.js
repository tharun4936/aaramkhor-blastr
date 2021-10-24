

document.querySelector('h2').addEventListener('click', function () {
    console.log('clicked');
    fetch('/webhooks/orders/fulfilled').then(response => {
        return response.json()
    }).then(data => {
        console.log(data);
        const items = [];
        const { contact_email, line_items, shipping_address } = data;
        const name = shipping_address.name;
        const phone = shipping_address.phone;
        line_items.forEach(item => {
            items.push({ itemId: item.id, order: item.title })
        });
        console.log(contact_email, phone, items, name);
    })
})



// const items = [];
//     const { contact_email, line_items, shipping_address } = data;
//     const name = shipping_address.name;
//     const phone = shipping_address.phone;
//     line_items.forEach(item => {
//         items.push({ itemId: item.id, order: item.title })
//     });
//     console.log(contact_email, phone, items, name);