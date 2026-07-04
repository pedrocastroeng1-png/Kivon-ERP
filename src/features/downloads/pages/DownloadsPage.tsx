import React, { useEffect, useState } from 'react';
import { Download, Apple, Smartphone, Info } from 'lucide-react';
import { Button } from '@/src/shared/components/ui/Button';

export default function DownloadsPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("Seu navegador não suporta a instalação direta ou o app já está instalado.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-kivon-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Aplicativo Mobile</h1>
          <p className="mt-2 text-sm text-kivon-text-sec">
            Instale o KIVON ERP no seu celular para uma experiência nativa.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Android Section */}
        <div className="rounded-xl bg-kivon-card border border-kivon-border shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-white/20">
          <div className="px-6 py-4 border-b border-kivon-border flex items-center gap-3">
            <Smartphone className="h-6 w-6 text-kivon-primary" />
            <h2 className="text-lg font-semibold text-white">Android</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-kivon-text-sec text-sm">
              Para instalar no Android, você pode adicionar o aplicativo diretamente à tela inicial ou baixar o arquivo APK.
            </p>
            
            <div className="pt-4 space-y-3">
              <Button onClick={handleInstallClick} className="w-full bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20" disabled={!deferredPrompt}>
                <Download className="mr-2 h-4 w-4" /> Instalar Aplicativo (PWA)
              </Button>
              
              <Button variant="secondary" className="w-full text-white bg-transparent border border-kivon-border hover:bg-kivon-hover" onClick={() => alert("Geração de APK pelo Capacitor configurada. O build deve ser gerado pelo Android Studio e disponibilizado aqui.")}>
                <Download className="mr-2 h-4 w-4" /> Baixar APK (.apk)
              </Button>
            </div>
          </div>
        </div>

        {/* iPhone Section */}
        <div className="rounded-xl bg-kivon-card border border-kivon-border shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-white/20">
          <div className="px-6 py-4 border-b border-kivon-border flex items-center gap-3">
            <Apple className="h-6 w-6 text-white" />
            <h2 className="text-lg font-semibold text-white">iPhone (iOS)</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-kivon-text-sec text-sm">
              Para instalar o KIVON ERP no seu iPhone, siga os passos abaixo no <strong className="text-white">Safari</strong>:
            </p>
            
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-kivon-bg border border-kivon-border text-kivon-primary font-bold shrink-0">1</div>
                <p className="text-sm text-kivon-text pt-1">Toque no ícone de <strong className="text-white">Compartilhar</strong> na barra inferior do Safari.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-kivon-bg border border-kivon-border text-kivon-primary font-bold shrink-0">2</div>
                <p className="text-sm text-kivon-text pt-1">Role para baixo e selecione <strong className="text-white">Adicionar à Tela de Início</strong>.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-kivon-bg border border-kivon-border text-kivon-primary font-bold shrink-0">3</div>
                <p className="text-sm text-kivon-text pt-1">Confirme tocando em <strong className="text-white">Adicionar</strong> no canto superior direito.</p>
              </div>
            </div>

            <div className="mt-4 bg-kivon-primary/10 p-4 rounded-md flex items-start gap-3 border border-kivon-primary/20">
              <Info className="h-5 w-5 text-kivon-primary shrink-0 mt-0.5" />
              <p className="text-xs text-kivon-primary">
                O aplicativo funcionará em tela cheia, com suporte offline e acesso à câmera, como um app nativo.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
