import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) throw new Error(`Failed to fetch`);

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    
    // Clean content
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    // Find links
    const $ = cheerio.load(html);
    const links: string[] = [];
    const baseUrlObj = new URL(url);

    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          const full = new URL(href, url).toString();
          if (new URL(full).hostname === baseUrlObj.hostname) links.push(full);
        } catch (e) {}
      }
    });

    return NextResponse.json({
      title: article?.title || 'No Title',
      content: article?.textContent || '',
      links: [...new Set(links)],
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
