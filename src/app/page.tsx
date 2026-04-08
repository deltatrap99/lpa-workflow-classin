"use client";

import { useState } from "react";
import { FiLink, FiDownload, FiCheckCircle, FiAlertCircle, FiLoader } from "react-icons/fi";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success && data.videoUrl) {
        setVideoUrl(data.videoUrl);
      } else {
        setError(data.error || "Could not extract video link. Ensure it is a valid ClassIn recording URL.");
      }
    } catch (err) {
      setError("An error occurred while connecting to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <div className="container">
        <h1>ClassIn Downloader</h1>
        <p className="subtitle">Paste your ClassIn video URL below to get the direct download link</p>

        <form onSubmit={handleDownload}>
          <div className="input-group">
            <span className="input-icon">
              <FiLink />
            </span>
            <input
              type="text"
              placeholder="https://www.eeo.cn/client/invoke/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading || !url}>
            {isLoading ? (
              <>
                <FiLoader className="spinner" /> Extracting Video...
              </>
            ) : (
              <>
                <FiDownload /> Get Download Link
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="error-message">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {videoUrl && (
          <div className="result-card">
            <h3>
              <FiCheckCircle /> Video Ready!
            </h3>
            <video controls className="video-preview" src={videoUrl} autoPlay muted></video>
            <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="btn-download" download>
              <FiDownload /> Download Video (MP4)
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
