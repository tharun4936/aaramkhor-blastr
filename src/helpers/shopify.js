import Shopify from 'shopify-api-node';

const {HOST_NAME, API_KEY, PASSWORD, VERSION} = process.env;

const shopify = new Shopify({
    shopName: HOST_NAME,
    apiKey: API_KEY,
    password: PASSWORD,
    apiVersion: VERSION
});

export const fetchData = async function (resource, query = '') {
    try {
        let data;
        if (resource === 'orders')
            data = await shopify.order.list();
        else if (resource === 'customers')
            data = await shopify.customer.list();
        else if (resource === 'products')
            data = await shopify.product.list();
        else if (resource === 'draft_orders')
            data = await shopify.draftOrder.list();
        else throw new Error('Invalid resource')
        return data;
    } catch (err) {
        throw err
    }
}

export const getRawOrdersData = function (requestBody) {
    try {
        let contact_email;
        let phone;
        let order_id;
        const items = [];

        const { line_items, shipping_address, created_at } = requestBody;
        if (requestBody.customer.last_order_name)
            order_id = requestBody.customer.last_order_name.slice(1);
        else
            order_id = String(requestBody.id);

        if (requestBody.contact_email) {
            contact_email = requestBody.contact_email;
        }
        else contact_email = "Not Provided!"

        const name = shipping_address.name

        if (shipping_address.phone) phone = shipping_address.phone
        else phone = "Not Provided!";

        const dateArr = created_at.split('T')[0].split('-');
        const date = `${dateArr[2]}/${dateArr[1]}/${dateArr[0]}`;
        const time = created_at.split('T')[1];

        line_items.forEach(item => {
            items.push({ order: item.title, quantity: item.quantity })
        });

        return {
            order_id,
            name,
            items,
            contact_email,
            phone,
            created_at: `${date} : ${time}`
        }

    } catch (err) {
        throw err;
    }

}