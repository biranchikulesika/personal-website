import { HTMLAttributes } from 'react';
import { AlertCircle, Info, Lightbulb, TriangleAlert } from 'lucide-react';

interface CalloutProps extends HTMLAttributes<HTMLDivElement> {
  type?: 'default' | 'info' | 'warning' | 'tip';
  title?: string;
}

export const Callout = ({ children, type = 'default', title, className, ...props }: CalloutProps) => {
  const getIcon = () => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning': return <TriangleAlert className="w-5 h-5 text-yellow-500" />;
      case 'tip': return <Lightbulb className="w-5 h-5 text-green-500" />;
      default: return <AlertCircle className="w-5 h-5 text-primary" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'info': return 'border-blue-500/50 bg-blue-500/10';
      case 'warning': return 'border-yellow-500/50 bg-yellow-500/10';
      case 'tip': return 'border-green-500/50 bg-green-500/10';
      default: return 'border-primary/50 bg-muted/50';
    }
  };

  return (
    <div className={`my-8 p-4 border rounded-lg flex items-start gap-4 ${getStyles()} ${className || ''}`} {...props}>
      <div className="flex-shrink-0 mt-1">
        {getIcon()}
      </div>
      <div className="flex-1 w-full min-w-0">
        {title && <h5 className="font-semibold font-sans m-0 mb-1">{title}</h5>}
        <div className="[&>p]:m-0 [&>p]:mb-2 last:[&>p]:mb-0 text-[0.95em] opacity-90 font-sans">
          {children}
        </div>
      </div>
    </div>
  );
};
