# Web Scraper

> *Turn the internet into a book, one page at a time.*

Welcome to the tool that saves you from copy-pasting text into Word documents until your fingers go numb. This little web app visits a website, grabs the text, cleans out the ads, finds the next few pages, and bundles it all into a neat, readable PDF.

### 🔗 **[Click Here to Use the App](https://webscraper-bice.vercel.app/)**

---

## 🕹️ How to Use It

1. **The URL:** Paste the link of the article or blog post you want to save.
   - *Good:* `https://cool-blog.com/chapter-1`
   - *Bad:* `https://facebook.com` (They won't let us in).
2. **The Filename:** What should we call the PDF?
3. **The Limit:** How many pages should we follow?
   - *Default is 5.*
   - *Warning:* If you type `100`, your browser might freeze, and your laptop fan might try to achieve liftoff. Keep it reasonable.
4. **Click "Scrape & Download"**: Watch the terminal log as it hunts down pages. When it's done, your PDF will download automatically.

## ✨ Features

* **Ad-Blocker Built-in:** It strips out sidebars, pop-ups, and "Sign up for our newsletter" banners. You just get the text.
* **Smart Formatting:** It automatically detects paragraphs and headers to make the PDF look like a real document, not a random wall of text.
* **Totally Free:** Runs on a $0 budget.

## 🚫 What It Can't Do (The "Don't Be That Guy" Section)

1. **It can't scrape "The Giants":** Amazon, Facebook, LinkedIn, and Google have armies of engineers designed to stop tools like this. It won't work there.
2. **It can't read "JavaScript-heavy" sites:** If a website is blank until you wait 5 seconds for it to load (looking at you, fancy modern web apps), this scraper might just see a blank page.
3. **It is not a magical archiver:** It runs **in your browser**. If you close the tab while it's working, it stops working.

## 📜 License

Use it freely. If you use this to pirate entire books, I saw nothing. 🙈
