import { HTMLAttributes, ReactNode } from 'react';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  caption?: string;
}

export const Table = ({ children, caption, ...props }: TableProps) => {
  return (
    <div className="my-10 overflow-x-auto w-full">
      <table className="w-full text-left border-collapse text-[16px] md:text-[18px]" {...props}>
        {caption && (
          <caption className="text-[11px] font-mono text-primary/60 tracking-wider uppercase mb-3 text-left select-none">
            {caption}
          </caption>
        )}
        {children}
      </table>
    </div>
  );
};

export const Th = ({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) => {
  return (
    <th className="py-3 px-4 font-normal uppercase text-xs tracking-widest text-primary border-b border-border" {...props}>
      {children}
    </th>
  );
};

export const Td = ({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) => {
  return (
    <td className="py-3 px-4 font-light border-b border-border border-dashed last:border-0" {...props}>
      {children}
    </td>
  );
};
