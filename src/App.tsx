import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  Calculator, 
  FileText, 
  Search, 
  ShieldCheck, 
  Building2, 
  Settings2, 
  BrainCircuit, 
  Database, 
  History, 
  ChevronRight, 
  Play, 
  Save, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Menu,
  X,
  Send,
  Loader2,
  FileSearch,
  Users,
  Briefcase,
  RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE = ""; // Relative to host

// --- TYPES ---
interface Procurement {
  id: number;
  organization_id: number;
  subject: string;
  nmck: number;
  okpd2_code: string;
  okpd2_name: string;
  contractor_inn: string;
  contractor_name: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  processing_status: 'not_started' | 'processing' | 'completed';
  processing_result?: {
    decision: 'GO' | 'NO-GO' | 'REVIEW';
    risk: 'low' | 'medium' | 'high' | 'critical';
    summary: string;
    details: any;
  };
  history: any[];
}

interface Organization {
  id: number;
  name: string;
  inn: string;
  short_name: string;
}

// --- MAIN APP ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentProcurement, setCurrentProcurement] = useState<Partial<Procurement>>({
    subject: '',
    nmck: 0,
    okpd2_code: '',
    okpd2_name: '',
    contractor_inn: '',
    status: 'draft',
    organization_id: 1
  });
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetchProcurements();
    fetchOrganizations();
  }, []);

  const fetchProcurements = async () => {
    const res = await fetch(`${API_BASE}/api/v1/procurements`);
    const data = await res.json();
    setProcurements(data);
  };

  const fetchOrganizations = async () => {
    const res = await fetch(`${API_BASE}/api/v1/organizations`);
    const data = await res.json();
    setOrganizations(data);
  };

  const saveProcurement = async () => {
    setLoading(true);
    const method = currentProcurement.id ? 'PUT' : 'POST';
    const url = currentProcurement.id 
      ? `${API_BASE}/api/v1/procurements/${currentProcurement.id}` 
      : `${API_BASE}/api/v1/procurements`;
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentProcurement)
    });
    
    if (res.ok) {
      await fetchProcurements();
      if (!currentProcurement.id) {
        const saved = await res.json();
        setCurrentProcurement(saved);
      }
    }
    setLoading(false);
  };

  const transitionStatus = async (to: string) => {
    if (!currentProcurement.id) return;
    const res = await fetch(`${API_BASE}/api/v1/procurements/${currentProcurement.id}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_status: to, actor: 'Иванов И.И.', comment: 'Смена статуса пользователем' })
    });
    if (res.ok) {
      const updated = await res.json();
      setCurrentProcurement(updated);
      fetchProcurements();
    }
  };

  const startAIAnalysis = async () => {
    if (!currentProcurement.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/procurements/${currentProcurement.id}/analyze`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      await fetchProcurements();
      const updated = procurements.find(p => p.id === currentProcurement.id);
      if (updated) setCurrentProcurement(updated);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#eaecf2] font-sans text-[13px] text-[#333]">
      {/* Sidebar */}
      <aside className={cn(
        "bg-[#2c4a7c] text-white transition-all duration-300 flex flex-col shrink-0 overflow-hidden",
        sidebarOpen ? "w-64" : "w-0"
      )}>
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-md flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <span className="font-bold text-lg whitespace-nowrap">АРМ Госзаказ 3.1</span>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto space-y-1">
          <NavItem icon={<BarChart3 size={18} />} label="Панель управления" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<MessageSquare size={18} />} label="ИИ-Агенты" active={activeTab === 'agents'} onClick={() => setActiveTab('agents')} />
          <NavItem icon={<Calculator size={18} />} label="Калькулятор НМЦК" active={activeTab === 'nmck'} onClick={() => setActiveTab('nmck')} />
          <NavItem icon={<AlertCircle size={18} />} label="Неустойка" active={activeTab === 'penalty'} onClick={() => setActiveTab('penalty')} />
          <NavItem icon={<Clock size={18} />} label="Сроки" active={activeTab === 'deadlines'} onClick={() => setActiveTab('deadlines')} />
          <NavItem icon={<Search size={18} />} label="Поиск ОКПД2" active={activeTab === 'okpd2'} onClick={() => setActiveTab('okpd2')} />
          <NavItem icon={<Users size={18} />} label="Контрагенты" active={activeTab === 'contractor'} onClick={() => setActiveTab('contractor')} />
          <NavItem icon={<Building2 size={18} />} label="Организации" active={activeTab === 'organizations'} onClick={() => setActiveTab('organizations')} />
          <NavItem icon={<FileText size={18} />} label="Документы" active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
          
          <div className="px-4 py-2 opacity-50 text-[11px] uppercase tracking-wider">Аналитика</div>
          <NavItem icon={<BrainCircuit size={18} />} label="CORE-анализ" active={activeTab === 'core'} onClick={() => setActiveTab('core')} />
          <NavItem icon={<Database size={18} />} label="Интеграция 1С" active={activeTab === 'one_c'} onClick={() => setActiveTab('one_c')} />
        </nav>
        
        <div className="p-4 border-t border-white/10 text-xs text-white/50 text-center">
          © 2024–2026 АРМ Госзаказ
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0 shadow-sm z-10">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-100 rounded">
            <Menu size={20} className="text-[#2c4a7c]" />
          </button>
          
          <div className="flex items-center gap-4">
            <span className="text-gray-500 italic">Пользователь: Иванов И.И. (Администратор)</span>
            <div className="w-8 h-8 rounded-full bg-[#4a6fa5] flex items-center justify-center text-white">ИА</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              {activeTab === 'dashboard' && (
                <DashboardTab 
                  current={currentProcurement} 
                  setCurrent={setCurrentProcurement}
                  onSave={saveProcurement}
                  loading={loading}
                  onProcess={startAIAnalysis}
                  procurements={procurements}
                  orgs={organizations}
                  onTransition={transitionStatus}
                />
              )}
              {activeTab === 'agents' && <AgentsTab />}
              {activeTab === 'nmck' && <NmckTab />}
              {activeTab === 'penalty' && <PenaltyTab />}
              {activeTab === 'deadlines' && <DeadlinesTab />}
              {activeTab === 'okpd2' && <Okpd2Tab />}
              {activeTab === 'contractor' && <ContractorTab />}
              {activeTab === 'organizations' && <OrganizationsTab orgs={organizations} onRefresh={fetchOrganizations} />}
              {activeTab === 'documents' && <DocumentsTab procurement={currentProcurement} />}
              {activeTab === 'core' && <CoreTab procurements={procurements} onProcess={startAIAnalysis} />}
              {activeTab === 'one_c' && <OneCTab procurement={currentProcurement} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left border-l-[3px]",
        active ? "bg-white/10 border-white text-white" : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function Card({ children, title, className, action }: { children: React.ReactNode, title?: string, className?: string, action?: React.ReactNode }) {
  return (
    <div className={cn("bg-white border border-gray-200 rounded shadow-sm", className)}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-[#2c4a7c] uppercase tracking-wide">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-gray-500 uppercase font-semibold">{label}</label>
      <input {...props} className="w-full h-8 px-2 border border-gray-300 rounded focus:border-[#2c4a7c] focus:outline-none transition-colors bg-[#fdfdfd]" />
    </div>
  );
}

function Select({ label, options, ...props }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-gray-500 uppercase font-semibold">{label}</label>
      <select {...props} className="w-full h-8 px-2 border border-gray-300 rounded focus:border-[#2c4a7c] focus:outline-none transition-colors bg-[#fdfdfd]">
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// --- TAB COMPONENTS ---

function DashboardTab({ current, setCurrent, onSave, loading, onProcess, procurements, orgs, onTransition }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* State Pipeline */}
        <Card>
          <div className="flex justify-between items-center px-4 py-2">
            <PipelineStep label="Черновик" active={current.status === 'draft'} done={current.status !== 'draft'} color="#94a3b8" />
            <ChevronRight className="text-gray-300" />
            <PipelineStep label="Подготовка" active={current.status === 'preparation'} done={['review', 'docs_ready', 'approval', 'done'].includes(current.status)} color="#4a6fa5" />
            <ChevronRight className="text-gray-300" />
            <PipelineStep label="Экспертиза" active={current.status === 'review'} done={['docs_ready', 'approval', 'done'].includes(current.status)} color="#f59e0b" />
            <ChevronRight className="text-gray-300" />
            <PipelineStep label="Подписано" active={current.status === 'done'} done={false} color="#10b981" />
          </div>
        </Card>

        {/* Form */}
        <Card title="Карточка закупки" action={
          <div className="flex gap-2">
            <button onClick={onSave} disabled={loading} className="px-3 py-1 bg-[#4a6fa5] text-white rounded hover:bg-[#3b5984] disabled:opacity-50 flex items-center gap-1">
              <Save size={14} /> Сохранить
            </button>
            <button onClick={onProcess} disabled={loading || !current.id} className="px-3 py-1 bg-[#4a7c59] text-white rounded hover:bg-[#3b6347] disabled:opacity-50 flex items-center gap-1">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Рассчитать ИИ
            </button>
          </div>
        }>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Select label="Заказчик" value={current.organization_id} onChange={(e: any) => setCurrent({...current, organization_id: parseInt(e.target.value)})} options={orgs.map((o: any) => ({ label: o.name, value: o.id }))} />
            </div>
            <div className="col-span-2">
              <Input label="Предмет закупки" value={current.subject} onChange={(e: any) => setCurrent({...current, subject: e.target.value})} />
            </div>
            <Input label="НМЦК (руб)" type="number" value={current.nmck} onChange={(e: any) => setCurrent({...current, nmck: parseFloat(e.target.value)})} />
            <Input label="Код ОКПД2" value={current.okpd2_code} onChange={(e: any) => setCurrent({...current, okpd2_code: e.target.value})} />
            <Input label="Наименование по ОКПД2" value={current.okpd2_name} onChange={(e: any) => setCurrent({...current, okpd2_name: e.target.value})} />
            <Input label="ИНН Поставщика" value={current.contractor_inn} onChange={(e: any) => setCurrent({...current, contractor_inn: e.target.value})} />
            <div className="col-span-2">
              <label className="text-[11px] text-gray-500 uppercase font-semibold">Заметки</label>
              <textarea 
                className="w-full p-2 border border-gray-300 rounded focus:border-[#2c4a7c] focus:outline-none min-h-[80px]" 
                value={current.notes} 
                onChange={(e) => setCurrent({...current, notes: e.target.value})}
              />
            </div>
          </div>
        </Card>

        {/* AI Result Card */}
        {current.processing_result && (
          <Card title="Аналитический отчет ИИ" className={cn(
            "border-t-4",
            current.processing_result.decision === 'GO' ? "border-t-green-500" : 
            current.processing_result.decision === 'NO-GO' ? "border-t-red-500" : "border-t-yellow-500"
          )}>
            <div className="flex items-center gap-4 mb-4">
              <span className={cn(
                "px-3 py-1 rounded-full font-bold text-xs uppercase",
                current.processing_result.decision === 'GO' ? "bg-green-100 text-green-700" : 
                current.processing_result.decision === 'NO-GO' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
              )}>
                {current.processing_result.decision}
              </span>
              <span className="text-gray-500 font-medium">Риск: {current.processing_result.risk}</span>
            </div>
            <p className="text-gray-700 font-medium leading-relaxed mb-4">{current.processing_result.summary}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <AnalysisDetail title="Финансовый" text={current.processing_result.details.finance} />
              <AnalysisDetail title="Правовой" text={current.processing_result.details.legal} />
              <AnalysisDetail title="Технический" text={current.processing_result.details.technical} />
              <AnalysisDetail title="Комплаенс" text={current.processing_result.details.compliance} />
            </div>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card title="Последние закупки" action={
          <button onClick={() => setCurrent({ subject: '', nmck: 0, status: 'draft', okpd2_code: '', organization_id: 1 })} className="p-1 hover:bg-gray-100 rounded text-[#4a6fa5]">
            <Plus size={18} />
          </button>
        }>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {procurements.map((p: any) => (
              <button 
                key={p.id} 
                onClick={() => setCurrent(p)}
                className={cn(
                  "w-full text-left p-3 rounded border transition-all",
                  current.id === p.id ? "border-[#4a6fa5] bg-[#eff6ff]" : "border-gray-100 hover:border-gray-300 bg-gray-50/50"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[11px] font-bold text-[#2c4a7c]">№ {p.id}</span>
                  <span className="text-[10px] text-gray-400">{format(new Date(p.created_at), 'dd.MM.yyyy')}</span>
                </div>
                <div className="font-semibold text-xs line-clamp-1 mb-1">{p.subject}</div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#4a6fa5]">{new Intl.NumberFormat('ru-RU').format(p.nmck)} ₽</span>
                  <span className="text-[10px] uppercase font-bold text-gray-500">{p.status}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {current.history && (
          <Card title="История изменений">
            <div className="space-y-4">
              {current.history.map((h: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4a6fa5] mt-1.5 shrink-0" />
                  <div>
                    <div className="text-[11px] font-bold text-gray-700">{h.event}</div>
                    <div className="text-[10px] text-gray-400">{format(new Date(h.date), 'dd.MM HH:mm')} • {h.actor}</div>
                    {h.comment && <div className="text-[11px] text-gray-600 mt-1 italic">"{h.comment}"</div>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function PipelineStep({ label, active, done, color }: any) {
  return (
    <div className="flex flex-col items-center gap-1 group">
      <div 
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all border-2",
          active ? "scale-110 shadow-lg" : "scale-100",
          done ? "bg-[#4a7c59] border-[#4a7c59] text-white" : active ? "bg-white border-[#2c4a7c] text-[#2c4a7c]" : "bg-gray-100 border-gray-200 text-gray-400"
        )}
      >
        {done ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? color : 'currentColor' }} />}
      </div>
      <span className={cn(
        "text-[10px] font-bold uppercase transition-colors",
        active ? "text-[#2c4a7c]" : "text-gray-400"
      )}>
        {label}
      </span>
    </div>
  );
}

function AnalysisDetail({ title, text }: any) {
  return (
    <div className="p-2 bg-gray-50 border border-gray-100 rounded">
      <div className="font-bold text-gray-500 uppercase mb-1">{title}</div>
      <div className="text-gray-600 line-clamp-2">{text}</div>
    </div>
  );
}

// --- MODULE TABS ---

function AgentsTab() {
  const [activeAgent, setActiveAgent] = useState('finance');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const agents = {
    finance: { name: 'Финансовый аналитик', desc: 'Анализ НМЦК, демпинга и обеспечения.', prompt: 'Ты эксперт по финансовому аудиту госзакупок по 44-ФЗ. Твоя задача — анализировать обоснование цены и риски.' },
    legal: { name: 'Юрист 44-ФЗ', desc: 'Правовая экспертиза и риски КоАП.', prompt: 'Ты ведущий юрист в сфере госзаказа. Отвечай строго с опорой на нормы Федерального закона № 44-ФЗ и судебную практику.' },
    technical: { name: 'Технический эксперт', desc: 'Проверка ТЗ на неэффективность.', prompt: 'Ты эксперт по техническому заданию в закупках. Проверяй требования на избыточность и заточенность под конкретного поставщика.' },
    compliance: { name: 'Комплаенс-офицер', desc: 'Контроль ограничений и квот.', prompt: 'Ты офицер службы внутреннего контроля. Твоя задача — контроль соблюдения квот по СМП, нацрежима и антимонопольного законодательства.' }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, agentPrompt: (agents as any)[activeAgent].prompt })
      });
      const data = await res.json();
      const aiMsg = { role: 'assistant', content: data.response || 'Ошибка ответа' };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка при получении ответа от ИИ.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Интеллектуальный помощник" className="h-[calc(100vh-160px)] flex flex-col p-0">
      <div className="flex flex-1 h-0 overflow-hidden">
        {/* Agent Selector */}
        <div className="w-64 border-r border-gray-100 flex flex-col p-2 gap-2 bg-gray-50/50">
          {Object.entries(agents).map(([id, a]) => (
            <button 
              key={id} 
              onClick={() => { setActiveAgent(id); setMessages([]); }}
              className={cn(
                "p-3 rounded text-left transition-all",
                activeAgent === id ? "bg-white shadow-sm border border-gray-200 text-[#2c4a7c]" : "hover:bg-gray-100 text-gray-500"
              )}
            >
              <div className="font-bold text-sm mb-1">{a.name}</div>
              <div className="text-[11px] leading-tight opacity-70">{a.desc}</div>
            </button>
          ))}
        </div>
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-50">
                <MessageSquare size={48} />
                <p>Выберите специалиста и задайте вопрос по вашей закупке</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] p-3 rounded-xl",
                  m.role === 'user' ? "bg-[#4a6fa5] text-white" : "bg-gray-100 text-gray-800"
                )}>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-xl flex items-center gap-2 text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Ассистент думает...</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Задайте вопрос по статье 44-ФЗ или вашей закупке..."
                className="flex-1 h-10 px-4 border border-gray-300 rounded-full focus:outline-none focus:border-[#4a6fa5]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="w-10 h-10 rounded-full bg-[#4a6fa5] text-white flex items-center justify-center hover:bg-[#3b5984]">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function NmckTab() {
  const [prices, setPrices] = useState(['', '', '']);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    const numPrices = prices.map(p => parseFloat(p)).filter(p => !isNaN(p));
    const res = await fetch(`${API_BASE}/api/v1/calc/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prices: numPrices })
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <Card title="Калькулятор НМЦК (сопоставимые рыночные цены)">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="text-[11px] font-bold text-gray-400 uppercase">Входящие цены (минимум 3)</div>
          {prices.map((p, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-gray-400 font-bold w-4">{i + 1}.</span>
              <Input type="number" placeholder="0.00" value={p} onChange={(e: any) => {
                const newPrices = [...prices];
                newPrices[i] = e.target.value;
                setPrices(newPrices);
              }} />
              {prices.length > 3 && (
                <button onClick={() => setPrices(prices.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setPrices([...prices, ''])} className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-400 rounded hover:bg-gray-50 flex items-center justify-center gap-2">
            <Plus size={16} /> Добавить позицию
          </button>
          <button onClick={calculate} disabled={loading} className="w-full py-3 bg-[#4a6fa5] text-white rounded font-bold uppercase tracking-wider hover:bg-[#3b5984] disabled:opacity-50">
            Рассчитать
          </button>
        </div>

        <div>
          {result ? (
            <div className="bg-gray-50 p-6 rounded border border-gray-100 space-y-6">
              <div className="flex justify-between items-end border-b pb-4">
                <span className="text-gray-500 font-bold uppercase text-[11px]">Итоговая НМЦК:</span>
                <span className="text-3xl font-black text-[#2c4a7c]">{new Intl.NumberFormat('ru-RU').format(result.nmck)} ₽</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Коэф. вариации" value={result.coefficient_of_variation.toFixed(2) + '%'} color={result.coefficient_of_variation > 33 ? "text-red-500" : "text-green-500"} />
                <Stat label="Средняя цена" value={new Intl.NumberFormat('ru-RU').format(result.average) + ' ₽'} />
              </div>
              <div className={cn(
                "p-3 rounded border text-xs leading-relaxed",
                result.coefficient_of_variation > 33 ? "bg-red-50 border-red-100 text-red-700" : "bg-green-50 border-green-100 text-green-700"
              )}>
                <div className="font-bold mb-1">Обоснование:</div>
                {result.justification}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50 space-y-2 border-2 border-dashed border-gray-100 rounded">
              <Calculator size={48} />
              <p>Введите цены для получения расчета</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value, color }: any) {
  return (
    <div>
      <div className="text-[10px] text-gray-400 uppercase font-bold">{label}</div>
      <div className={cn("text-lg font-bold", color)}>{value}</div>
    </div>
  );
}

function PenaltyTab() {
  const [form, setForm] = useState({ price: 0, days: 0, rate: 16 });
  const [res, setRes] = useState<any>(null);

  const calc = async () => {
    const r = await fetch(`${API_BASE}/api/v1/calc/penalty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contract_price: form.price, delay_days: form.days, cbr_rate: form.rate })
    });
    setRes(await r.json());
  };

  return (
    <Card title="Расчет законной неустойки (ПП РФ №1042)">
      <div className="max-w-md space-y-4">
        <Input label="Цена контракта (руб)" type="number" onChange={(e: any) => setForm({...form, price: parseFloat(e.target.value)})} />
        <Input label="Кол-во дней просрочки" type="number" onChange={(e: any) => setForm({...form, days: parseInt(e.target.value)})} />
        <Input label="Ставка ЦБ РФ (%)" type="number" value={form.rate} onChange={(e: any) => setForm({...form, rate: parseFloat(e.target.value)})} />
        <button onClick={calc} className="w-full py-2 bg-[#4a6fa5] text-white rounded font-bold">Рассчитать пеню</button>
        
        {res && (
          <div className="mt-8 p-4 bg-[#eff6ff] border border-[#dbeafe] rounded">
            <div className="text-gray-500 font-bold uppercase text-[10px] mb-1">Сумма неустойки:</div>
            <div className="text-2xl font-black text-[#2c4a7c]">{new Intl.NumberFormat('ru-RU').format(res.penalty)} ₽</div>
            <p className="text-[11px] text-gray-600 mt-2">{res.description}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function DeadlinesTab() {
  return (
    <Card title="Калькулятор сроков процедур">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Select label="Способ закупки" options={[
            { label: 'Электронный аукцион', value: 'auction' },
            { label: 'Запрос котировок', value: 'quotation' },
            { label: 'Конкурс', value: 'competition' }
          ]} />
          <Input label="НМЦК" type="number" />
          <Input label="Дата размещения" type="date" />
        </div>
        <button className="px-6 py-2 bg-[#4a6fa5] text-white rounded font-bold">Рассчитать этапы</button>
        
        <div className="mt-8 border rounded overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-[11px] font-bold uppercase text-gray-500">Этап процедуры</th>
                <th className="px-4 py-2 text-[11px] font-bold uppercase text-gray-500">Минимальный срок</th>
                <th className="px-4 py-2 text-[11px] font-bold uppercase text-gray-500">Расчетная дата</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              <DeadlineRow label="Окончание подачи заявок" term="7 дней (ч. 3 ст. 42)" date="25.04.2024" />
              <DeadlineRow label="Рассмотрение заявок" term="2 раб. дня (ч. 5 ст. 49)" date="27.04.2024" />
              <DeadlineRow label="Заключение контракта (не ранее)" term="10 дней (ч. 1 ст. 51)" date="10.05.2024" />
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

function DeadlineRow({ label, term, date }: any) {
  return (
    <tr>
      <td className="px-4 py-3 font-medium">{label}</td>
      <td className="px-4 py-3 text-gray-500">{term}</td>
      <td className="px-4 py-3 font-bold text-[#2c4a7c]">{date}</td>
    </tr>
  );
}

function Okpd2Tab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const search = async () => {
    if (!query) return;
    const res = await fetch(`${API_BASE}/api/v1/okpd2/search?q=${encodeURIComponent(query)}`);
    setResults(await res.json());
  };

  return (
    <Card title="Классификатор ОКПД2">
      <div className="max-w-2xl space-y-4">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Введите код или название (например, компьютер)"
            className="flex-1 h-10 px-4 border border-gray-300 rounded focus:border-[#4a6fa5] focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
          <button onClick={search} className="px-6 bg-[#4a6fa5] text-white rounded font-bold flex items-center gap-2">
            <Search size={18} /> Найти
          </button>
        </div>
        
        <div className="space-y-2">
          {results.map((r: any) => (
            <div key={r.code} className="p-3 border border-gray-100 rounded hover:bg-gray-50 flex gap-4">
              <span className="font-bold text-[#2c4a7c] whitespace-nowrap">{r.code}</span>
              <span className="text-gray-700">{r.name}</span>
            </div>
          ))}
          {results.length === 0 && query && <p className="text-center text-gray-400 py-8">Ничего не найдено</p>}
        </div>
      </div>
    </Card>
  );
}

function ContractorTab() {
  const [inn, setInn] = useState('');
  const [res, setRes] = useState<any>(null);

  const check = async () => {
    const r = await fetch(`${API_BASE}/api/v1/contractor/check/${inn}`);
    setRes(await r.json());
  };

  return (
    <Card title="Экспресс-проверка контрагента">
      <div className="max-w-xl space-y-6">
        <div className="flex gap-2">
          <Input label="ИНН огранизации" value={inn} onChange={(e: any) => setInn(e.target.value)} />
          <button onClick={check} className="mt-5 px-6 bg-[#4a6fa5] text-white rounded font-bold">Проверить</button>
        </div>
        
        {res && (
          <div className="space-y-4 border-l-4 border-[#4a6fa5] pl-4 py-2">
            <div>
              <div className="text-xl font-bold">{res.name}</div>
              <div className="text-gray-500 font-mono">ИНН {res.inn} | ОГРН {res.ogrn}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <StatusBadge label="Реестр недобросовестных поставщиков" active={res.rnp_check} danger />
              <StatusBadge label="Статус банкротства" active={res.bankruptcy} danger />
              <StatusBadge label="Действующее предприятие" active={res.active} success />
              <StatusBadge label="Судебные дела" active={true} warning count={3} />
            </div>
            
            <div className="pt-4 flex flex-wrap gap-2">
              <RegistryLink label="ЕГРЮЛ" href="#" />
              <RegistryLink label="Закупки.гов" href="#" />
              <RegistryLink label="Руспрофиль" href="#" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function StatusBadge({ label, active, danger, success, warning, count }: any) {
  return (
    <div className="flex items-center gap-2">
      {active ? (
        danger ? <AlertCircle size={16} className="text-red-500" /> : 
        success ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-yellow-500" />
      ) : <CheckCircle2 size={16} className="text-gray-300" />}
      <span className="text-[11px] font-medium text-gray-600">{label} {count && `(${count})`}</span>
    </div>
  );
}

function RegistryLink({ label, href }: any) {
  return (
    <a href={href} className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px] uppercase font-bold hover:bg-gray-200">
      {label}
    </a>
  );
}

function OrganizationsTab({ orgs, onRefresh }: any) {
  return (
    <Card title="Реестр организаций-заказчиков">
      <div className="space-y-4">
        {orgs.map((o: any) => (
          <div key={o.id} className="p-4 border rounded hover:border-[#4a6fa5] transition-all bg-white flex justify-between items-center group">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-[#2c4a7c]">
                <Building2 size={24} />
              </div>
              <div>
                <div className="font-bold text-sm text-[#2c4a7c]">{o.name}</div>
                <div className="text-xs text-gray-500">ИНН: {o.inn} | Менеджер: {o.contract_manager}</div>
              </div>
            </div>
            <button className="p-2 text-gray-300 hover:text-[#4a6fa5]">
              <ChevronRight />
            </button>
          </div>
        ))}
        <button className="w-full py-4 border-2 border-dashed border-gray-200 text-gray-400 rounded hover:bg-gray-50 flex items-center justify-center gap-2">
          <Plus size={20} /> Добавить новую организацию
        </button>
      </div>
    </Card>
  );
}

function DocumentsTab({ procurement }: { procurement: Partial<Procurement> }) {
  const [syncing, setSyncing] = useState(false);
  const [pushingIdx, setPushingIdx] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<any>(null);

  if (!procurement.id) return <div className="text-center py-20 text-gray-400">Выберите закупку на главной панели для генерации документов</div>;
  
  const handleSyncToDo = async () => {
    setSyncing(true);
    setLastSync(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/1c/do/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ procurementId: procurement.id })
      });
      const data = await res.json();
      setLastSync(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const handlePushDoc = async (idx: number, title: string, type: string) => {
    setPushingIdx(idx);
    setLastSync(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/1c/do/document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ procurementId: procurement.id, doc_type: type, title })
      });
      const data = await res.json();
      setLastSync(data);
    } catch (e) {
      console.error(e);
    } finally {
      setPushingIdx(null);
    }
  };

  const docs = [
    { title: "Проект государственного контракта", type: "DOCX", date: "Сегодня" },
    { title: "Обоснование НМЦК", type: "PDF", date: "Сегодня" },
    { title: "Техническое задание", type: "DOCX", date: "Вчера" },
    { title: "Согласование финансового отдела", type: "PDF", date: "2 дня назад" },
    { title: "Протокол выбора способа закупки", type: "DOCX", date: "3 дня назад" }
  ];

  return (
    <Card title={`Документация: ${procurement.id}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docs.map((doc, i) => (
          <DocCard 
            key={i} 
            title={doc.title} 
            type={doc.type} 
            date={doc.date} 
            onPush={() => handlePushDoc(i, doc.title, doc.type)}
            loading={pushingIdx === i}
          />
        ))}
      </div>
      
      {lastSync && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-5 bg-white border-2 border-green-500 rounded-xl shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <CheckCircle2 size={100} className="text-green-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 text-green-700 font-black text-lg mb-2">
              <CheckCircle2 size={24} />
              СИНХРОНИЗАЦИЯ ЗАВЕРШЕНА
            </div>
            <p className="text-gray-700 text-sm mb-4 font-medium leading-relaxed">
              {lastSync.message}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-2 rounded border border-gray-100">
                <div className="text-[10px] text-gray-400 uppercase font-black mb-1">ID Объекта</div>
                <div className="font-mono text-xs font-bold text-[#2c4a7c]">{lastSync.doc_id}</div>
              </div>
              {lastSync.reg_number && (
                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                  <div className="text-[10px] text-blue-400 uppercase font-black mb-1">Рег. Номер</div>
                  <div className="font-mono text-xs font-bold text-blue-700">{lastSync.reg_number}</div>
                </div>
              )}
              <div className="bg-gray-50 p-2 rounded border border-gray-100">
                <div className="text-[10px] text-gray-400 uppercase font-black mb-1">Время отклика</div>
                <div className="font-mono text-xs font-bold text-gray-600">
                  {lastSync.sync_time || lastSync.created_at ? format(new Date(lastSync.sync_time || lastSync.created_at), 'HH:mm:ss') : '—'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mt-8 flex gap-4">
        <button className="px-6 py-2 bg-[#4a6fa5] text-white rounded font-bold">Сформировать полный комплект</button>
        <button 
          onClick={handleSyncToDo}
          disabled={syncing || pushingIdx !== null}
          className="px-6 py-2 border border-[#4a6fa5] text-[#4a6fa5] rounded font-bold flex items-center gap-2 disabled:opacity-50"
        >
          {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
          Sync to 1C:DO
        </button>
      </div>
    </Card>
  );
}

function DocCard({ title, type, date, onPush, loading }: any) {
  return (
    <div className="p-4 border rounded hover:shadow-md transition-all group relative bg-white">
      <div className="flex items-start gap-4 mb-3">
        <div className={cn(
          "w-10 h-10 rounded flex items-center justify-center shrink-0",
          type === 'DOCX' ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
        )}>
          <FileText size={20} />
        </div>
        <div>
          <div className="font-bold text-sm line-clamp-2 leading-tight mb-1">{title}</div>
          <div className="text-[10px] text-gray-400 uppercase font-bold">{type} • {date}</div>
        </div>
      </div>
      
      <button 
        onClick={onPush}
        disabled={loading}
        className="w-full py-1.5 border border-[#4a6fa5] text-[#4a6fa5] text-[10px] font-bold uppercase rounded hover:bg-[#4a6fa5] hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        Передать в 1С:ДО
      </button>
    </div>
  );
}

function CoreTab({ procurements, onProcess }: any) {
  const analyzed = procurements.filter((p: any) => p.processing_status === 'completed');
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard label="Всего закупок" value={procurements.length} icon={<Database size={20} />} />
        <StatsCard label="Анализ завершен" value={analyzed.length} icon={<CheckCircle2 size={20} />} />
        <StatsCard label="Высокий риск" value={analyzed.filter((p: any) => p.processing_result.risk === 'high').length} icon={<AlertCircle size={20} />} color="text-red-500" />
        <StatsCard label="На ревизии" value={analyzed.filter((p: any) => p.processing_result.decision === 'REVIEW').length} icon={<Clock size={20} />} color="text-yellow-500" />
      </div>

      <Card title="ИИ-Оркестратор: Очередь анализа">
        <div className="space-y-2">
          {procurements.filter((p: any) => p.processing_status !== 'completed').map((p: any) => (
            <div key={p.id} className="p-3 border rounded flex justify-between items-center group bg-white">
              <div className="flex gap-4 items-center">
                <div className={cn("w-2 h-2 rounded-full", p.processing_status === 'processing' ? "bg-blue-500 animate-pulse" : "bg-gray-300")} />
                <div>
                  <div className="font-bold text-xs">{p.subject}</div>
                  <div className="text-[10px] text-gray-400 uppercase">{p.processing_status}</div>
                </div>
              </div>
              <button 
                onClick={() => onProcess(p.id)}
                disabled={p.processing_status === 'processing'}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[#4a6fa5] text-white rounded"
              >
                <Play size={16} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analyzed.slice(0, 4).map((p: any) => (
          <Card key={p.id} className="border-l-4 border-l-[#4a6fa5]">
            <div className="flex justify-between items-start mb-2">
              <div className="font-bold text-sm text-[#2c4a7c]">{p.subject}</div>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                p.processing_result.decision === 'GO' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {p.processing_result.decision}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-3">{p.processing_result.summary}</p>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-400">{format(new Date(p.updated_at), 'dd.MM.yyyy HH:mm')}</span>
              <button className="text-[10px] font-bold text-[#4a6fa5] uppercase hover:underline">Подробнее</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="text-gray-400">{icon}</div>
        <div className={cn("text-2xl font-black", color || "text-[#2c4a7c]")}>{value}</div>
      </div>
      <div className="text-[11px] font-bold text-gray-500 uppercase">{label}</div>
    </div>
  );
}

function OneCTab({ procurement }: { procurement: Partial<Procurement> }) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/1c/status`).then(r => r.json()).then(setStatus);
  }, []);

  const handleSync = async (type: 'erp' | 'do') => {
    setLoading(type);
    setResult(null);
    try {
      const endpoint = type === 'erp' ? '/api/v1/1c/do/sync' : '/api/v1/1c/do/sync'; // Simulation uses same mock logic
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ procurementId: procurement.id })
      });
      setResult(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleCreateTask = async () => {
    setLoading('task');
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/1c/do/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ procurementId: procurement.id, task_type: "Согласование" })
      });
      setResult(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  if (!status) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-6">
        <Card title="Статус интеграции">
          <div className="space-y-4">
            <SystemStatus label="1C:БГУ" active={status.bgu === 'connected'} />
            <SystemStatus label="1C:ERP" active={status.erp === 'connected'} />
            <SystemStatus label="1C:ДО" active={status.do === 'connected'} />
          </div>
          <div className="mt-6 pt-4 border-t text-[11px] text-blue-600 bg-blue-50 p-2 rounded">
            Используется режим имитации (MOCK). Прямое подключение к серверу 1C отключено.
          </div>
        </Card>
        
        <Card title="Бюджетные лимиты">
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Доступно:</span>
              <span className="font-bold text-green-600">5 000 000 ₽</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Зарезервировано:</span>
              <span className="font-bold text-yellow-600">1 200 000 ₽</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full mt-2">
              <div className="w-[34%] h-full bg-blue-500 rounded-full" />
            </div>
          </div>
        </Card>
      </div>

      <div className="md:col-span-2 space-y-6">
        <Card title="Синхронизация данных">
          {!procurement.id ? (
            <div className="text-center py-20 text-gray-400">Выберите закупку для синхронизации с ERP/ДО</div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded border">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Связанная закупка:</div>
                <div className="font-bold text-lg">{procurement.subject}</div>
                <div className="text-sm text-gray-500">№ {procurement.id} | НМЦК: {new Intl.NumberFormat('ru-RU').format(procurement.nmck || 0)} ₽</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleSync('erp')}
                  disabled={!!loading}
                  className="p-4 border rounded hover:border-[#4a6fa5] bg-white transition-all flex flex-col items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {loading === 'erp' ? <Loader2 size={24} className="animate-spin" /> : <Database size={24} className="text-[#4a6fa5] group-hover:scale-110 transition-transform" />}
                  <div className="font-bold text-xs uppercase text-center">Выгрузить в 1C:ERP</div>
                </button>
                <button 
                  onClick={handleCreateTask}
                  disabled={!!loading}
                  className="p-4 border rounded hover:border-[#4a6fa5] bg-white transition-all flex flex-col items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {loading === 'task' ? <Loader2 size={24} className="animate-spin" /> : <FileSearch size={24} className="text-[#4a6fa5] group-hover:scale-110 transition-transform" />}
                  <div className="font-bold text-xs uppercase text-center">Создать задачу в 1С:ДО</div>
                </button>
              </div>

              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 border border-green-100 rounded text-green-800"
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <CheckCircle2 size={16} />
                    Операция успешно завершена
                  </div>
                  <div className="text-[11px] opacity-80">
                    {result.message || `ID объекта: ${result.doc_id || result.task_id}`}
                    <br />
                    Исполнитель: {result.assignee || 'Система'}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function SystemStatus({ label, active }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="font-bold text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", active ? "bg-green-500" : "bg-red-500")} />
        <span className="text-[10px] uppercase font-bold text-gray-400">{active ? "OK" : "Error"}</span>
      </div>
    </div>
  );
}
