import React from 'react';
import Image from 'next/image';
import { GripVertical, Trash2, RefreshCw, UploadCloud } from 'lucide-react';

interface BlockListProps {
  composerBlocks: any[];
  selectedBlockId: string | null;
  focusedBlockId: string | null;
  slashMenuBlockId: string | null;
  slashCommands: { type: string; label: string; desc: string }[];
  setDraggingBlockIdx: (idx: number) => void;
  setDragOverBlockIdx: (idx: number) => void;
  handleBlocksReorder: (idx: number) => void;
  setSelectedBlockId: (id: string | null) => void;
  handleDeleteBlock: (id: string) => void;
  handleTriggerFilePicker: (idx: number) => void;
  handleUpdateBlockImageProps: (id: string, props: any) => void;
  handleTextareaChange: (id: string, value: string) => void;
  handleTextareaKeyDown: (e: React.KeyboardEvent, id: string, idx: number) => void;
  handleUpdateBlockContent: (id: string, value: string) => void;
  handleSelectSlashCommand: (id: string, type: string) => void;
}

export default function BlockList({
  composerBlocks,
  selectedBlockId,
  focusedBlockId,
  slashMenuBlockId,
  slashCommands,
  setDraggingBlockIdx,
  setDragOverBlockIdx,
  handleBlocksReorder,
  setSelectedBlockId,
  handleDeleteBlock,
  handleTriggerFilePicker,
  handleUpdateBlockImageProps,
  handleTextareaChange,
  handleTextareaKeyDown,
  handleUpdateBlockContent,
  handleSelectSlashCommand
}: BlockListProps) {
  return (
    <div className="space-y-4 pt-8 border-t border-[#141414] w-full flex-1">
      {composerBlocks.map((block, idx) => {
        const isSelected = selectedBlockId === block.id;

        return (
          <div 
            key={block.id}
            draggable
            onDragStart={() => setDraggingBlockIdx(idx)}
            onDragOver={(e) => { e.preventDefault(); setDragOverBlockIdx(idx); }}
            onDrop={() => handleBlocksReorder(idx)}
            className={`group relative py-2 px-1 rounded transition-all w-full ${
              isSelected ? 'bg-[#0b0b0b]' : 'border-transparent'
            }`}
            onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id); }}
          >
            {/* Drag Handle left of content */}
            <div className="absolute -left-7 top-3.75 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="p-1 text-neutral-700 hover:text-neutral-400 cursor-grab">
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Quick Trash */}
            <div className="absolute -right-7 top-3 flex items-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                className="p-1 text-neutral-600 hover:text-red-400 rounded transition-colors"
                title="Delete Block"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rendering core writing block fields */}
            {block.type === 'image' ? (
              <div className="space-y-2 p-2 bg-[#0e0e0e] border border-[#1b1b1b] rounded-lg">
                {block.isUploading ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#ff7700]" />
                    <span className="text-[10px] font-mono text-neutral-500">Uploading cover... {block.progress || 0}%</span>
                  </div>
                ) : block.src ? (
                  <div className="relative aspect-video rounded overflow-hidden group/img-preview">
                    <Image src={block.src} alt={block.alt} fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img-preview:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => handleTriggerFilePicker(idx)} className="bg-white hover:bg-neutral-100 text-black text-xs font-mono px-3 py-1.5 rounded font-bold">Change image</button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border border-dashed border-[#222] hover:border-neutral-700 hover:bg-[#121212] rounded-lg py-12 text-center cursor-pointer transition-colors"
                    onClick={() => handleTriggerFilePicker(idx)}
                  >
                    <UploadCloud className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    <p className="text-xs font-mono text-neutral-400 uppercase">Select active photo frame</p>
                  </div>
                )}

                {!block.isUploading && block.src && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <input 
                      type="text" 
                      placeholder="Alternative text (Alt Tag)"
                      value={block.alt || ''}
                      onChange={(e) => handleUpdateBlockImageProps(block.id, { alt: e.target.value })}
                      className="bg-[#121212]/80 border border-[#222] rounded p-2 text-xs text-neutral-300 outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="Image Caption"
                      value={block.caption || ''}
                      onChange={(e) => handleUpdateBlockImageProps(block.id, { caption: e.target.value })}
                      className="bg-[#121212]/80 border border-[#222] rounded p-2 text-xs text-neutral-300 outline-none"
                    />
                  </div>
                )}
              </div>
            ) : block.type === 'heading' ? (
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-mono text-neutral-600 select-none bg-[#111] px-1.5 py-0.5 rounded border border-[#1c1c1c]">H2</span>
                <textarea 
                  data-block-id={block.id}
                  value={block.content} 
                  onChange={(e) => handleTextareaChange(block.id, e.target.value)}
                  onKeyDown={(e) => handleTextareaKeyDown(e, block.id, idx)}
                  placeholder="Section heading..."
                  className="w-full bg-transparent border-none text-2xl font-bold text-neutral-100 outline-none resize-none leading-snug font-sans placeholder-neutral-800 focus:outline-none focus:ring-0"
                  rows={1}
                  autoFocus={focusedBlockId === block.id}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
              </div>
            ) : block.type === 'quote' ? (
              <div className="border-l-2 border-[#ff7700] pl-4">
                <textarea 
                  data-block-id={block.id}
                  value={block.content} 
                  onChange={(e) => handleTextareaChange(block.id, e.target.value)}
                  onKeyDown={(e) => handleTextareaKeyDown(e, block.id, idx)}
                  placeholder="Insert pull quote..."
                  className="w-full bg-transparent border-none text-lg italic text-neutral-400 outline-none resize-none leading-relaxed font-serif placeholder-neutral-800 focus:outline-none focus:ring-0"
                  rows={1}
                  autoFocus={focusedBlockId === block.id}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
              </div>
            ) : block.type === 'divider' ? (
              <div className="py-6 flex items-center justify-center">
                <div className="w-32 h-px bg-neutral-800 rounded" />
              </div>
            ) : block.type === 'code' ? (
              <div className="font-mono text-sm bg-neutral-950/80 border border-[#222] p-4 rounded-lg">
                <textarea 
                  data-block-id={block.id}
                  value={block.content} 
                  onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                  placeholder="// Swift, C++ or typescript code block..."
                  className="w-full bg-transparent border-none text-xs text-neutral-350 outline-none resize-none leading-relaxed font-mono focus:outline-none focus:ring-0"
                  rows={4}
                />
              </div>
            ) : block.type === 'callout' ? (
              <div className="p-4 bg-[#ff7700]/5 border border-[#ff7700]/10 rounded-lg text-sm text-neutral-300">
                <textarea 
                  data-block-id={block.id}
                  value={block.content} 
                  onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                  placeholder="Callout insights..."
                  className="w-full bg-transparent border-none outline-none resize-none leading-relaxed font-sans focus:outline-none focus:ring-0"
                  rows={2}
                />
              </div>
            ) : block.type === 'table' ? (
              <div className="p-3 bg-[#0d0d0d] border border-[#222]/80 rounded-lg">
                <textarea 
                  data-block-id={block.id}
                  value={block.content} 
                  onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                  placeholder="Markdown table: | Col 1 | Col 2 |"
                  className="w-full bg-transparent border-none text-xs text-neutral-300 outline-none resize-none font-mono focus:outline-none focus:ring-0"
                  rows={4}
                />
              </div>
            ) : block.type === 'embed' ? (
              <div className="p-4 bg-[#0e0e0e] border border-[#1c1c1c] rounded-lg space-y-2">
                <input 
                  type="text"
                  value={block.src || ''}
                  onChange={(e) => handleUpdateBlockImageProps(block.id, { src: e.target.value })}
                  placeholder="Paste public soundcloud or media URL..."
                  className="w-full bg-[#121212]/80 border border-[#222] rounded p-2 text-xs text-neutral-300 outline-none font-mono"
                />
                <input 
                  type="text"
                  value={block.caption || ''}
                  onChange={(e) => handleUpdateBlockImageProps(block.id, { caption: e.target.value })}
                  placeholder="Add description..."
                  className="w-full bg-[#121212]/80 border border-[#222] rounded p-2 text-xs text-neutral-400 outline-none"
                />
              </div>
            ) : block.type === 'list' ? (
              <div className="flex gap-2.5 items-start">
                <span className="text-neutral-600 font-semibold select-none mt-1">&#8226;</span>
                <textarea 
                  data-block-id={block.id}
                  value={block.content} 
                  onChange={(e) => handleTextareaChange(block.id, e.target.value)}
                  onKeyDown={(e) => handleTextareaKeyDown(e, block.id, idx)}
                  placeholder="- Item 1"
                  className="w-full bg-transparent border-none text-sm text-neutral-300 outline-none font-mono resize-none leading-relaxed placeholder-neutral-800 focus:outline-none focus:ring-0"
                  rows={2}
                  autoFocus={focusedBlockId === block.id}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
              </div>
            ) : (
              <textarea 
                data-block-id={block.id}
                value={block.content} 
                onChange={(e) => handleTextareaChange(block.id, e.target.value)}
                onKeyDown={(e) => handleTextareaKeyDown(e, block.id, idx)}
                placeholder="Start writing story segment or type '/' for commands..."
                className="w-full bg-transparent border-none text-md text-neutral-300 outline-none resize-none leading-relaxed font-sans placeholder-neutral-800 focus:outline-none focus:ring-0"
                rows={1}
                autoFocus={focusedBlockId === block.id}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
            )}

            {/* POPUP SLASH COMMAND DROPDOWN SCREEN */}
            {slashMenuBlockId === block.id && (
              <div className="absolute left-4 mt-2 w-72 bg-[#0d0d0d] border border-[#1b1b1b] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100 flex flex-col max-h-80 overflow-y-auto">
                <div className="px-3 py-1.5 border-b border-[#141414] text-[9px] font-mono tracking-widest text-[#ff7700] uppercase font-bold select-none">
                  COMMAND BLOCKS
                </div>
                <div className="p-1 space-y-0.5">
                  {slashCommands.map((cmd) => (
                    <button
                      key={cmd.type}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSlashCommand(block.id, cmd.type);
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-[#161616] text-neutral-300 hover:text-white transition-colors flex flex-col rounded-lg"
                    >
                      <span className="text-xs font-semibold font-sans">{cmd.label}</span>
                      <span className="text-[10px] text-neutral-500 font-light leading-none mt-0.5">{cmd.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
