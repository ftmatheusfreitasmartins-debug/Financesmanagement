import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Finance Manager - Gerencie suas Finanças',
  description: 'Sistema completo de gestão financeira pessoal com autenticação segura',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Netlify Identity Widget - Carrega antes de tudo */}
        <Script 
          src="https://identity.netlify.com/v1/netlify-identity-widget.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        {children}
        
        {/* Script de inicialização do Netlify Identity */}
        <Script id="netlify-identity-init" strategy="afterInteractive">
          {`
            if (window.netlifyIdentity) {
              window.netlifyIdentity.on("init", user => {
                if (!user) {
                  window.netlifyIdentity.on("login", () => {
                    document.location.href = "/";
                  });
                }
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
