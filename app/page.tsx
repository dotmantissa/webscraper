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
          if (data.content?.length > 100) {
            results.push({ url: current, title: data.title, content: data.content });
            visited.add(current);
            log(`✅ Got: ${data.title.slice(0, 20)}...`);
            
            data.links.forEach((l: string) => {
              if (!visited.has(l)) queue.push(l);
            });
          }
        } else {
          log(`❌ Error fetching page`);
        }
        
        await new Promise(r => setTimeout(r, 500)); // Be polite
      }

      log(`💾 Generating PDF...`);
      createPDF(results);

    } catch (e) {
      log('❌ Critical Error');
    }
    setLoading(false);
  };

  const createPDF = (pages: PageData[]) => {
    const doc = new jsPDF();
    const margin = 10;
    const width = doc.internal.pageSize.getWidth() - (margin * 2);
    let y = 10;

    pages.forEach((p, i) => {
      if (i > 0) { doc.addPage(); y = 10; }
      
      doc.setFontSize(16).setFont('helvetica', 'bold');
      const title = doc.splitTextToSize(p.title, width);
      doc.text(title, margin, y);
      y += (title.length * 7) + 5;

      doc.setFontSize(10).setTextColor(100);
      doc.text(p.url, margin, y);
      y += 10;

      doc.setFontSize(12).setTextColor(0).setFont('helvetica', 'normal');
      const text = p.content.replace(/\n\s*\n/g, '\n\n');
      const lines = doc.splitTextToSize(text, width);
      
      lines.forEach((line: string) => {
        if (y > 280) { doc.addPage(); y = 10; }
        doc.text(line, margin, y);
        y += 6;
      });
    });

    doc.save(`${filename}.pdf`);
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-900">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-6">Web Scraper -> PDF</h1>
        
        <div className="space-y-4">
          <input 
            className="w-full p-2 border rounded"
            placeholder="Start URL (e.g. https://example.com)"
            value={url} onChange={e => setUrl(e.target.value)}
          />
          <div className="flex gap-2">
            <input 
              className="flex-1 p-2 border rounded"
              placeholder="Filename"
              value={filename} onChange={e => setFilename(e.target.value)}
            />
            <input 
              type="number"
              className="w-20 p-2 border rounded"
              value={max} onChange={e => setMax(+e.target.value)}
            />
          </div>
          
          <button 
            onClick={run} disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Working...' : 'Scrape & Download'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-black text-green-400 font-mono text-xs h-48 overflow-auto rounded">
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    </main>
  );
}
