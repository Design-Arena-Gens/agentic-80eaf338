'use client';

import VideoGenerator from '../components/VideoGenerator';

export default function Page() {
  return (
    <div className="container">
      <h1>Video Motivasi: Hutan & Sungai</h1>
      <p className="tagline">Buat video kata-kata motivasi dengan latar hutan dan sungai yang damai.</p>
      <VideoGenerator />
      <footer className="footer">? {new Date().getFullYear()} Video Motivasi</footer>
    </div>
  );
}
