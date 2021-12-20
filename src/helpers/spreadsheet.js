import { GoogleSpreadsheet } from 'google-spreadsheet'
import dotenv from 'dotenv';


dotenv.config();

const {GOOGLE_SERVICE_ACCOUNT_EMAIL,GOOGLE_PRIVATE_KEY,SPREADSHEET_ID, TRACKING_LINK} = process.env;

export const googleSpreadsheetInit = async function () {
    try {
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
        await doc.useServiceAccountAuth({
            client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        });
        await doc.loadInfo();
        return doc;
    } catch (err) {
        throw err;
    }
}

const loadSheetData = async function(sheetName){
    try{
        const doc = await googleSpreadsheetInit();
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle[sheetName];
        if(!sheet) throw new Error('Specified sheet not found!');
        return await sheet.getRows();
    } catch(err){
        throw {error:err.message, dataFound:false, status:500}
    }
}

export const getDataFromSheetByOrderId = async function (sheetName, order_id , receiverPhone, rowData = 'all') {
    try {

        const rows = await loadSheetData(sheetName);
        let data = rows.map(rowObj => {
                return {
                    order_id: rowObj.Order_Number,
                    order: rowObj.Order.split(' ~ ').map(orderq => orderq.trim()),
                    order_quantity: rowObj.Order_Quantity.split(' ~ ').map(orderq => orderq.trim()),
                    customer_name: rowObj.Customer_Name,
                    customer_phone: rowObj.Customer_Phone,
                    customer_email: rowObj.Customer_Email,
                    consignment_no: rowObj.Tracking_Number,
                    created_at: rowObj.Created_At,
                    tracking_link: rowObj.Tracking_Link
                }
        }).find(rowObj => rowObj.order_id === order_id)
        if(!data){
            throw {error: 'Data not found!', dataFound: false, status:404}
        }
        if(data.customer_phone !== receiverPhone.slice(-10)){
            throw {error: 'Not authorized!', authorized:false, dataFound:false, status:401}
        }
        if (rowData !== 'all'){
            const obj = {};
            rowData.split(',').map(neededData => neededData.trim()).forEach(neededData => {
                obj[neededData] = data[neededData];
            })
            data = obj;
        }
        return {data, authorized: true, dataFound:true, status:200};
    } catch (err) {
        // console.log(err)
        return err;
    }
}

export const getDataFromSheetByPhone = async function(sheetName, phone, receiverPhone, rowData='all'){
    try{
        if(receiverPhone.slice(-10) !== phone){
            throw {error:'Not authorized!', authorized: false, dataFound:false, status:401}
        }
        const rows = await loadSheetData(sheetName);
        let data = rows.map(rowObj => {
                return {
                order_id: rowObj.Order_Number,
                order: rowObj.Order.split(' ~ ').map(orderq => orderq.trim()),
                order_quantity: rowObj.Order_Quantity.split(' ~ ').map(orderq => orderq.trim()),
                customer_name: rowObj.Customer_Name,
                customer_phone: rowObj.Customer_Phone,
                customer_email: rowObj.Customer_Email,
                consignment_no: rowObj.Tracking_Number,
                created_at: rowObj.Created_At,
                tracking_link: rowObj.Tracking_Link
            }
        }).filter(rowObj => rowObj.customer_phone === phone);
        if(!data || data.length === 0){
            throw {error:'Data not found!', dataFound:false, status:404};
        }
        if(rowData !== 'all') {
            rowData = rowData.split(',').map(neededData => neededData.trim());
            // console.log(rowData);
            data = data.map(rowObj => {
                    const obj = {};
                    rowData.forEach(neededData => {
                        obj[neededData] = rowObj[neededData];
                    })
                    return obj; 
                });
        }
        return {data, authorized: true, dataFound:true, status:200};
    
    } catch(err) {
        // console.log(err);
        return err;

    }
}

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


export const populateEmailStatusSheet = async function (doc, spreadsheetData) {
    try {
        await doc.loadInfo();
        // console.log(spreadsheetData)
        const statusSheet = doc.sheetsByTitle['Email Status'];
        for (let i = 0; i < spreadsheetData.length; i++) {
            // await doc.loadInfo();
            await statusSheet.addRow({
                Order_Number: String(spreadsheetData[i].order_id),
                Mail_Status: spreadsheetData[i].mail_status
            })
        }
    } catch (err) {
        throw err;
    }
}

export const populateSMSStatusSheet = async function (doc, spreadsheetData) {
    try {
        await doc.loadInfo();
        // console.log(spreadsheetData)
        const statusSheet = doc.sheetsByTitle['SMS Status'];
        for (let i = 0; i < spreadsheetData.length; i++) {
            // await doc.loadInfo();
            await statusSheet.addRow({
                Order_Number: String(spreadsheetData[i].order_id),
                SMS_Status: spreadsheetData[i].sms_status
            })
        }
    } catch (err) {
        throw err;
    }
}

export const populateWhatsappStatusSheet = async function (doc, spreadsheetData) {
    try {
        await doc.loadInfo();
        // console.log(spreadsheetData)
        const statusSheet = doc.sheetsByTitle['Whatsapp Status'];
        // console.log(statusSheet)
        for (let i = 0; i < spreadsheetData.length; i++) {
            // await doc.loadInfo();
            await statusSheet.addRow({
                Order_Number: String(spreadsheetData[i].order_id),
                Whatsapp_Status: spreadsheetData[i].whatsapp_status
            })
        }
    } catch (err) {
        throw err;
    }
}

export const isNotificationSent = async function(sheetName, order_id){
    try{

        let status_column;
        const rows = await loadSheetData(sheetName);
        if(sheetName === 'Email Status') status_column = 'Mail_Status';
        else if(sheetName === 'SMS Status') status_column = 'SMS_Status';
        else if(sheetName === 'Whatsapp Status') status_column = 'Whatsapp_Status';
        const data = rows.map(rowObj => {
            return {
                order_id:rowObj.Order_Number,
                status: rowObj[status_column]
            }
        })
        const foundData = data.find(order => order.order_id === order_id)
        // console.log(data);
        // console.log(foundData);
        if(foundData){ 
            if(foundData[status_column] === 'Not Sent'){
                return false;
            }
            else if(foundData[status_column] === 'Sent') {
                return true;
            }
        }
        else{
            return false;
        }
    } catch(err){
        // console.log(err);
        throw err;
    }

}
