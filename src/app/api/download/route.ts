import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req: Request) {
  let browser;
  try {
    const { url } = await req.json();

    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ success: false, error: "Invalid URL provided." }, { status: 400 });
    }

    // Launch puppeteer to fully render the client-side app
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    let videoUrl: string | null = null;

    // Listen to network responses to catch media URLs, API payloads, or standard mp4 files
    page.on('response', async (response) => {
      const respUrl = response.url();
      if ((respUrl.includes('.mp4') || respUrl.includes('.m3u8')) && !videoUrl) {
        videoUrl = respUrl;
      }
    });

    // Wait until network is mostly idle to ensure JS has run
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Fallback: If not caught by intercept, look inside the DOM for <video>
    if (!videoUrl) {
      videoUrl = await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video && video.src) return video.src;
        
        const source = document.querySelector('video source');
        if (source && (source as HTMLSourceElement).src) return (source as HTMLSourceElement).src;
        
        return null;
      });
    }

    // Try finding via window variables if it's an eeo classin page
    if (!videoUrl) {
      videoUrl = await page.evaluate(() => {
        // Sometimes React apps window state holds the playback URL
        const html = document.body.innerHTML;
        const mp4Match = html.match(/https?:\/\/[^\s"'<>]+\.mp4/);
        return mp4Match ? mp4Match[0] : null;
      });
    }

    await browser.close();

    if (videoUrl) {
      return NextResponse.json({ success: true, videoUrl });
    } else {
      return NextResponse.json(
        { success: false, error: "No video link found on the provided page. The video might be protected, requires login, or uses a different format." },
        { status: 404 }
      );
    }
  } catch (error: any) {
    if (browser) await browser.close();
    console.error("Puppeteer Scraper Error:", error.message);
    return NextResponse.json(
      { success: false, error: "Failed to fetch the URL due to an internal scraper error or timeout." },
      { status: 500 }
    );
  }
}
