import dotenv from 'dotenv'
import Shopify from 'shopify-api-node';
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { google } from 'googleapis'
import nodemailer from 'nodemailer';
import creds from './config/credentials.js'
import credsMail from './config/credentialsMail.js';

const OAuth2_client = new google.auth.OAuth2(credsMail.client_id, credsMail.client_secret);
OAuth2_client.setCredentials({ refresh_token: credsMail.refresh_token })

dotenv.config();

const { API_KEY, PASSWORD, HOST_NAME, VERSION, SPREADSHEET_ID, TRACKING_LINK } = process.env;
const shopify = new Shopify({
    shopName: HOST_NAME,
    apiKey: API_KEY,
    password: PASSWORD,
    apiVersion: VERSION
});

//dependencies: shopify object
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

// dependencies: TRACKING_LINK env variable
// export const convertFromRawOrdersData = function (orders) {
//     try {
//         const converted = [];
//         for (let i = 0; i < orders.items.length; i++) {
//             converted.push({
//                 order_id: orders.items[i].itemId,
//                 order: orders.items[i].order,
//                 order_quantity: orders.items[i].quantity,
//                 customer_name: orders.name,
//                 customer_phone: orders.phone,
//                 customer_email: orders.contact_email,
//                 created_at: orders.created_at,
//                 consignment_no: '',
//                 tracking_link: TRACKING_LINK
//             })
//         }
//         // console.log('convertedOrdersformRqawdata', converted)
//         return converted;
//     } catch (err) {
//         throw err;
//     }

// }


//dependencioes: convertFromRawORdersData function 
export const populateWorkspaceSheet = async function (doc, data) {
    try {
        await doc.loadInfo()
        const workspaceSheet = doc.sheetsByTitle['Logistics'];
        let items = "";
        let itemsQuant = "";
        for (let i = 0; i < data.items.length; i++) {
            items += data.items[i].order;
            items += ' ~ ';
            itemsQuant += String(data.items[i].quantity);
            itemsQuant += ' ~ '
        }
        items = items.slice(0, -2);
        itemsQuant = itemsQuant.slice(0, -2)
        await workspaceSheet.addRow({
            Order_Number: data.order_id,
            Order: items,
            Order_Quantity: itemsQuant,
            Customer_Name: data.name,
            Customer_Phone: String(data.phone),
            Customer_Email: data.contact_email,
            Tracking_Number: '',
            Created_At: data.created_at,
            Tracking_Link: TRACKING_LINK
        })

    } catch (err) {
        throw err;
    }
}


export const populateStatusSheet = async function (doc, spreadsheetData) {
    try {
        await doc.loadInfo();
        // console.log(spreadsheetData)
        const statusSheet = doc.sheetsByTitle['Notification Status'];
        for (let i = 0; i < spreadsheetData.length; i++) {
            // await doc.loadInfo();
            await statusSheet.addRow({
                S_No: spreadsheetData[i].s_no,
                Order_Number: String(spreadsheetData[i].order_id),
                Order: spreadsheetData[i].order,
                Order_Quantity: spreadsheetData[i].order_quantity,
                Customer_Name: spreadsheetData[i].customer_name,
                Customer_Phone: String(spreadsheetData[i].customer_phone),
                Customer_Email: spreadsheetData[i].customer_email,
                Tracking_Number: spreadsheetData[i].consignment_no,
                Created_At: spreadsheetData[i].created_at,
                Tracking_Link: spreadsheetData[i].tracking_link,
                Mail_Status: spreadsheetData[i].mail_status,
                Whatsapp_Status: spreadsheetData[i].whatsapp_status,
                SMS_Status: spreadsheetData[i].sms_status,
                Date_Modified: spreadsheetData[i].date_modified
            })
        }
    } catch (err) {
        throw err;
    }

}


export const getRawOrdersData = function (requestBody) {
    try {
        let contact_email;
        let phone;
        const items = [];

        const { line_items, shipping_address, created_at } = requestBody;
        const order_id = String(requestBody.id);

        if (requestBody.contact_email) contact_email = requestBody.contact_email;
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

// dependencies: google-spreadsheet package
export const googleSpreadsheetInit = async function () {
    try {
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo();
        return doc;
    } catch (err) {
        throw err;
    }
}

// dependencies: nodemailer module and client object
export const createTransporterObject = function () {
    try {
        const accessToken = OAuth2_client.getAccessToken();
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: 'OAuth2',
                user: credsMail.user,
                clientId: credsMail.client_id,
                clientSecret: credsMail.client_secret,
                refreshToken: credsMail.refresh_token,
                accessToken: accessToken,
            }
        })
        console.log("BUG")
        return transporter;
    } catch (err) {
        throw err;
    }

}

export const sendEmailNotification = async function (data, transporter) {

    try {
        const mailOptions = {
            from: `${data.senderName} <${data.sender}>`,
            to: data.receiver,
            subject: data.subject,
            html: data.templateMessage
        }
        const result = await transporter.sendMail(mailOptions)
        console.log(result);

    } catch (err) {
        throw err
    }

}

export function emailMarkup(name, order, order_id, consignment_no) {
    return `<!DOCTYPE html>
    <html>
    
    <head>
        <base target="_top">
    </head>
    
    <body>
        <!DOCTYPE html>
        <html>
    
        <head>
            <base target="_top">
        </head>
    
        <body>
            <div>
                <center>
                    <div>
                        <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#ffffff">
                            <tbody>
                                <tr>
                                    <td valign="top" bgcolor="#ffffff" width="100%">
                                        <table width="100%" role="content-container" align="center" cellpadding="0"
                                            cellspacing="0" border="0">
                                            <tbody>
                                                <tr>
                                                    <td width="100%">
                                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                            <tbody>
                                                                <tr>
                                                                    <td>
    
                                                                        <table width="100%" cellpadding="0" cellspacing="0"
                                                                            border="0" style="width:100%;max-width:600px"
                                                                            align="center">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td role="modules-container"
                                                                                        style="padding:20px 20px 20px 20px;color:#000000;text-align:left"
                                                                                        bgcolor="#f4f4f4" width="100%"
                                                                                        align="left">
                                                                                        <table role="module" border="0"
                                                                                            cellpadding="0" cellspacing="0"
                                                                                            width="100%"
                                                                                            style="display:none!important;opacity:0;color:transparent;height:0;width:0">
                                                                                            <tbody>
                                                                                                <tr>
                                                                                                    <td
                                                                                                        role="module-content">
                                                                                                        <p></p>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            </tbody>
                                                                                        </table>
                                                                                        <table role="module" border="0"
                                                                                            cellpadding="0" cellspacing="0"
                                                                                            width="100%"
                                                                                            style="table-layout:fixed">
                                                                                            <tbody>
                                                                                                <tr>
                                                                                                    <td style="padding:18px 0px 18px 0px;line-height:40px;text-align:inherit"
                                                                                                        height="100%"
                                                                                                        valign="top"
                                                                                                        bgcolor=""
                                                                                                        role="module-content">
                                                                                                        <div>
                                                                                                            <h1
                                                                                                                style="text-align:center">
                                                                                                                Aaramkhor
                                                                                                            </h1>
                                                                                                            <div></div>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            </tbody>
                                                                                        </table>
                                                                                        <table role="module" border="0"
                                                                                            cellpadding="0" cellspacing="0"
                                                                                            width="100%"
                                                                                            style="table-layout:fixed">
                                                                                            <tbody>
                                                                                                <tr>
                                                                                                    <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit"
                                                                                                        height="100%"
                                                                                                        valign="top"
                                                                                                        bgcolor=""
                                                                                                        role="module-content">
                                                                                                        <div>
                                                                                                            <div
                                                                                                                style="font-family:inherit;text-align:inherit">
                                                                                                                Hello
                                                                                                                ${name},
                                                                                                            </div>
                                                                                                            <div
                                                                                                                style="font-family:inherit;text-align:inherit">
                                                                                                                <br></div>
                                                                                                                <div
                                                                                                                    style="font-family:inherit;text-align:inherit">
                                                                                                                    Your Order (${order}) from Aaramkhor with Order number: ${order_id} has been dispatched . You can track your order by clicking on the below link using the consignment number: ${consignment_no} 
                                                                                                                </div>
                                                                                                                <div
                                                                                                                    style="font-family:inherit;text-align:inherit">
                                                                                                                    <br></div>
                                                                                                                    <div
                                                                                                                        style="font-family:inherit;text-align:inherit">
                                                                                                                        <a href="https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx"
                                                                                                                            target="_blank">Track
                                                                                                                            Consignment
                                                                                                                            (indiapost.gov.in)</a>
                                                                                                                    </div>
                                                                                                                    <div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            </tbody>
                                                                                        </table>
                                                                                        <table role="module" border="0"
                                                                                            cellpadding="0" cellspacing="0"
                                                                                            width="100%"
                                                                                            style="table-layout:fixed">
                                                                                            <tbody>
                                                                                                <tr>
                                                                                                    <td style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit"
                                                                                                        height="100%"
                                                                                                        valign="top"
                                                                                                        bgcolor=""
                                                                                                        role="module-content">
                                                                                                        <div>
                                                                                                            <div
                                                                                                                style="font-family:inherit;text-align:inherit">
                                                                                                                Regards,
                                                                                                            </div>
                                                                                                            <div
                                                                                                                style="font-family:inherit;text-align:inherit">
                                                                                                                Aaramkhor
                                                                                                                support team
                                                                                                            </div>
                                                                                                            <div></div>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
    
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </center>
                <img src="https://ci3.googleusercontent.com/proxy/qzQ_SOhWzugEUNt5nMxKKxC4FkUiY1Y9388AQvCap0TaWudIyXtaF4QU_jQZd1IcM65M6tgamj0o1QC3r9oPobGXPOztOYzUFTZ7UoU2XY_GEcsL_D8qmFsee8kGs8fUUdOG9JGg_vmPP1Ol3UShvPU3gzyRc8eLpPFZpmbtXhb5i_StcbyLHfmA7uqlNVIb6ELeYog89b0x0YeuIRY3Celo4Yucg2ZinkP6iccq33SSAnybOp-EhAr0uA0pV3jCPbQc0h7eyy3FF0TcCARu0fJm6LHi8RXy0UbaIanK6L18wcP_oPGCVq7VLDK1OiXsWlUOZUNM-w3XXKZnJWb5Yf6KDxUjrR6-L4QTtI7E8-8QaJv49tBok77MFwaW77PqDNVgkbMtCoNM4lxkssVBIyHw6Hmm9sEE6Kgp_urX89m6Y5a3g6jaieRlNazFNh6tAiKB-0EJABpC3aADwyeV0K_rbGpBBpggHOZdePyFV2qR2qOmWpcf-ybj1MyvZoq-tAlpMWbUK_GPkPE19d_6PGeWCH2kTHoTXgtASaLOEP45touBhNwaXwGW8HwbVeDoI9j-0f9a23IBqafEod_SofCvbM_msRt4G_Bnn2elPQ9IVsBRGyCbiZ8ZNrRpXPAJ4sQV8gFqAV_55rg=s0-d-e1-ft#https://u9509040.ct.sendgrid.net/wf/open?upn=SsIirGNFlCIodLVufjSm8IchuVIqUmxdB8-2Bf-2FdrMsTm6KK592Pkt4EEWpYQxR9cbG7DFEQkU03pH5CEoGNkG3aMXD6ixMv4gLYLNgKn-2B9avBK-2BHtjSLw0Le-2FkaQv0WY8eZRTnoNo24zLg6U8a1U08sKBdG2RjJFEBsoL1yRhUk21o6Qf3daeN05L58zRjwPx9rqgc-2BHlas13AzpR0SXP53MGQeNp6mw17sMv1Rrxy7xmE-2F70K4rLBWVqQyAdTYcU4d09wYNPKjvtfjqH4S7mVrzCLANvGYBW0lmlW93UqDqxhCY8zTUwrPvnGgCemdyCQtHQ2oPyggAxB3iO5wcWyIlZutB9JHsvwLljDZvkh0zd7M1JxHQ6mClM7CC7bQmBLXXmIFEKDiQTrYQVN2ZCZA-3D-3D" alt="" width="1" height="1" border="0" style="height:1px!important;width:1px!important;border-width:0!important;margin-top:0!important;margin-bottom:0!important;margin-right:0!important;margin-left:0!important;padding-top:0!important;padding-bottom:0!important;padding-right:0!important;padding-left:0!important" class="CToWUd">
        </div>
    
        </body>
    
        </html>
    
    </body>
    
    </html>`
}