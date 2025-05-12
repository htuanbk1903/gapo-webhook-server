const express = require("express");
const nodemailer = require("nodemailer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Khởi tạo transporter của nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "bidvgapochat@gmail.com",
    pass: "oist ncyn vnwy dopv", // 👉 Nên dùng biến môi trường thực tế
  },
});

app.get("/", (req, res) => {
  res.send("🚀 Gapo Webhook Server đang chạy!");
});

app.post("/webhook", async (req, res) => {
  const messageBody = req.body;
  console.log("📥 Nhận message từ Gapo:", messageBody);

  // Lấy các thông tin cơ bản từ message
  const messageText = (messageBody && messageBody.message && messageBody.message.text) ? messageBody.message.text : '';
  const email = (messageBody && messageBody.message && messageBody.message.user && messageBody.message.user.email) ? messageBody.message.user.email : '';
  const messageTimestamp = new Date().toLocaleString();

  // Lấy metadata từ message
  const metadata = (messageBody && messageBody.message && messageBody.message.metadata) || {};
  console.log("🧩 Metadata:", JSON.stringify(metadata, null, 2));

  // Xử lý ảnh từ metadata.media
  const mediaUrls = Array.isArray(metadata.media) ? metadata.media : [];
  const attachments = [];
  const imageInfo = [];

  mediaUrls.forEach((url, index) => {
    const filename = `image_${index + 1}.jpg`;
    attachments.push({
      filename: filename,
      path: url,
    });

    imageInfo.push({ filename, url });
  });

  // Ghi thông tin ảnh ra file
  if (imageInfo.length > 0) {
    fs.writeFileSync("image_info.json", JSON.stringify(imageInfo, null, 2), "utf-8");
    console.log("✅ Đã ghi thông tin ảnh vào file 'image_info.json'");
  }

  // Xử lý file đính kèm từ metadata.file_information
  const fileInfos = Array.isArray(metadata.file_information) ? metadata.file_information : [];
  fileInfos.forEach((file, index) => {
    if (file && file.cdn && file.name) {
      attachments.push({
        filename: file.name,
        path: file.cdn,
      });
      console.log(`📎 Đã thêm file đính kèm: ${file.name}`);
    }
  });

  // Nếu nội dung chứa "tạo yêu cầu hpsm:", gửi mail
  if (messageText.toLowerCase().includes("tạo yêu cầu hpsm:")) {
    const fileNames = attachments.map(a => a.filename).join(", ") || "Không có";
    const emailBody =
      `📝 Nội dung: ${messageText}\n` +
      `👤 Email người gửi: ${email}\n` +
      `🕒 Thời gian: ${messageTimestamp}\n` +
      `📎 File đính kèm: ${fileNames}`;

    try {
      await transporter.sendMail({
        from: '"BIDV Gapo Chat" <bidvgapochat@gmail.com>',
        to: "tuanhm3@bidv.com.vn",
        subject: "Tạo yêu cầu hỗ trợ từ Gapo",
        text: emailBody,
        attachments: attachments,
      });
      console.log("✅ Đã gửi mail thành công");
    } catch (err) {
      console.error("❌ Gửi mail lỗi:", err);
    }
  }

  // Nếu nội dung chứa "đóng yêu cầu hpsm:", gửi mail
  if (messageText.toLowerCase().includes("đóng yêu cầu hpsm:")) {
    const fileNames = attachments.map(a => a.filename).join(", ") || "Không có";
    const emailBody =
      `📝 Nội dung: ${messageText}\n` +
      `👤 Email người gửi: ${email}\n` +
      `🕒 Thời gian: ${messageTimestamp}\n` +
      `📎 File đính kèm: ${fileNames}`;

    try {
      await transporter.sendMail({
        from: '"BIDV Gapo Chat" <bidvgapochat@gmail.com>',
        to: "tuanhm3@bidv.com.vn",
        subject: "Ghi nhận yêu cầu hỗ trợ từ Gapo (đã được xử lý)",
        text: emailBody,
        attachments: attachments,
      });
      console.log("✅ Đã gửi mail thành công");
    } catch (err) {
      console.error("❌ Gửi mail lỗi:", err);
    }
  }
  res.status(200).json({ status: "xử lý xong" });
});

app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại cổng ${PORT}`);
});
