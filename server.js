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

// ================== SUBJECT MAPPING ==================
const SUBJECT_MAP = {
  ENG: "ENGLISH",
  HIS: "HISTORY & POL. EDUC.",
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
  "HISTORY & POL. EDUC.",
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

// ================== LOGIN PAGE (IMPROVED) ==================
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduTestify · Login</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      body {
        min-height: 100vh;
        background: linear-gradient(145deg, #0f2b3d 0%, #1b4a6b 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
      }
      .login-container {
        width: 100%;
        max-width: 440px;
      }
      .brand {
        text-align: center;
        margin-bottom: 2rem;
      }
      .brand h1 {
        font-size: 2.5rem;
        font-weight: 700;
        color: white;
        letter-spacing: -0.5px;
        text-shadow: 0 4px 10px rgba(0,0,0,0.2);
      }
      .brand p {
        color: rgba(255,255,255,0.8);
        font-size: 1rem;
        margin-top: 0.5rem;
      }
      .card {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 32px;
        padding: 2.5rem 2rem;
        box-shadow: 0 30px 50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.2);
        transition: transform 0.3s ease;
      }
      .card:hover {
        transform: translateY(-5px);
      }
      h2 {
        color: #0b2a41;
        font-size: 1.8rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
      }
      .sub {
        color: #4a5568;
        font-size: 0.9rem;
        margin-bottom: 2rem;
        border-left: 4px solid #2b6c9e;
        padding-left: 1rem;
      }
      .input-group {
        margin-bottom: 1.5rem;
        position: relative;
      }
      .input-group i {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #2b6c9e;
        font-size: 1.2rem;
      }
      input {
        width: 100%;
        padding: 1rem 1rem 1rem 3rem;
        border: 2px solid #e2e8f0;
        border-radius: 60px;
        font-size: 1rem;
        transition: all 0.2s;
        background: white;
      }
      input:focus {
        border-color: #2b6c9e;
        outline: none;
        box-shadow: 0 0 0 4px rgba(43,108,158,0.2);
      }
      button {
        width: 100%;
        padding: 1rem;
        background: linear-gradient(135deg, #1e4b6e, #12344d);
        color: white;
        border: none;
        border-radius: 60px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
      }
      button:hover {
        background: linear-gradient(135deg, #235f88, #17415f);
        transform: scale(1.02);
      }
      .developer {
        margin-top: 2.5rem;
        text-align: center;
        color: rgba(255,255,255,0.9);
        font-size: 0.95rem;
        border-top: 1px solid rgba(255,255,255,0.2);
        padding-top: 1.5rem;
      }
      .developer i {
        margin: 0 4px;
        color: #ffd966;
      }
      .developer a {
        color: white;
        text-decoration: none;
        font-weight: 500;
        border-bottom: 1px dotted rgba(255,255,255,0.4);
      }
      .developer a:hover {
        border-bottom-color: white;
      }
    </style>
  </head>
  <body>
    <div class="login-container">
      <div class="brand">
        <h1>📘 EduTestify</h1>
        <p>School Testimonial Generator</p>
      </div>
      <div class="card">
        <h2>Welcome back</h2>
        <div class="sub">Sign in to your account</div>
        <form method="POST" action="/dashboard">
          <div class="input-group">
            <i class="fas fa-user"></i>
            <input type="text" name="username" placeholder="Username" required autofocus>
          </div>
          <div class="input-group">
            <i class="fas fa-lock"></i>
            <input type="password" name="password" placeholder="Password" required>
          </div>
          <button type="submit">
            <i class="fas fa-arrow-right-to-bracket"></i> Login
          </button>
        </form>
      </div>
      <div class="developer">
        <i class="fas fa-code"></i> Developed by <strong>Mawerere Francis</strong><br>
        📞 <a href="tel:+256788223215">0788223215</a> · 
        ✉️ <a href="mailto:mawererefrancis@gmail.com">mawererefrancis@gmail.com</a><br>
        <i class="fab fa-whatsapp"></i> WhatsApp <a href="https://wa.me/256788223215">+256788223215</a>
      </div>
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

// ================== DASHBOARD (IMPROVED) ==================
function DASHBOARD_HTML() {
  // Status indicators for logos
  const logo1Status = LOGO1 ? '✅ Uploaded' : '❌ Not uploaded';
  const logo2Status = LOGO2 ? '✅ Uploaded' : '❌ Not uploaded';
  
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduTestify · Dashboard</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      body {
        background: #f0f5fa;
        padding: 2rem;
        min-height: 100vh;
      }
      .container {
        max-width: 1100px;
        margin: 0 auto;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2.5rem;
      }
      .header h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #0b2a41;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .header h1 i {
        color: #2b6c9e;
        background: white;
        padding: 0.5rem;
        border-radius: 16px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
      }
      .logout-btn {
        background: white;
        padding: 0.7rem 1.5rem;
        border-radius: 40px;
        color: #b22234;
        text-decoration: none;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        transition: all 0.2s;
        border: 1px solid rgba(0,0,0,0.05);
      }
      .logout-btn i {
        margin-right: 0.5rem;
      }
      .logout-btn:hover {
        background: #b22234;
        color: white;
        border-color: #b22234;
      }
      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
        gap: 1.8rem;
      }
      .card {
        background: white;
        border-radius: 28px;
        padding: 1.8rem;
        box-shadow: 0 15px 35px rgba(0, 20, 40, 0.08);
        border: 1px solid rgba(255,255,255,0.6);
        backdrop-filter: blur(4px);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .card:hover {
        transform: translateY(-4px);
        box-shadow: 0 25px 45px rgba(0, 20, 40, 0.12);
      }
      .card-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .card-header i {
        font-size: 2rem;
        color: #2b6c9e;
        background: #e6f0f9;
        padding: 0.8rem;
        border-radius: 18px;
      }
      .card-header h3 {
        font-size: 1.3rem;
        font-weight: 600;
        color: #163a57;
      }
      .status-badge {
        background: #edf4fc;
        padding: 0.25rem 1rem;
        border-radius: 40px;
        font-size: 0.85rem;
        color: #1e4b6e;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
      }
      .divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, #cbd5e0, transparent);
        margin: 1.5rem 0;
      }
      .form-group {
        margin-bottom: 1.2rem;
      }
      label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #4a5568;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: block;
        margin-bottom: 0.3rem;
      }
      input, textarea, input[type="file"] {
        width: 100%;
        padding: 0.8rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 16px;
        font-size: 0.95rem;
        transition: 0.2s;
        background: #fafdff;
      }
      input:focus, textarea:focus {
        border-color: #2b6c9e;
        outline: none;
        box-shadow: 0 0 0 3px rgba(43,108,158,0.15);
        background: white;
      }
      textarea {
        min-height: 70px;
        resize: vertical;
      }
      .btn {
        background: #1e4b6e;
        color: white;
        border: none;
        padding: 0.9rem 1.8rem;
        border-radius: 50px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 0.7rem;
        box-shadow: 0 8px 20px rgba(0, 50, 90, 0.15);
        width: 100%;
        justify-content: center;
      }
      .btn:hover {
        background: #235f88;
        transform: scale(1.02);
      }
      .btn-secondary {
        background: white;
        color: #1e4b6e;
        border: 2px solid #cbd5e0;
        box-shadow: none;
      }
      .btn-secondary:hover {
        background: #f1f9ff;
        border-color: #2b6c9e;
      }
      .footer {
        margin-top: 3rem;
        text-align: center;
        color: #6b7b8c;
        font-size: 0.9rem;
        border-top: 1px dashed #cbd5e0;
        padding-top: 2rem;
      }
      .footer i {
        color: #b22234;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1><i class="fas fa-sliders-h"></i> Dashboard</h1>
        <a href="/" class="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
      </div>

      <div class="dashboard-grid">
        <!-- LOGO UPLOAD CARD -->
        <div class="card">
          <div class="card-header">
            <i class="fas fa-images"></i>
            <h3>Logo Management</h3>
          </div>
          <div class="status-badge">
            <i class="fas fa-circle" style="color: ${LOGO1 ? '#2ecc71' : '#e74c3c'};"></i>
            Left: ${logo1Status} · Right: ${logo2Status}
          </div>
          <div class="divider"></div>
          <form action="/upload-assets" method="POST" enctype="multipart/form-data">
            <div class="form-group">
              <label><i class="fas fa-chevron-circle-left"></i> Left Logo (school badge)</label>
              <input type="file" name="logo1" accept="image/*">
            </div>
            <div class="form-group">
              <label><i class="fas fa-chevron-circle-right"></i> Right Logo (UPDF etc.)</label>
              <input type="file" name="logo2" accept="image/*">
            </div>
            <button type="submit" class="btn"><i class="fas fa-upload"></i> Upload Logos</button>
          </form>
        </div>

        <!-- SCHOOL SETTINGS CARD -->
        <div class="card">
          <div class="card-header">
            <i class="fas fa-school"></i>
            <h3>School Details</h3>
          </div>
          <div class="divider"></div>
          <form method="POST" action="/settings">
            <div class="form-group">
              <label>School Name</label>
              <input name="schoolName" value="${SETTINGS.schoolName}">
            </div>
            <div class="form-group">
              <label>Address & Phone</label>
              <input name="address" value="${SETTINGS.address}">
            </div>
            <div class="form-group">
              <label>Vision</label>
              <textarea name="vision">${SETTINGS.vision}</textarea>
            </div>
            <div class="form-group">
              <label>Mission</label>
              <textarea name="mission">${SETTINGS.mission}</textarea>
            </div>
            <div class="form-group">
              <label>Footer Motto</label>
              <input name="footer" value="${SETTINGS.footer}">
            </div>
            <div class="form-group">
              <label>Head Teacher Name</label>
              <input name="headTeacher" value="${SETTINGS.headTeacher}">
            </div>
            <div class="form-group">
              <label>Head Teacher Rank (optional)</label>
              <input name="headTeacherRank" value="${SETTINGS.headTeacherRank}" placeholder="e.g. Maj.">
            </div>
            <div class="form-group">
              <label>Head Teacher Title (optional)</label>
              <input name="headTeacherTitle" value="${SETTINGS.headTeacherTitle}" placeholder="e.g. HEAD TEACHER">
            </div>
            <button type="submit" class="btn"><i class="fas fa-save"></i> Save Settings</button>
          </form>
        </div>

        <!-- GENERATION CARD -->
        <div class="card">
          <div class="card-header">
            <i class="fas fa-file-pdf"></i>
            <h3>Generate Testimonials</h3>
          </div>
          <div class="divider"></div>
          <form action="/generate" method="POST" enctype="multipart/form-data">
            <div class="form-group">
              <label><i class="fas fa-file-excel"></i> Excel File (.xlsx, .xls, .csv)</label>
              <input type="file" name="excel" accept=".xlsx, .xls, .csv" required>
            </div>
            <div class="form-group">
              <p style="font-size:0.85rem; color:#4b6584;"><i class="fas fa-info-circle"></i> Ensure columns: Candidate_Name, IndexNo, Sex, DATE OF BIRTH, Result, SUBJECT ACHIEVEMENTS, PROJECT WORK</p>
            </div>
            <button type="submit" class="btn btn-secondary"><i class="fas fa-file-archive"></i> Generate & Download ZIP</button>
          </form>
        </div>
      </div>

      <!-- DEVELOPER FOOTER (same as login) -->
      <div class="footer">
        <i class="fas fa-code"></i> Developed by <strong>Mawerere Francis</strong> · 
        📞 <a href="tel:+256788223215">0788223215</a> · 
        ✉️ <a href="mailto:mawererefrancis@gmail.com">mawererefrancis@gmail.com</a> · 
        <i class="fab fa-whatsapp"></i> <a href="https://wa.me/256788223215">+256788223215</a>
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
  if (req.files.logo1) LOGO1 = req.files.logo1[0].path;
  if (req.files.logo2) LOGO2 = req.files.logo2[0].path;
  res.send("✅ Logos uploaded. <a href='/dashboard'>Back to Dashboard</a>");
});

// ================== SETTINGS ==================
app.post("/settings", (req, res) => {
  SETTINGS = { ...SETTINGS, ...req.body };
  res.send("✅ Settings updated. <a href='/dashboard'>Back to Dashboard</a>");
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

        // Parse grades (A-E)
        const gradeMap = {};
        if (achievements) {
          const parts = achievements.split(" ");
          for (const part of parts) {
            const match = part.match(/^([A-Z]+)-([A-E])$/);
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

        // ---------- LOGOS (only if they exist) ----------
        const titleY = 170;
        const logoHeight = 70;

        // Left logo (if exists)
        if (LOGO1 && fs.existsSync(LOGO1)) {
          doc.image(LOGO1, 45, titleY - logoHeight, { height: logoHeight });
        }
        // Right logo (if exists) – placed only if present
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

        // ---------- CANDIDATE DETAILS BOX (dynamic) ----------
        const boxLeft = 45;
        const boxWidth = 520;
        const boxPadding = 10;
        
        const nameLength = name.length;
        const boxHeight = nameLength > 35 ? 120 : 100;
        const boxTop = 210;

        doc.roundedRect(boxLeft, boxTop, boxWidth, boxHeight, 5).lineWidth(1).strokeColor("#CCCCCC").stroke();

        doc.fontSize(11).fillColor("black");
        
        if (nameLength > 35) {
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
        const tableTop = boxTop + boxHeight + 20;
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

        // ---------- SIGNATURE BLOCK (skip empty lines) ----------
        const sigY = mottoY + 60;
        const sigX = 350;
        doc.fontSize(12).fillColor("black");
        
        // Dotted line always present
        doc.text("....................................", sigX, sigY - 10, { align: "left" });
        
        // Head teacher name (required)
        if (SETTINGS.headTeacher && SETTINGS.headTeacher.trim() !== '') {
          doc.text(SETTINGS.headTeacher, sigX, sigY, { align: "left" });
        }
        // Rank (optional)
        if (SETTINGS.headTeacherRank && SETTINGS.headTeacherRank.trim() !== '') {
          doc.text(SETTINGS.headTeacherRank, sigX, sigY + 18, { align: "left" });
        }
        // Title (optional)
        if (SETTINGS.headTeacherTitle && SETTINGS.headTeacherTitle.trim() !== '') {
          doc.text(SETTINGS.headTeacherTitle, sigX, sigY + 36, { align: "left" });
        }

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
