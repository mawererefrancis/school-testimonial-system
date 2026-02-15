import express from "express";
import multer from "multer";
import XLSX from "xlsx";
import PDFDocument from "pdfkit";
import archiver from "archiver";
import QRCode from "qrcode";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import probe from "probe-image-size";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/generated", express.static("generated"));

if (!fs.existsSync("generated")) fs.mkdirSync("generated");
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const upload = multer({ dest: "uploads/" });

// ================== ADMIN LOGIN ==================
const ADMIN_USERNAME = "admin";
const HASHED_PASSWORD = bcrypt.hashSync("admin123", 10);

// ================== SETTINGS ==================
let SETTINGS = {
  schoolName: "RUBONGI ARMY SECONDARY SCHOOL",
  address: "P.O.BOX 698 TORORO, TEL:0454445148/0782651148",
  vision: "To produce a morally upright and self reliant future generation.",
  mission: "To provide affordable quality education to our community.",
  footer: "Victory Is Our Challenge",
  headTeacher: "ZAINA .K. NALUKENGE",
  headTeacherRank: "Maj.",
  headTeacherTitle: "HEAD TEACHER"
};

let LOGO1 = null;
let LOGO2 = null;
let DATABASE = {};
let serialCounter = 1;

// ================== SUBJECT MAPPING (UPDATED) ==================
const SUBJECT_MAP = {
  ENG: "ENGLISH",
  HIS: "HISTORY & POL. EDUC.",    // Updated
  GEO: "GEOGRAPHY",
  MAT: "MATHEMATICS",
  PHY: "PHYSICS",
  CHE: "CHEMISTRY",
  BIO: "BIOLOGY",
  IPS: "IPS",
  CRE: "CRE",
  COM: "COMMERCE",
  IRE: "IRE",
  AGR: "AGRICULTURE",
  ICT: "ICT",
  DHP: "DHOPADHOLA",
  LIT: "LITERATURE IN ENGLISH",
  ENT: "ENTREPRENEURSHIP EDUCATION",
  KIS: "KISWAHILI",
  LAN: "LANGO",
  PE:  "PHYSICAL EDUCATION",
  PA:  "PERFORMING ARTS",
  FRE: "FRENCH",
};

const SUBJECT_ORDER = [
  "ENGLISH",
  "HISTORY & POL. EDUC.",         // Updated
  "GEOGRAPHY",
  "MATHEMATICS",
  "PHYSICS",
  "CHEMISTRY",
  "BIOLOGY",
  "IPS",
  "CRE",
  "COMMERCE",
  "IRE",
  "AGRICULTURE",
  "ICT",
  "DHOPADHOLA",
  "LITERATURE IN ENGLISH",
  "ENTREPRENEURSHIP EDUCATION",
  "KISWAHILI",
  "LANGO",
  "PHYSICAL EDUCATION",
  "PERFORMING ARTS",
  "FRENCH",
];

// ================== LOGIN PAGE ==================
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>School Testimonial System</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'Segoe UI', Roboto, system-ui, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .card {
        background: white;
        border-radius: 20px;
        padding: 40px;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: fadeIn 0.6s ease-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      h2 {
        color: #333;
        margin-bottom: 30px;
        font-weight: 600;
        text-align: center;
        font-size: 28px;
      }
      input {
        width: 100%;
        padding: 15px;
        margin: 10px 0;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        font-size: 16px;
        transition: 0.3s;
      }
      input:focus {
        border-color: #667eea;
        outline: none;
        box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
      }
      button {
        width: 100%;
        padding: 15px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: 0.3s;
        margin-top: 20px;
      }
      button:hover {
        background: #5a67d8;
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>🔐 Admin Login</h2>
      <form method="POST" action="/dashboard">
        <input name="username" placeholder="Username" required autofocus>
        <input name="password" type="password" placeholder="Password" required>
        <button>Login</button>
      </form>
    </div>
  </body>
  </html>
  `);
});

app.post("/dashboard", async (req, res) => {
  if (req.body.username !== ADMIN_USERNAME) return res.send("Invalid login");
  const valid = await bcrypt.compare(req.body.password, HASHED_PASSWORD);
  if (!valid) return res.send("Invalid login");
  res.send(DASHBOARD_HTML());
});

function DASHBOARD_HTML() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Dashboard | Testimonial Generator</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'Segoe UI', Roboto, system-ui, sans-serif;
        background: #f7fafc;
        padding: 30px 20px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
      .container {
        max-width: 900px;
        margin: 0 auto;
        flex: 1;
      }
      h1 {
        color: #2d3748;
        font-weight: 700;
        margin-bottom: 30px;
        font-size: 2rem;
        border-left: 8px solid #667eea;
        padding-left: 20px;
      }
      .box {
        background: white;
        border-radius: 16px;
        padding: 30px;
        margin-bottom: 30px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        border: 1px solid #edf2f7;
      }
      h3 {
        color: #4a5568;
        margin-bottom: 20px;
        font-size: 1.4rem;
        font-weight: 600;
      }
      input, textarea, button, input[type="file"] {
        width: 100%;
        padding: 12px 16px;
        margin: 8px 0;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        font-size: 1rem;
        transition: 0.2s;
        font-family: inherit;
      }
      input:focus, textarea:focus {
        border-color: #667eea;
        outline: none;
        box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
      }
      textarea {
        min-height: 80px;
        resize: vertical;
      }
      button {
        background: #667eea;
        color: white;
        font-weight: 600;
        border: none;
        cursor: pointer;
        margin-top: 15px;
      }
      button:hover {
        background: #5a67d8;
        transform: translateY(-1px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.05);
      }
      .logout {
        text-align: right;
        margin-bottom: 20px;
      }
      .logout a {
        color: #e53e3e;
        text-decoration: none;
        font-weight: 500;
      }
      .footer {
        text-align: center;
        margin-top: 40px;
        padding: 20px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        border: 1px solid #edf2f7;
        color: #4a5568;
        font-size: 0.95rem;
      }
      .footer p {
        margin: 5px 0;
      }
      hr {
        border: none;
        border-top: 2px dashed #e2e8f0;
        margin: 30px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logout">
        <a href="/">← Logout</a>
      </div>
      <h1>📋 Testimonial Generator Dashboard</h1>

      <div class="box">
        <h3>🖼️ Upload Logos</h3>
        <form action="/upload-assets" method="POST" enctype="multipart/form-data">
          <input type="file" name="logo1" accept="image/*" required>
          <input type="file" name="logo2" accept="image/*" required>
          <button>Upload Logos</button>
        </form>
      </div>

      <div class="box">
        <h3>⚙️ School Settings</h3>
        <form method="POST" action="/settings">
          <input name="schoolName" placeholder="School Name" value="${SETTINGS.schoolName}">
          <input name="address" placeholder="Address & Phone" value="${SETTINGS.address}">
          <textarea name="vision" placeholder="Vision">${SETTINGS.vision}</textarea>
          <textarea name="mission" placeholder="Mission">${SETTINGS.mission}</textarea>
          <input name="footer" placeholder="Footer Motto" value="${SETTINGS.footer}">
          <input name="headTeacher" placeholder="Head Teacher Name" value="${SETTINGS.headTeacher}">
          <input name="headTeacherRank" placeholder="Head Teacher Rank" value="${SETTINGS.headTeacherRank}">
          <input name="headTeacherTitle" placeholder="Head Teacher Title" value="${SETTINGS.headTeacherTitle}">
          <button>Save Settings</button>
        </form>
      </div>

      <div class="box">
        <h3>📊 Generate Testimonials</h3>
        <form action="/generate" method="POST" enctype="multipart/form-data">
          <input type="file" name="excel" accept=".xlsx, .xls, .csv" required>
          <button>Generate ZIP with PDFs</button>
        </form>
      </div>

      <div class="footer">
        <p><strong>Mawerere Francis</strong></p>
        <p>📞 Tel: 0788223215 | ✉️ Email: mawererefrancis@gmail.com</p>
        <p>💬 WhatsApp: +256788223215</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

// ================== ASSETS ==================
app.post("/upload-assets", upload.fields([
  { name: "logo1" }, { name: "logo2" }
]), (req, res) => {
  LOGO1 = req.files.logo1[0].path;
  LOGO2 = req.files.logo2[0].path;
  res.send("✅ Logos uploaded. <a href='/dashboard'>Back</a>");
});

// ================== SETTINGS ==================
app.post("/settings", (req, res) => {
  SETTINGS = { ...SETTINGS, ...req.body };
  res.send("✅ Settings updated. <a href='/dashboard'>Back</a>");
});

// ================== GENERATE TESTIMONIALS ==================
app.post("/generate", upload.single("excel"), async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const students = XLSX.utils.sheet_to_json(sheet);

    const zipPath = "generated/testimonials.zip";
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip");
    archive.pipe(output);

    serialCounter = 1;

    const BATCH_SIZE = 20;
    const batches = [];
    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      batches.push(students.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      await Promise.all(batch.map(async (s) => {
        const name = s["Candidate_Name"] || s["Candidate Name"] || "";
        const indexNo = s["IndexNo"] || s["INDEX NO"] || "";
        const result = s["Result"] || "";
        const project = s["PROJECT WORK"] || "";
        const achievements = s["SUBJECT ACHIEVEMENTS"] || "";
        const sex = s["Sex"] || "";
        const dob = s["DATE OF BIRTH"] || "";
        
        const gender = sex === "M" ? "MALE" : sex === "F" ? "FEMALE" : sex;
        const genderCode = sex === "M" ? "M" : sex === "F" ? "F" : "X";
        const serialNumber = `UNEB/RASS/${genderCode}/${String(serialCounter).padStart(3, '0')}/2025`;
        serialCounter++;

        // Parse grades (now accepts A-E)
        const gradeMap = {};
        if (achievements) {
          const parts = achievements.split(" ");
          for (const part of parts) {
            const match = part.match(/^([A-Z]+)-([A-E])$/);  // Updated to A-E
            if (match) {
              const code = match[1];
              const grade = match[2];
              const fullName = SUBJECT_MAP[code];
              if (fullName) gradeMap[fullName] = grade;
            }
          }
        }

        const subjectsPresent = Object.keys(gradeMap);
        const orderedSubjects = SUBJECT_ORDER.filter(subj => subjectsPresent.includes(subj));

        const id = uuidv4();
        DATABASE[id] = { name, indexNo, result, project, sex: gender, dob, year: "2025", serialNumber };
        
        const qrData = JSON.stringify({ name, indexNo, sex: gender, dob, year: "2025", serialNumber, result, project });
        const qrImage = await QRCode.toDataURL(qrData);

        const safeName = name.replace(/[^a-z0-9]/gi, "_").substring(0, 50);
        const filePath = `generated/${safeName}.pdf`;

        const doc = new PDFDocument({ size: "A4", margin: 40 });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // ---------- TRIPLE BORDER ----------
        const borderMargin = 10;
        const borderWidth = doc.page.width - 2 * borderMargin;
        const borderHeight = doc.page.height - 2 * borderMargin;
        const cornerRadius = 20;
        doc.roundedRect(borderMargin, borderMargin, borderWidth, borderHeight, cornerRadius)
           .lineWidth(3).strokeColor("#FF0000").stroke();
        doc.roundedRect(borderMargin + 3, borderMargin + 3, borderWidth - 6, borderHeight - 6, cornerRadius)
           .lineWidth(3).strokeColor("#000000").stroke();
        doc.roundedRect(borderMargin + 6, borderMargin + 6, borderWidth - 12, borderHeight - 12, cornerRadius)
           .lineWidth(3).strokeColor("#FFFF00").stroke();

        // ---------- SERIAL NUMBER (top left, red) ----------
        doc.fontSize(8).fillColor("#FF0000").text(serialNumber, 45, 45, { align: "left" });

        // ---------- LOGOS (fixed height 70px, bottom-aligned with title) ----------
        const titleY = 170;
        const logoHeight = 70;

        if (LOGO1 && fs.existsSync(LOGO1)) {
          doc.image(LOGO1, 45, titleY - logoHeight, { height: logoHeight });
        }
        if (LOGO2 && fs.existsSync(LOGO2)) {
          doc.image(LOGO2, doc.page.width - 115, titleY - logoHeight, { height: logoHeight });
        }

        // School header
        doc.fontSize(16).fillColor("#003366").text(SETTINGS.schoolName, 0, 90, { align: "center" });
        doc.fontSize(9).fillColor("#2d3748").text(SETTINGS.address, { align: "center" });
        doc.fontSize(9).fillColor("#4a5568").text(`VISION: ${SETTINGS.vision}`, { align: "center" });
        doc.fontSize(9).text(`MISSION: ${SETTINGS.mission}`, { align: "center" });

        // Title
        doc.fontSize(14).fillColor("#003366").text("UCE TESTIMONIAL 2025.", 0, titleY, { align: "center", underline: true });

        // ---------- CANDIDATE DETAILS BOX (dynamic height for long names) ----------
        const boxLeft = 45;
        const boxWidth = 520;
        const boxPadding = 10;
        
        // Calculate if name needs two lines
        const nameLength = name.length;
        const boxHeight = nameLength > 35 ? 120 : 100; // Taller box for long names
        
        const boxTop = 210;

        doc.roundedRect(boxLeft, boxTop, boxWidth, boxHeight, 5).lineWidth(1).strokeColor("#CCCCCC").stroke();

        doc.fontSize(11).fillColor("black");
        
        // Handle long names that might overflow
        if (nameLength > 35) {
          // Split name into two lines
          const nameParts = name.split(' ');
          const midPoint = Math.ceil(nameParts.length / 2);
          const line1 = nameParts.slice(0, midPoint).join(' ');
          const line2 = nameParts.slice(midPoint).join(' ');
          
          doc.text(`CANDIDATE'S NAME: ${line1}`, boxLeft + boxPadding, boxTop + boxPadding);
          doc.text(`${line2}`, boxLeft + boxPadding + 120, boxTop + boxPadding + 18);
          doc.text(`INDEX NO: ${indexNo}`, boxLeft + 300, boxTop + boxPadding);
          
          doc.text(`SEX: ${gender}`, boxLeft + boxPadding, boxTop + boxPadding + 40);
          doc.text(`DoB: ${dob}`, boxLeft + 200, boxTop + boxPadding + 40);
          doc.text("LIN............................................", boxLeft + boxPadding, boxTop + boxPadding + 60);
        } else {
          doc.text(`CANDIDATE'S NAME: ${name}`, boxLeft + boxPadding, boxTop + boxPadding);
          doc.text(`INDEX NO: ${indexNo}`, boxLeft + 300, boxTop + boxPadding);
          
          doc.text(`SEX: ${gender}`, boxLeft + boxPadding, boxTop + boxPadding + 20);
          doc.text(`DoB: ${dob}`, boxLeft + 200, boxTop + boxPadding + 20);
          doc.text("LIN............................................", boxLeft + boxPadding, boxTop + boxPadding + 40);
        }

        // ---------- TABLE ----------
        const tableTop = boxTop + boxHeight + 20; // Adjust based on box height
        const col1 = 50, col2 = 120, col3 = 320, col4 = 550;
        const rowHeight = 22;
        const rowCount = orderedSubjects.length + 1;

        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("S/NO", col1 + 5, tableTop + 5);
        doc.text("SUBJECT", col2 + 5, tableTop + 5);
        doc.text("Subject Achievement", col3 + 5, tableTop + 5);
        doc.font("Helvetica");

        let y = tableTop + rowHeight;
        let sno = 1;
        for (const subject of orderedSubjects) {
          const grade = gradeMap[subject] || "";
          doc.text(`${sno}.`, col1 + 5, y + 5);
          doc.text(subject, col2 + 5, y + 5);
          doc.text(grade, col3 + 5, y + 5);
          y += rowHeight;
          sno++;
        }

        doc.lineWidth(1).strokeColor("#000");
        doc.moveTo(col1, tableTop).lineTo(col1, tableTop + rowCount * rowHeight).stroke();
        doc.moveTo(col2, tableTop).lineTo(col2, tableTop + rowCount * rowHeight).stroke();
        doc.moveTo(col3, tableTop).lineTo(col3, tableTop + rowCount * rowHeight).stroke();
        doc.moveTo(col4, tableTop).lineTo(col4, tableTop + rowCount * rowHeight).stroke();
        for (let i = 0; i <= rowCount; i++) {
          const lineY = tableTop + i * rowHeight;
          doc.moveTo(col1, lineY).lineTo(col4, lineY).stroke();
        }

        // ---------- RESULT & PROJECT ----------
        const afterTableY = tableTop + rowCount * rowHeight + 20;
        doc.fontSize(11).font("Helvetica-Bold");
        doc.text(`RESULT: ${result}`, 50, afterTableY);
        doc.text(`PROJECT: ${project}`, 300, afterTableY);

        // ---------- MOTTO ----------
        const mottoY = afterTableY + 35;
        doc.fontSize(10).font("Helvetica").text(SETTINGS.footer, 50, mottoY, { align: "center" });

        // ---------- SIGNATURE BLOCK (with dotted line) ----------
        const sigY = mottoY + 60;
        const sigX = 350;
        doc.fontSize(12).fillColor("black");
        doc.text("....................................", sigX, sigY - 10, { align: "left" });
        doc.text(SETTINGS.headTeacher, sigX, sigY, { align: "left" });
        doc.text(SETTINGS.headTeacherRank, sigX, sigY + 18, { align: "left" });
        doc.text(SETTINGS.headTeacherTitle, sigX, sigY + 36, { align: "left" });

        // ---------- QR CODE ----------
        const qrY = sigY + 70;
        doc.image(qrImage, 45, qrY, { width: 70 });

        doc.end();

        await new Promise(resolve => writeStream.on("finish", resolve));
        archive.file(filePath, { name: `${safeName}.pdf` });
      }));
    }

    await archive.finalize();
    output.on("close", () => res.download(zipPath, "testimonials.zip"));
  } catch (error) {
    console.error(error);
    res.status(500).send("Error: " + error.message);
  }
});

// ================== VERIFICATION ==================
app.get("/verify/:id", (req, res) => {
  const s = DATABASE[req.params.id];
  if (!s) return res.send("<h2>Invalid Certificate</h2>");
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Certificate Verification</title>
    <style>
      body{font-family:Arial;background:#f4f6f9;padding:40px;}
      .card{background:white;padding:30px;border-radius:10px;max-width:600px;margin:auto;box-shadow:0 5px 20px rgba(0,0,0,0.1);}
      h2{color:#003366;}
      .valid{color:green;font-weight:bold;font-size:24px;}
      .info-grid{display:grid;grid-template-columns:1fr 2fr;gap:10px;margin:20px 0;}
      .label{font-weight:bold;color:#555;}
    </style>
  </head>
  <body>
    <div class="card">
      <h2>✅ Certificate Verification</h2>
      <div class="info-grid">
        <div class="label">Serial Number:</div><div>${s.serialNumber || 'N/A'}</div>
        <div class="label">Candidate's Name:</div><div>${s.name}</div>
        <div class="label">Index Number:</div><div>${s.indexNo}</div>
        <div class="label">Sex:</div><div>${s.sex || 'N/A'}</div>
        <div class="label">Date of Birth:</div><div>${s.dob || 'N/A'}</div>
        <div class="label">Year:</div><div>${s.year || '2025'}</div>
        <div class="label">Result:</div><div>${s.result}</div>
        <div class="label">Project:</div><div>${s.project}</div>
      </div>
      <h3 class="valid">STATUS: VALID</h3>
    </div>
  </body>
  </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
