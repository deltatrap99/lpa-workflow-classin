import { NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

// Vercel serverless functions default config
export const maxDuration = 30; // Max execution time for Vercel Hobby

export async function POST(req: Request) {
  let browser;
  try {
    const { url } = await req.json();

    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ success: false, error: "Invalid URL provided." }, { status: 400 });
    }

    // Launch puppeteer optimized for serverless functions
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    
    const page = await browser.newPage();
    let videoUrl: string | null = null;

    page.on('response', async (response) => {
      const respUrl = response.url();
      if ((respUrl.includes('.mp4') || respUrl.includes('.m3u8')) && !videoUrl) {
        videoUrl = respUrl;
      }
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });

    if (!videoUrl) {
      videoUrl = await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video && video.src) return video.src;
        
        const source = document.querySelector('video source');
        if (source && (source as HTMLSourceElement).src) return (source as HTMLSourceElement).src;
        
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
        { success: false, error: "No video link found on the provided page. The video might be protected." },
        { status: 404 }
      );
    }
  } catch (error: any) {
    if (browser) await browser.close();
    console.error("Puppeteer Scraper Error:", error.message);
    return NextResponse.json(
      { success: false, error: "Failed to fetch the URL. Serverless function might have timed out." },
      { status: 500 }
    );
  }
}
