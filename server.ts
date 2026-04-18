import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const PROCUREMENTS_FILE = path.join(DATA_DIR, "procurements.json");
const ORGANIZATIONS_FILE = path.join(DATA_DIR, "organizations.json");

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(PROCUREMENTS_FILE)) {
  fs.writeFileSync(PROCUREMENTS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(ORGANIZATIONS_FILE)) {
  fs.writeFileSync(ORGANIZATIONS_FILE, JSON.stringify([
    {
      id: 1,
      name: "Государственное казенное учреждение 'Центр закупок'",
      short_name: "ГКУ Центр закупок",
      inn: "7701010101",
      kpp: "770101001",
      ogrn: "1027700000001",
      address: "г. Москва, ул. Ленина, д. 1",
      phone: "+7 (495) 111-22-33",
      email: "info@zakupki.gov.ru",
      director_position: "Директор",
      director_name: "Иванов Иван Иванович",
      contract_manager: "Петров Петр Петрович",
      law: "44-ФЗ",
      treasury_account: "03221643000000017300",
      bank_name: "ГУ БАНКА РОССИИ ПО ЦФО",
      bik: "044525000",
      budget_limits: 100000000.0,
      smp_quota: 25.0
    }
  ]));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to read/write JSON files
  const readData = (file: string) => JSON.parse(fs.readFileSync(file, "utf8"));
  const writeData = (file: string, data: any) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

  // --- API V1 ROUTES ---

  // Health
  app.get("/api/v1/health", (req, res) => {
    res.json({ status: "ok", version: "3.1.0" });
  });

  // Procurements CRUD
  app.get("/api/v1/procurements", (req, res) => {
    res.json(readData(PROCUREMENTS_FILE));
  });

  app.post("/api/v1/procurements", (req, res) => {
    const procurements = readData(PROCUREMENTS_FILE);
    const newProc = {
      ...req.body,
      id: procurements.length > 0 ? Math.max(...procurements.map((p: any) => p.id)) + 1 : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: req.body.status || "draft",
      processing_status: "not_started",
      history: [{
        date: new Date().toISOString(),
        actor: "Система",
        event: "Создание закупки",
        comment: ""
      }]
    };
    procurements.push(newProc);
    writeData(PROCUREMENTS_FILE, procurements);
    res.status(201).json(newProc);
  });

  app.get("/api/v1/procurements/:id", (req, res) => {
    const procurements = readData(PROCUREMENTS_FILE);
    const proc = procurements.find((p: any) => p.id === parseInt(req.params.id));
    if (proc) {
      res.json(proc);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.put("/api/v1/procurements/:id", (req, res) => {
    const procurements = readData(PROCUREMENTS_FILE);
    const index = procurements.findIndex((p: any) => p.id === parseInt(req.params.id));
    if (index !== -1) {
      procurements[index] = {
        ...procurements[index],
        ...req.body,
        updated_at: new Date().toISOString()
      };
      writeData(PROCUREMENTS_FILE, procurements);
      res.json(procurements[index]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/v1/procurements/:id", (req, res) => {
    let procurements = readData(PROCUREMENTS_FILE);
    procurements = procurements.filter((p: any) => p.id !== parseInt(req.params.id));
    writeData(PROCUREMENTS_FILE, procurements);
    res.status(204).end();
  });

  // Workflow transitions
  app.post("/api/v1/procurements/:id/transition", (req, res) => {
    const { to_status, actor, comment } = req.body;
    const procurements = readData(PROCUREMENTS_FILE);
    const index = procurements.findIndex((p: any) => p.id === parseInt(req.params.id));
    if (index !== -1) {
      const oldStatus = procurements[index].status;
      procurements[index].status = to_status;
      procurements[index].updated_at = new Date().toISOString();
      procurements[index].history.push({
        date: new Date().toISOString(),
        actor,
        event: `Переход: ${oldStatus} -> ${to_status}`,
        comment
      });
      writeData(PROCUREMENTS_FILE, procurements);
      res.json(procurements[index]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  // AI Analysis trigger (Simulation)
  app.post("/api/v1/procurements/:id/process", (req, res) => {
    const procurements = readData(PROCUREMENTS_FILE);
    const index = procurements.findIndex((p: any) => p.id === parseInt(req.params.id));
    if (index !== -1) {
      procurements[index].processing_status = "processing";
      procurements[index].updated_at = new Date().toISOString();
      writeData(PROCUREMENTS_FILE, procurements);
      
      // Simulation of a background workflow
      setTimeout(() => {
        const p = readData(PROCUREMENTS_FILE);
        const idx = p.findIndex((item: any) => item.id === parseInt(req.params.id));
        if (idx !== -1) {
          // The actual AI analysis result will be sent from the frontend after it's done
          // because we follow the "Gemini on frontend" rule.
          // This endpoint just updates the status to 'processing'.
        }
      }, 100);

      res.json({ message: "Started processing", id: req.params.id });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  // Organizations CRUD
  app.get("/api/v1/organizations", (req, res) => {
    res.json(readData(ORGANIZATIONS_FILE));
  });

  app.get("/api/v1/organizations/:id", (req, res) => {
    const orgs = readData(ORGANIZATIONS_FILE);
    const org = orgs.find((o: any) => o.id === parseInt(req.params.id));
    res.json(org || { error: "Not found" });
  });

  // Calculators
  app.post("/api/v1/calc/calculate", (req, res) => {
    const { prices } = req.body;
    if (!prices || prices.length < 3) {
      return res.status(400).json({ error: "Min 3 prices required" });
    }
    const avg = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
    const sd = Math.sqrt(prices.reduce((s: number, p: number) => s + Math.pow(p - avg, 2), 0) / (prices.length - 1));
    const cv = (sd / avg) * 100;
    
    res.json({
      nmck: avg,
      average: avg,
      min: Math.min(...prices),
      max: Math.max(...prices),
      coefficient_of_variation: cv,
      method_name: "Метод сопоставимых рыночных цен",
      justification: cv > 33 ? "Внимание: Коэффициент вариации превышает 33%, совокупность цен неоднородна (ст. 22 44-ФЗ)." : "Совокупность цен признается однородной."
    });
  });

  app.post("/api/v1/calc/penalty", (req, res) => {
    const { contract_price, delay_days, cbr_rate } = req.body;
    const penalty = (1 / 300) * (cbr_rate / 100) * contract_price * delay_days;
    res.json({
      penalty,
      formula: "(1/300) * (rate/100) * price * days",
      description: "Расчет пени произведен в соответствии с Постановлением Правительства РФ № 1042."
    });
  });

  // OKPD2 Search (Mock Data)
  app.get("/api/v1/okpd2/search", (req, res) => {
    const q = (req.query.q as string || "").toLowerCase();
    const codes = [
      { code: "26.20.11", name: "Компьютеры портативные (ноутбуки, планшетные компьютеры)" },
      { code: "26.20.13", name: "Машины вычислительные электронные цифровые" },
      { code: "26.20.14", name: "Мониторы и проекторы" },
      { code: "26.20.15", name: "Периферийные устройства" },
      { code: "62.01.11", name: "Услуги по проектированию и разработке информационных технологий" },
      { code: "62.02.20", name: "Услуги по управлению компьютерными системами" },
      { code: "31.01.11", name: "Мебель металлическая для офисов" },
      { code: "01.11.11", name: "Пшеница мягкая" },
      { code: "10.11.11", name: "Мясо крупного рогатого скота парное" },
      { code: "58.11.11", name: "Книги печатные" },
    ];
    res.json(codes.filter(c => c.code.includes(q) || c.name.toLowerCase().includes(q)));
  });

  // Contractor Check (Mock)
  app.get("/api/v1/contractor/check/:inn", (req, res) => {
    const inn = req.params.inn;
    res.json({
      inn,
      valid: inn.length === 10 || inn.length === 12,
      type: inn.length === 10 ? "legal" : "individual",
      rnp_check: false,
      bankruptcy: false,
      active: true,
      name: "ООО 'Поставщик-Гарант'",
      ogrn: "1027739000000"
    });
  });

  // 1C Mock Integration
  app.get("/api/v1/1c/status", (req, res) => {
    res.json({ bgu: "connected", erp: "connected", do: "connected", mock_mode: true });
  });

  app.get("/api/v1/1c/budget", (req, res) => {
    res.json({ available: 5000000.0, reserved: 1200000.0 });
  });

  app.post("/api/v1/1c/do/document", (req, res) => {
    const { procurementId, doc_type, title } = req.body;
    
    if (!procurementId) {
      return res.status(400).json({ success: false, error: "Procurement ID is required" });
    }
    
    console.log(`[1C:DO] Generating document in 1C:DO for ${procurementId}: ${doc_type}`);
    res.json({
      success: true,
      message: `Документ '${title || doc_type}' успешно создан в 1С:ДО`,
      doc_id: `FILE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      reg_number: `ВН-${Math.floor(Math.random() * 1000)}-${new Date().getFullYear()}`,
      created_at: new Date().toISOString()
    });
  });

  app.post("/api/v1/1c/do/sync", (req, res) => {
    const { procurementId } = req.body;
    console.log(`[1C:DO] Syncing procurement ${procurementId}`);
    res.json({ 
      success: true, 
      message: "Данные закупки успешно переданы в 1С:Документооборот",
      doc_id: `DO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      sync_time: new Date().toISOString()
    });
  });

  app.post("/api/v1/1c/do/task", (req, res) => {
    const { procurementId, task_type, assignee } = req.body;
    console.log(`[1C:DO] Creating task for ${procurementId}: ${task_type}`);
    res.json({ 
      success: true, 
      task_id: `TASK-${Math.random().toString(10).substr(2, 6)}`,
      status: "Создана",
      assignee: assignee || "Петров П.П."
    });
  });

  // GosZakaz Mock
  app.get("/api/v1/goszakaz/notices", (req, res) => {
    res.json([
      { id: "0173200001424000001", subject: "Поставка оргтехники", nmck: 1500000 },
      { id: "0173200001424000002", subject: "Оказание услуг связи", nmck: 300000 }
    ]);
  });

  // Orchestrator Dashboard (v2)
  app.get("/api/v2/orchestrator/dashboard", (req, res) => {
    const procurements = readData(PROCUREMENTS_FILE);
    const analyzed = procurements.filter((p: any) => p.processing_status === "completed");
    res.json({
      total: procurements.length,
      analyzed: analyzed.length,
      go_count: analyzed.filter((p: any) => p.processing_result?.decision === "GO").length,
      nogo_count: analyzed.filter((p: any) => p.processing_result?.decision === "NO-GO").length,
      review_count: analyzed.filter((p: any) => p.processing_result?.decision === "REVIEW").length,
      recent: procurements.slice(-10).reverse()
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: any, res: any) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
