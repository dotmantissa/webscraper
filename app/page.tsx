'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';

type PageData = { url: string; title: string; content: string };

export default function Home() {
  const [url, setUrl] = useState('');
  const [filename, setFilename] = useState('scraped-doc');
  const [max, setMax] = useState(5);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const log = (msg: string) => setLogs(p => [...p, msg]);

  const run = async () => {
    if (!url) return;
    setLoading(true);
    setLogs([]);
    
    const results: PageData[] = [];
    const queue = [url];
    const visited = new Set<string>();

    log(`🚀 Starting...`);

    try {
      while (queue.length && visited.size < max) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;

        log(`Processing: ${current}`);
        
        const res = await fetch('/api/scrape', {
          method: 'POST',
          body: JSON.stringify({ url: current }),
        });

        if (res.ok) {
          const data = await res.json();
          // Logic: If content is empty or super short, skip it
          if (data.content && data.content.length > 50) {
            results.push({ url: current, title: data.title, content: data.content });
            visited.add(current);
            log(`✅ Saved: ${data.title.slice(0, 20)}...`);
            
            data.links.forEach((l: string) => {
              if (!visited.has(l)) queue.push(l);
            });
          }
        } else {
          log(`❌ Error fetching page`);
        }
        
        await new Promise(r => setTimeout(r, 500)); 
      }

      log(`💾 Generating PDF...`);
      createPDF(results);

    } catch (e) {
      log('❌ Critical Error');
      console.error(e);
    }
    setLoading(false);
  };

  const createPDF = (pages: PageData[]) => {
    const doc = new jsPDF();
    
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (margin * 2);
    const centerX = pageWidth / 2;

    let y = margin;

    pages.forEach((p, i) => {
      // New Page for each article (except the first)
      if (i > 0) { 
        doc.addPage(); 
        y = margin; 
      }
      
      // --- HEADER ---
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      
      const titleLines = doc.splitTextToSize(p.title, contentWidth);
      doc.text(titleLines, centerX, y, { align: 'center' });
      y += (titleLines.length * 8) + 2;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(p.url, centerX, y, { align: 'center' });
      y += 10;

      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 15;

      // --- BODY ---
      doc.setFontSize(11); 
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      // Split the text by the explicit double-newlines we added in the backend
      const paragraphs = p.content.split('\n\n');

      paragraphs.forEach((paragraph) => {
        const cleanPara = paragraph.trim();
        if (!cleanPara) return;

        // Detect if this is a header (we uppercased headers in backend)
        const isHeader = cleanPara === cleanPara.toUpperCase() && cleanPara.length < 100 && !cleanPara.startsWith('•');
        
        if (isHeader) {
            doc.setFont('helvetica', 'bold');
            y += 4; // Extra space before header
        } else {
            doc.setFont('helvetica', 'normal');
        }

        const lines = doc.splitTextToSize(cleanPara, contentWidth);
        const paragraphHeight = lines.length * 5; // 5 is line height
        
        // Page Break Check
        if (y + paragraphHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        doc.text(lines, margin, y);
        y += paragraphHeight + 5; // 5 is the space BETWEEN paragraphs
      });
    });

    const safeFilename = filename.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    doc.save(`${safeFilename}.pdf`);
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-900">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-6">Web Scraper &rarr; PDF</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Target URL</label>
            <input 
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="https://..."
              value={url} onChange={e => setUrl(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">File Name</label>
              <input 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={filename} onChange={e => setFilename(e.target.value)}
              />
            </div>
            
            <div className="w-24">
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Limit</label>
              <input 
                type="number"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={max} onChange={e => setMax(+e.target.value)}
              />
            </div>
          </div>
          
          <button 
            onClick={run} disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Working...' : 'Scrape & Download PDF'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-900 text-green-400 font-mono text-xs h-48 overflow-y-auto rounded shadow-inner">
          {logs.length === 0 && <span className="text-gray-600">Waiting for input...</span>}
          {logs.map((l, i) => <div key={i} className="mb-1">{l}</div>)}
        </div>
      </div>
    </main>
  );
}
