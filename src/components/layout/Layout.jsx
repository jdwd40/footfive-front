import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

