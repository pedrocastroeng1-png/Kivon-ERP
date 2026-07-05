import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from './ui/Button';

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-kivon-card border border-white/10 shadow-2xl flex flex-col gap-3 max-w-sm">
      <div className="text-sm text-gray-200">
        {offlineReady
          ? <span>Aplicativo pronto para uso offline.</span>
          : <span>Nova atualização disponível! Clique para atualizar e usar a versão mais recente.</span>}
      </div>
      <div className="flex gap-2">
        {needRefresh && (
          <Button size="sm" onClick={() => updateServiceWorker(true)}>
            Atualizar Agora
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => close()}>
          Fechar
        </Button>
      </div>
    </div>
  )
}
