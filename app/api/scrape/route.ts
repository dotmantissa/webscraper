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
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    let formattedText = '';
    
    if (article && article.content) {
      const $ = cheerio.load(article.content);
      
      // Define the block tags we care about
      const selector = 'h1, h2, h3, h4, h5, p, li, blockquote, pre';

      $(selector).each((_, element) => {
        const $el = $(element);

        // --- FIX FOR DUPLICATES ---
        // If this element is INSIDE another block we are already grabbing, skip it.
        // Example: Skip <p> if it's inside an <li>
        if ($el.parents(selector).length > 0) {
            return; 
        }

        let text = $el.text().replace(/\s+/g, ' ').trim();
        
        if (text.length > 0) {
          // Add bullet point for list items
          if (element.tagName === 'li') {
            text = '• ' + text;
          }
          // Uppercase Headers
          if (['h1', 'h2', 'h3'].includes(element.tagName)) {
             text = text.toUpperCase();
          }

          formattedText += text + '\n\n';
        }
      });
    }

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
      content: formattedText,
      links: Array.from(new Set(links)),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
