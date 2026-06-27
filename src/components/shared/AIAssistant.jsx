import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Mic, MicOff, Lightbulb, TrendingUp, Package, Users, Sparkles } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { fmt } from '../../utils/helpers';

// ─── LOCAL AI ENGINE (no API cost, pure JavaScript) ──────────────────────────
class LocalAI {
  constructor(data) {
    this.data = data;
  }

  answer(query) {
    const q = query.toLowerCase().trim();
    const { parts, customers, invoices, purchases, expenses, jobCards, stats } = this.data;

    // Greetings
    if (/^(hi|hello|hey|vanakkam)/i.test(q)) {
      return `👋 Hello! I'm your AutoSpares AI assistant. I can help you with:\n• Stock queries ("how many Swift brake pads?")\n• Business insights ("what's my best selling part?")\n• Customer info ("show Rajan Motors balance")\n• Reports ("today's sales")\n• Suggestions ("which parts to reorder?")\n\nWhat would you like to know?`;
    }

    // Today's sales
    if (q.includes("today") && (q.includes("sale") || q.includes("revenue"))) {
      const today = new Date().toISOString().split('T')[0];
      const todayInvs = invoices.filter(i => i.invoice_date === today);
      const todaySales = todayInvs.reduce((s,i)=>s+i.grand_total,0);
      return `📊 **Today's Summary**\n• Invoices: ${todayInvs.length}\n• Revenue: ${fmt(todaySales)}\n• Collected: ${fmt(todayInvs.filter(i=>i.status==='paid').reduce((s,i)=>s+i.grand_total,0))}\n• Pending: ${fmt(todayInvs.filter(i=>i.status!=='paid').reduce((s,i)=>s+i.balance_due,0))}`;
    }

    // Total sales / month
    if (q.includes("total sale") || q.includes("month sale") || q.includes("revenue")) {
      const total = invoices.reduce((s,i)=>s+i.grand_total,0);
      return `💰 **Total Revenue**: ${fmt(total)}\n• ${invoices.length} invoices\n• Collected: ${fmt(invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.grand_total,0))}\n• Outstanding: ${fmt(invoices.filter(i=>i.status!=='paid').reduce((s,i)=>s+i.balance_due,0))}`;
    }

    // Low stock / reorder
    if (q.includes("low stock") || q.includes("reorder") || q.includes("shortage")) {
      const low = parts.filter(p=>p.stock<=p.reorder_level&&p.stock>0);
      const out = parts.filter(p=>p.stock===0);
      if (out.length + low.length === 0) return "✅ Great news! All parts are adequately stocked. No reorder needed right now.";
      let msg = `⚠️ **Stock Alert:**\n\n`;
      if (out.length > 0) msg += `**Out of Stock (${out.length} items):**\n${out.slice(0,5).map(p=>`• ${p.name} (${p.code})`).join('\n')}\n\n`;
      if (low.length > 0) msg += `**Low Stock (${low.length} items):**\n${low.slice(0,5).map(p=>`• ${p.name} — ${p.stock} left (min: ${p.reorder_level})`).join('\n')}`;
      return msg;
    }

    // Best selling parts
    if (q.includes("best sell") || q.includes("top sell") || q.includes("fast moving")) {
      const partSales = {};
      invoices.forEach(inv => (inv.items||[]).forEach(item => {
        partSales[item.part_name] = (partSales[item.part_name]||0) + item.qty;
      }));
      const sorted = Object.entries(partSales).sort((a,b)=>b[1]-a[1]).slice(0,5);
      if (sorted.length===0) return "Not enough sales data yet. Add invoices to see top selling parts.";
      return `🏆 **Top Selling Parts:**\n${sorted.map(([name,qty],i)=>`${i+1}. ${name} — ${qty} units sold`).join('\n')}\n\nThese are your fast-moving items. Keep stock well above reorder level for these.`;
    }

    // Dead stock / slow moving
    if (q.includes("dead stock") || q.includes("slow mov") || q.includes("no sale")) {
      const soldPartIds = new Set(invoices.flatMap(i=>(i.items||[]).map(x=>x.part_id)));
      const deadStock = parts.filter(p=>!soldPartIds.has(p.id)&&p.stock>0);
      if (deadStock.length===0) return "✅ No dead stock detected! All parts with stock have been sold at least once.";
      return `📦 **Dead Stock (${deadStock.length} items — no sales):**\n${deadStock.slice(0,6).map(p=>`• ${p.name} — ${p.stock} units @ ${fmt(p.purchase_price)} = ${fmt(p.stock*p.purchase_price)}`).join('\n')}\n\n💡 **Suggestion:** Consider:\n• Discounting these items\n• Returning to supplier\n• Bundle offers`;
    }

    // Customer balance/outstanding
    if (q.includes("outstanding") || q.includes("pending payment") || q.includes("due")) {
      const unpaid = invoices.filter(i=>i.status!=='paid');
      if (unpaid.length===0) return "✅ No outstanding payments! All invoices are cleared.";
      const total = unpaid.reduce((s,i)=>s+i.balance_due,0);
      return `💳 **Outstanding Payments:**\n• Total: ${fmt(total)}\n• ${unpaid.length} invoices pending\n\nTop pending:\n${unpaid.slice(0,5).map(i=>`• ${i.customer_name} — ${fmt(i.balance_due)} (${i.invoice_no})`).join('\n')}`;
    }

    // Profit analysis
    if (q.includes("profit") || q.includes("loss") || q.includes("p&l")) {
      const sales = invoices.reduce((s,i)=>s+i.taxable_amt,0);
      const cost = purchases.reduce((s,p)=>s+p.grand_total,0);
      const exp = expenses.reduce((s,e)=>s+e.amount,0);
      const gross = sales - cost;
      const net = gross - exp;
      const margin = sales>0?((net/sales)*100).toFixed(1):0;
      return `📈 **Profit & Loss Analysis:**\n• Net Sales: ${fmt(sales)}\n• Cost of Goods: ${fmt(cost)}\n• Gross Profit: ${fmt(gross)}\n• Total Expenses: ${fmt(exp)}\n• **Net Profit: ${fmt(net)}**\n• Profit Margin: ${margin}%\n\n${net>0?'✅ Your business is profitable!':'⚠️ Currently in loss. Review expenses and pricing.'}`;
    }

    // Stock value
    if (q.includes("stock value") || q.includes("inventory value")) {
      const value = parts.reduce((s,p)=>s+p.purchase_price*p.stock,0);
      return `📦 **Inventory Value:**\n• Total Stock Value: ${fmt(value)}\n• ${parts.length} unique parts\n• ${parts.reduce((s,p)=>s+p.stock,0)} total units in stock\n\n💡 This is based on purchase price. Selling value would be approximately ${fmt(parts.reduce((s,p)=>s+p.selling_price*p.stock,0))}`;
    }

    // Top customers
    if (q.includes("top customer") || q.includes("best customer")) {
      const custSales = {};
      invoices.forEach(i=>{ custSales[i.customer_name]=(custSales[i.customer_name]||0)+i.grand_total; });
      const sorted = Object.entries(custSales).sort((a,b)=>b[1]-a[1]).slice(0,5);
      return `⭐ **Top Customers by Revenue:**\n${sorted.map(([name,amt],i)=>`${i+1}. ${name} — ${fmt(amt)}`).join('\n')}`;
    }

    // Search specific part
    const partMatch = this.data.parts.find(p =>
      q.includes(p.name?.toLowerCase()) || q.includes(p.code?.toLowerCase())
    );
    if (partMatch) {
      return `🔍 **${partMatch.name}:**\n• Code: ${partMatch.code}\n• Brand: ${partMatch.brand}\n• Vehicle: ${partMatch.make} ${partMatch.model} ${partMatch.year_range}\n• Purchase Price: ${fmt(partMatch.purchase_price)}\n• Selling Price: ${fmt(partMatch.selling_price)}\n• MRP: ${fmt(partMatch.mrp)}\n• **Stock: ${partMatch.stock} ${partMatch.unit}**\n• HSN: ${partMatch.hsn_code}\n• GST: ${partMatch.gst_rate}%\n• Location: ${partMatch.location||'Not set'}`;
    }

    // Business health score
    if (q.includes("health") || q.includes("business score") || q.includes("how is my")) {
      const lowStockPct = parts.length>0?(parts.filter(p=>p.stock<=p.reorder_level).length/parts.length)*100:0;
      const collectionRate = invoices.length>0?(invoices.filter(i=>i.status==='paid').length/invoices.length)*100:100;
      const score = Math.round((100-lowStockPct)*0.3 + collectionRate*0.4 + 30);
      const grade = score>=80?'A':score>=65?'B':score>=50?'C':'D';
      return `🏥 **Business Health Score: ${score}/100 (Grade: ${grade})**\n\n📊 Breakdown:\n• Payment collection: ${collectionRate.toFixed(0)}%\n• Stock health: ${(100-lowStockPct).toFixed(0)}%\n• Outstanding: ${fmt(invoices.filter(i=>i.status!=='paid').reduce((s,i)=>s+i.balance_due,0))}\n\n${grade==='A'?'🟢 Excellent! Business is doing great.':grade==='B'?'🟡 Good. Some areas to improve.':'🔴 Needs attention. Focus on collections and stock.'}`;
    }

    // GST summary
    if (q.includes("gst") || q.includes("tax")) {
      const totalGst = invoices.reduce((s,i)=>s+i.total_gst,0);
      const cgst = invoices.reduce((s,i)=>s+i.cgst_amt,0);
      const sgst = invoices.reduce((s,i)=>s+i.sgst_amt,0);
      return `🧾 **GST Summary:**\n• Total Tax Collected: ${fmt(totalGst)}\n• CGST: ${fmt(cgst)}\n• SGST: ${fmt(sgst)}\n\n💡 Go to Reports → GSTR-1 to export for GST filing on the portal.\nGSTR-1 due: 11th of next month.`;
    }

    // AI suggestions
    if (q.includes("suggest") || q.includes("advice") || q.includes("tip") || q.includes("what should")) {
      const suggestions = [];
      if (parts.filter(p=>p.stock===0).length>0) suggestions.push(`• Restock ${parts.filter(p=>p.stock===0).length} out-of-stock items immediately`);
      if (invoices.filter(i=>i.status==='unpaid').length>0) suggestions.push(`• Follow up on ${invoices.filter(i=>i.status==='unpaid').length} unpaid invoices`);
      if (expenses.length<2) suggestions.push(`• Track your expenses to get accurate P&L report`);
      suggestions.push(`• Run GSTR-1 export from Reports before 11th of next month`);
      suggestions.push(`• Take a data backup from Admin → Backup`);
      return `💡 **AI Suggestions for Today:**\n${suggestions.join('\n')}`;
    }

    // Help
    if (q.includes("help") || q.includes("what can") || q.includes("commands")) {
      return `🤖 **I can answer questions like:**\n\n📊 Sales: "today's sales", "total revenue", "outstanding"\n📦 Stock: "low stock", "dead stock", "best sellers"\n👥 Customers: "top customers", "who owes money"\n📈 Finance: "profit", "P&L", "GST summary"\n🔍 Parts: "brake pad Swift" (search any part)\n💡 "Give me suggestions", "business health"\n\n**Just type naturally in English or Tamil!**`;
    }

    return `🤔 I didn't quite understand "${query}".\n\nTry asking:\n• "today's sales"\n• "low stock items"\n• "outstanding payments"\n• "profit analysis"\n• "top selling parts"\n• Type "help" for all commands`;
  }
}

// ─── VOICE INPUT ──────────────────────────────────────────────────────────────
function useVoice(onResult) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const start = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Try Chrome.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.onresult = (e) => onResult(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  const stop = () => { recRef.current?.stop(); setListening(false); };
  return { listening, start, stop };
}

// ─── QUICK INSIGHTS BAR ──────────────────────────────────────────────────────
function QuickInsights({ data }) {
  const { parts, invoices, expenses } = data;
  const sales = invoices.reduce((s,i)=>s+i.grand_total,0);
  const cost = invoices.reduce((s,i)=>s+i.taxable_amt,0)*0.65;
  const profit = sales - cost - expenses.reduce((s,e)=>s+e.amount,0);
  const lowCount = parts.filter(p=>p.stock<=p.reorder_level).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
      {[
        { label: 'Revenue', val: fmt(sales), icon: '💰', color: 'text-orange-400' },
        { label: 'Est. Profit', val: fmt(profit), icon: '📈', color: profit>=0?'text-green-400':'text-red-400' },
        { label: 'Stock Alerts', val: lowCount, icon: '⚠️', color: 'text-yellow-400' },
        { label: 'Pending Due', val: fmt(invoices.filter(i=>i.status!=='paid').reduce((s,i)=>s+i.balance_due,0)), icon: '⏰', color: 'text-red-400' },
      ].map(s=>(
        <div key={s.label} className="bg-gray-800/60 rounded-xl px-3 py-2.5 border border-gray-700/50">
          <div className="text-lg mb-0.5">{s.icon}</div>
          <div className={`font-bold text-sm ${s.color}`}>{s.val}</div>
          <div className="text-gray-600 text-xs">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN AI COMPONENT ────────────────────────────────────────────────────────
export default function AIAssistant({ open, onClose }) {
  const appData = useApp();
  const [messages, setMessages] = useState([
    { role: 'ai', text: "👋 Hi! I'm your AutoSpares AI assistant. Ask me anything about your business — stock, sales, profits, GST, customers. No internet needed!\n\nType 'help' to see all I can do." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const ai = new LocalAI(appData);
  const { listening, start, stop } = useVoice((text) => setInput(text));

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text = input) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    // Small delay for UX
    await new Promise(r => setTimeout(r, 300));
    const reply = ai.answer(text);
    setMessages(m => [...m, { role: 'ai', text: reply }]);
    setLoading(false);
  };

  const QUICK_QUERIES = ["Low stock items", "Today's sales", "Outstanding payments", "Top selling parts", "Profit analysis", "GST summary"];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}/>
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl" style={{height:'82vh', maxHeight:640}}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <div className="w-8 h-8 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <Sparkles size={16} className="text-orange-400"/>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">AI Business Assistant</p>
            <p className="text-gray-500 text-xs">Powered locally — no API cost</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-500 hover:text-white"><X size={16}/></button>
        </div>

        {/* Quick insights */}
        <div className="px-4 pt-3 flex-shrink-0">
          <QuickInsights data={appData}/>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role==='user'?'justify-end':''}`}>
              <div className={`max-w-[88%] px-3 py-2.5 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
                m.role==='user'
                  ? 'bg-orange-500 text-white rounded-br-sm'
                  : 'bg-gray-800 text-gray-200 rounded-bl-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex">
              <div className="bg-gray-800 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  {[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Quick queries */}
        <div className="px-4 py-2 flex gap-1.5 overflow-x-auto flex-shrink-0">
          {QUICK_QUERIES.map(q=>(
            <button key={q} onClick={()=>send(q)} className="whitespace-nowrap text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1.5 rounded-full transition-colors border border-gray-700">{q}</button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 pb-4 flex-shrink-0">
          <div className="flex gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 focus-within:border-orange-500 transition-colors">
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
              placeholder="Ask about stock, sales, GST..."
              className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-600"/>
            <button onClick={listening?stop:start} className={`${listening?'text-red-400':'text-gray-500 hover:text-gray-300'} transition-colors`}>
              {listening?<MicOff size={16}/>:<Mic size={16}/>}
            </button>
            <button onClick={()=>send()} disabled={!input.trim()}
              className="text-orange-400 hover:text-orange-300 disabled:text-gray-600 transition-colors">
              <Send size={16}/>
            </button>
          </div>
          {listening && <p className="text-red-400 text-xs text-center mt-1 animate-pulse">🎤 Listening... speak now</p>}
        </div>
      </div>
    </div>
  );
}
