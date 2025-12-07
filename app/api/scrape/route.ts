import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 1. Fetch the HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyScraper/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const html = await response.text();

    // 2. Parse with Readability (to get clean text)
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    // 3. Parse with Cheerio (to find other links)
    const $ = cheerio.load(html);
    const links: string[] = [];
    const baseUrlObj = new URL(url);

    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        try {
          // Resolve relative URLs
          const fullUrl = new URL(href, url).toString();
          // Only keep links from the same domain
          if (new URL(fullUrl).hostname === baseUrlObj.hostname) {
            links.push(fullUrl);
          }
        } catch (e) {
          // Ignore invalid URLs
        }
      }
    });

    return NextResponse.json({
      title: article?.title || 'No Title',
      content: article?.textContent || '', 
      // FIX IS HERE: Use Array.from instead of ...spread
      links: Array.from(new Set(links)),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
