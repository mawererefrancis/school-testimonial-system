import express from "express";
import multer from "multer";
import XLSX from "xlsx";
import PDFDocument from "pdfkit";
import archiver from "archiver";
import QRCode from "qrcode";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

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
  vision: "To produce a morally upright and self reliant future generation.",
  mission: "To provide affordable quality education.",
  footer: "Victory Is Our Challenge",
  headTeacher: "HEAD TEACHER"
};

let LOGO1 = "";
let LOGO2 = "";
let SIGNATURE = "";
let DATABASE = {};

// ================== LOGIN PAGE ==================
app.get("/", (req, res) => {
  res.send(`
  <html>
  <head>
  <title>School Testimonial System</title>
  <style>
  body{font-family:Arial;background:#f4f6f9;padding:40px;}
  .card{background:white;padding:30px;border-radius:10px;max-width:400px;margin:auto;box-shadow:0 5px 20px rgba(0,0,0,0.1);}
  input,button{width:100%;padding:10px;margin:10px 0;}
  button{background:#003366;color:white;border:none;}
  </style>
  </head>
  <body>
  <div class="card">
  <h2>Admin Login</h2>
  <form method="POST" action="/dashboard">
  <input name="username" placeholder="Username" required/>
  <input name="password" type="password" placeholder="Password" required/>
  <button>Login</button>
  </form>
  </div>
  </body>
  </html>
  `);
});

app.post("/dashboard", async (req, res) => {
  if (req.body.username !== ADMIN_USERNAME)
    return res.send("Invalid login");

  const valid = await bcrypt.compare(req.body.password, HASHED_PASSWORD);
  if (!valid) return res.send("Invalid login");

  res.send(DASHBOARD_HTML());
});

// ================== DASHBOARD ==================
function DASHBOARD_HTML() {
  return `
  <html>
  <head>
  <style>
  body{font-family:Arial;background:#eef2f7;padding:20px;}
  h1{color:#003366;}
  .box{background:white;padding:20px;margin:15px 0;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.05);}
  input,textarea,button{width:100%;padding:8px;margin:5px 0;}
  button{background:#003366;color:white;border:none;}
  </style>
  </head>
  <body>
  <h1>Testimonial Generator Dashboard</h1>

  <div class="box">
  <h3>Upload Logos & Signature</h3>
  <form action="/upload-assets" method="POST" enctype="multipart/form-data">
  <input type="file" name="logo1" required/>
  <input type="file" name="logo2" required/>
  <input type="file" name="signature" required/>
  <button>Upload</button>
  </form>
  </div>

  <div class="box">
  <h3>Settings</h3>
  <form method="POST" action="/settings">
  <input name="schoolName" placeholder="School Name"/>
  <textarea name="vision" placeholder="Vision"></textarea>
  <textarea name="mission" placeholder="Mission"></textarea>
  <input name="footer" placeholder="Footer"/>
  <input name="headTeacher" placeholder="Head Teacher"/>
  <button>Save Settings</button>
  </form>
  </div>

  <div class="box">
  <h3>Upload Excel & Generate</h3>
  <form action="/generate" method="POST" enctype="multipart/form-data">
  <input type="file" name="excel" required />
  <button>Generate Testimonials (ZIP)</button>
  </form>
  </div>

  </body>
  </html>
  `;
}

// ================== ASSETS ==================
app.post("/upload-assets", upload.fields([
  { name: "logo1" },
  { name: "logo2" },
  { name: "signature" }
]), (req, res) => {

  LOGO1 = req.files.logo1[0].path;
  LOGO2 = req.files.logo2[0].path;
  SIGNATURE = req.files.signature[0].path;

  res.send("Assets Uploaded Successfully");
});

// ================== SETTINGS ==================
app.post("/settings", (req, res) => {
  SETTINGS = { ...SETTINGS, ...req.body };
  res.send("Settings Updated");
});

// ================== GENERATE ==================
app.post("/generate", upload.single("excel"), async (req, res) => {

  const workbook = XLSX.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const students = XLSX.utils.sheet_to_json(sheet);

  const zipPath = "generated/testimonials.zip";
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip");
  archive.pipe(output);

  for (let s of students) {

    const id = uuidv4();
    DATABASE[id] = s;

    const verifyURL = `${req.protocol}://${req.get('host')}/verify/${id}`;
    const qrImage = await QRCode.toDataURL(verifyURL);

    const filePath = `generated/${s.NAME}.pdf`;
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(fs.createWriteStream(filePath));

    doc.rect(20,20,555,800).lineWidth(3).stroke("#003366");

    if(LOGO1) doc.image(LOGO1,30,30,{width:70});
    if(LOGO2) doc.image(LOGO2,480,30,{width:70});

    doc.fontSize(18).fillColor("#003366")
       .text(SETTINGS.schoolName,{align:"center"});

    doc.moveDown();
    doc.fontSize(12).fillColor("black");
    doc.text("UCE TESTIMONIAL",{align:"center"});
    doc.moveDown();

    doc.text("NAME: "+s.NAME);
    doc.text("INDEX NO: "+(s["INDEX NO"]||""));
    doc.moveDown();

    doc.text("RESULT: "+(s.RESULT||""));
    doc.moveDown();

    if(SIGNATURE) doc.image(SIGNATURE,400,650,{width:120});
    doc.text(SETTINGS.headTeacher,{align:"right"});

    doc.image(qrImage,450,700,{width:90});

    doc.end();
    archive.file(filePath,{name:`${s.NAME}.pdf`});
  }

  await archive.finalize();

  output.on("close",()=> {
    res.download(zipPath);
  });

});

// ================== VERIFY ==================
app.get("/verify/:id",(req,res)=>{
  const s = DATABASE[req.params.id];
  if(!s) return res.send("Invalid Certificate");

  res.send(`
  <h2>Certificate Verification</h2>
  <p><b>Name:</b> ${s.NAME}</p>
  <p><b>Index:</b> ${s["INDEX NO"]||""}</p>
  <p><b>Result:</b> ${s.RESULT||""}</p>
  <h3 style="color:green;">STATUS: VALID</h3>
  `);
});

// ================== PORT FIX ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
