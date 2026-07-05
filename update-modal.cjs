const fs = require('fs');
let content = fs.readFileSync('src/shared/components/ui/Modal.tsx', 'utf8');

content = content.replace(
  'items-center justify-center overflow-y-auto overflow-x-hidden bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200',
  'sm:items-center justify-center items-end overflow-y-auto overflow-x-hidden bg-black/80 backdrop-blur-sm sm:p-4 p-0 animate-in fade-in duration-200'
);

content = content.replace(
  'className={cn("relative w-full max-w-md rounded-xl bg-kivon-card border border-kivon-border shadow-2xl scale-in-center duration-200", className)}',
  'className={cn("relative w-full max-w-md bg-kivon-card border border-kivon-border shadow-2xl rounded-t-2xl sm:rounded-xl duration-200 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95", className)}'
);

// Add pb-8 to the inner content for safe area on mobile
content = content.replace(
  '<div className="p-6">',
  '<div className="p-6 pb-12 sm:pb-6 max-h-[80vh] overflow-y-auto">'
);

fs.writeFileSync('src/shared/components/ui/Modal.tsx', content);
