const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


async function generateExcelStream(salesData) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Define headers
    worksheet.columns = [
        { header: 'Sl No', key: 'slNo', width: 10 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Order ID', key: 'orderId', width: 25 },
        { header: 'Coupon Discount', key: 'discount', width: 15 },
        { header: 'Total Amount', key: 'totalAmount', width: 15 },
        { header: 'Biller Name', key: 'billerName', width: 25 },
    ];

    // Add rows
    salesData.forEach((order, index) => {
        worksheet.addRow({
            slNo: index + 1,
            date: new Date(order.orderDate).toLocaleDateString(),
            orderId: order._id,
            discount: order.discount || 0,
            totalAmount: order.totalAmount,
            billerName: `${order.address?.firstName || 'Unknown'} ${order.address?.lastName || ''}`,
        });
    });

    // Generate and return stream
    const stream = workbook.xlsx.createWriteStream();
    return stream;
}



function generatePDFStream(salesData) {
    const doc = new PDFDocument();

    // Add Title
    doc.fontSize(20).text('Sales Report', { align: 'center' });
    doc.moveDown();

    // Add Table Headers
    doc.fontSize(12).text('Sl No', 50, doc.y);
    doc.text('Date', 100, doc.y);
    doc.text('Order ID', 150, doc.y);
    doc.text('Coupon Discount', 300, doc.y);
    doc.text('Total Amount', 400, doc.y);
    doc.text('Biller Name', 500, doc.y);
    doc.moveDown();

    // Add Data Rows
    salesData.forEach((order, index) => {
        doc.text(index + 1, 50, doc.y);
        doc.text(new Date(order.orderDate).toLocaleDateString(), 100, doc.y);
        doc.text(order._id, 150, doc.y);
        doc.text(order.discount || 0, 300, doc.y);
        doc.text(order.totalAmount, 400, doc.y);
        doc.text(`${order.address?.firstName || 'Unknown'} ${order.address?.lastName || ''}`, 500, doc.y);
        doc.moveDown();
    });

    // Return stream
    return doc;
}






module.exports = { generateExcelStream,generatePDFStream };


