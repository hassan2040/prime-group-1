import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "db.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

function readDB() {
  const data = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(data);
}

function writeDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Error handler for JSON parsing errors
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
      console.error('JSON Parsing Error:', err);
      return res.status(400).json({ error: "خطأ في تنسيق البيانات (JSON)" });
    }
    next(err);
  });

  // API Routes
  app.get(["/api/db", "/api/db/"], (req, res) => {
    try {
      res.json(readDB());
    } catch (error) {
      console.error('Error reading DB:', error);
      res.status(500).json({ error: "فشل في قراءة قاعدة البيانات" });
    }
  });

  app.post(["/api/db", "/api/db/"], (req, res) => {
    try {
      writeDB(req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error writing DB:', error);
      res.status(500).json({ error: "فشل في حفظ البيانات" });
    }
  });

  // Specific Login Endpoint with Hashing Support
  app.post(["/api/login", "/api/login/"], async (req, res) => {
    try {
      const { username, password } = req.body;
      const db = readDB();
      const user = db.users.find((u: any) => u.username === username);

      if (!user) {
        return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }

      // Check if password is hashed (bcrypt hashes start with $2a$ or $2b$)
      const isHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));

      if (isHashed) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
        }
      } else {
        // Legacy plain text check
        if (password !== user.password) {
          return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
        }
        // Auto-migrate to hashed password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        writeDB(db);
      }

      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "حدث خطأ أثناء تسجيل الدخول" });
    }
  });

  // Change Password Endpoint
  app.post(["/api/change-password", "/api/change-password/"], async (req, res) => {
    try {
      const { userId, currentPassword, newPassword } = req.body;
      const db = readDB();
      const user = db.users.find((u: any) => u.id === userId);

      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }

      const isHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));
      let isMatch = false;
      if (isHashed) {
        isMatch = await bcrypt.compare(currentPassword, user.password);
      } else {
        isMatch = currentPassword === user.password;
      }

      if (!isMatch) {
        return res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      writeDB(db);

      res.json({ success: true });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: "حدث خطأ أثناء تغيير كلمة المرور" });
    }
  });

  // Admin Reset Password Endpoint
  app.post(["/api/admin/reset-password", "/api/admin/reset-password/"], async (req, res) => {
    try {
      const { userId, newPassword } = req.body;
      const db = readDB();
      const user = db.users.find((u: any) => u.id === userId);

      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      writeDB(db);

      res.json({ success: true });
    } catch (error) {
      console.error('Admin reset password error:', error);
      res.status(500).json({ error: "حدث خطأ أثناء إعادة تعيين كلمة المرور" });
    }
  });

  // File Upload Endpoint
  app.post(["/api/upload", "/api/upload/"], upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "لم يتم رفع أي ملف" });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl, name: req.file.originalname });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: "حدث خطأ أثناء رفع الملف" });
    }
  });

  // Catch-all for API routes to prevent falling through to Vite/SPA fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `المسار ${req.method} ${req.url} غير موجود` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
