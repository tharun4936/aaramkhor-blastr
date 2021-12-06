import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const {GMAIL_API_CLIENT_ID, GMAIL_API_USER, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN} = process.env;

const OAuth2_client = new google.auth.OAuth2(GMAIL_API_CLIENT_ID, GMAIL_CLIENT_SECRET);
OAuth2_client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN })


export const createTransporterObject = function () {
    try {
        const accessToken = OAuth2_client.getAccessToken();
        const transporter = nodemailer.createTransport({
            pool: true,
            maxMessages: Infinity,
            service: "gmail",
            auth: {
                type: 'OAuth2',
                user: GMAIL_API_USER,
                clientId: GMAIL_API_CLIENT_ID,
                clientSecret: GMAIL_CLIENT_SECRET,
                refreshToken: GMAIL_REFRESH_TOKEN,
                accessToken: accessToken,
            },
        })

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
        return result;

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
                                                                                                                Aaramkhor Delivery Information
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
                                                                                                                    Your order(Order No. ${order_id}) has been shipped via IndiaPost with tracking consignment number ${consignment_no}. You can track the same on <a href="https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx"
                                                                                                                    target="_blank">Track
                                                                                                                    Consignment
                                                                                                                    (indiapost.gov.in)</a>. In case of any issues with delivery, please mail with your order ID to <a target="_blank" href="https://mail.google.com/">shirtonomics@gmail.com</a>.
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
