import './globals.css';

export const metadata = {
  title: 'Video Motivasi Hutan & Sungai',
  description: 'Generator video kata-kata motivasi berlatar hutan dan sungai yang damai.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
