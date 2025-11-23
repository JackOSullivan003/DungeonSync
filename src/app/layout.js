import "./globals.css";
import FileSidebar from "./components/FileSidebar";

export const metadata = {
  title: 'Three Column Layout',
  description: 'will be moved to Dashboard after prototype',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header class="topbar">
          Topbar content here
        </header>

       <div className="layout-container">
          
          <aside className="left-sidebar">
            <FileSidebar />
          </aside>

          <main className="main-content">
            {children}
          </main>

          <aside className="right-sidebar">
            
          </aside>

        </div>
      </body>
    </html>
  )
}
