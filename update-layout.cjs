const fs = require('fs');
let content = fs.readFileSync('src/shared/components/layout/AppLayout.tsx', 'utf8');

if (!content.includes('import { SmartCenterDrawer }')) {
  content = content.replace(
    "import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';",
    "import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';\nimport { SmartCenterDrawer } from '@/src/features/smart-center/components/SmartCenterDrawer';\nimport { useSmartCenter } from '@/src/features/smart-center/hooks/useSmartCenter';"
  );
  
  content = content.replace(
    'const [isOffline, setIsOffline] = useState(!navigator.onLine);',
    'const [isOffline, setIsOffline] = useState(!navigator.onLine);\n  const [isSmartCenterOpen, setIsSmartCenterOpen] = useState(false);\n  const { unreadCount } = useSmartCenter();'
  );
  
  // Replace the Bell button
  const bellButton = `<button type="button" className="p-2 text-kivon-text-sec hover:text-white transition-colors relative hidden sm:block">
                <span className="absolute top-2 right-2 block h-1.5 w-1.5 rounded-full bg-kivon-primary ring-2 ring-kivon-bg" />
                <Bell className="h-5 w-5" />
              </button>`;
              
  const newBellButton = `<button type="button" onClick={() => setIsSmartCenterOpen(true)} className="p-2 text-kivon-text-sec hover:text-white transition-colors relative hidden sm:block">
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 ring-2 ring-kivon-bg text-[9px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                <Bell className="h-5 w-5" />
              </button>`;
              
  content = content.replace(bellButton, newBellButton);
  
  // Also replace mobile bell button if it exists
  const mobileBell = `<button type="button" className="p-2 text-kivon-text-sec lg:hidden hover:text-white">`;
  // wait, the mobile menu is handled differently, it just opens the sidebar, there isn't a mobile bell icon in header right now, it's hidden sm:block
  // Actually, I can just change it to be visible everywhere if I want, but I'll stick to the current design.
  
  // Add the drawer to the bottom of the component
  content = content.replace(
    '<ReloadPrompt />\n    </div>',
    '<ReloadPrompt />\n      <SmartCenterDrawer isOpen={isSmartCenterOpen} onClose={() => setIsSmartCenterOpen(false)} />\n    </div>'
  );

  fs.writeFileSync('src/shared/components/layout/AppLayout.tsx', content);
}
