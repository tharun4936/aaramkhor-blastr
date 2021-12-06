import unirest from 'unirest';

const {SMS_API_AUTH_KEY,SMS_API_MESSAGE_ID, SMS_API_URL, SMS_API_SENDER_ID} = process.env;

export const sendSMSNotification = async function (order) {

    try {
        const result = await unirest.get(SMS_API_URL).headers({
            "cache-control": "no-cache"
        }).query({
            "authorization": SMS_API_AUTH_KEY,
            "sender_id": SMS_API_SENDER_ID,
            "message": SMS_API_MESSAGE_ID,
            "variables_values": `${order.order_id}|${order.service}|${order.consignment_no}|${order.service_url}|${order.feedback_email}|`,
            "route": "dlt",
            "numbers": `${order.customer_phone}`,
        })

        return result.body;
    } catch (err) {
        throw err;
    }

}

export const checkWalletBalance = async function () {
    try {
        const result = await unirest.post("https://www.fast2sms.com/dev/wallet").headers({
            "authorization": SMS_API_AUTH_KEY
        });

        if (result.body.return === true) {
            return result.body.wallet;
        }
    } catch (err) {
        throw err;
    }

}