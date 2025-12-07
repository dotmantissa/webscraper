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
    const dom = new JSDOM(html, { url });
    
    // 2. Parse with Readability
    // We get the HTML content now, not just text, so we can preserve structure
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    // 3. Format Text Manually with Cheerio
    let formattedText = '';
    
    if (article && article.content) {
      // Load the "clean" HTML from Readability into Cheerio
      const $ = cheerio.load(article.content);
      
      // Select block elements that should trigger a new line
      $('h1, h2, h3, h4, h5, p, li, blockquote, pre').each((_, element) => {
        let text = $(element).text().trim();
        
        if (text.length > 0) {
          // Add bullet point for list items
          if (element.tagName === 'li') {
            text = '• ' + text;
          }
          // Add a "Label" for headers so they stand out in the text
          if (['h1', 'h2', 'h3'].includes(element.tagName)) {
             text = text.toUpperCase();
          }

          // Force TWO newlines after every block
          formattedText += text + '\n\n';
        }
      });
    }

    // 4. Find Links (Standard logic)
    const $original = cheerio.load(html);
    const links: string[] = [];
    const baseUrlObj = new URL(url);

    $original('a').each((_, element) => {
      const href = $original(element).attr('href');
      if (href) {
        try {
          const fullUrl = new URL(href, url).toString();
          if (new URL(fullUrl).hostname === baseUrlObj.hostname) {
            links.push(fullUrl);
          }
        } catch (e) {}
      }
    });

    return NextResponse.json({
      title: article?.title || 'No Title',
      content: formattedText, // Now contains explicit \n\n breaks
      links: Array.from(new Set(links)),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
