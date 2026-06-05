import { useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle, Copy, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { analyze } from '../services/analyze';
import type { AnalyzeKind } from '../services/analyze';

interface Props {
  kind: AnalyzeKind;
  buildPayload: () => unknown;
  title?: string;
  label?: string;
  className?: string;
}

export function AiAnalysisButton({ kind, buildPayload, title = 'AI 分析', label = 'AI 分析', className }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [model, setModel] = useState('');
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    setText('');
    try {
      const res = await analyze(kind, buildPayload());
      setText(res.analysis || '(空)');
      setModel(res.model ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : '分析失败');
    } finally {
      setLoading(false);
    }
  };

  const openAndRun = () => { setOpen(true); run(); };

  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <>
      <button
        onClick={openAndRun}
        className={className ?? 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-500 to-primary text-white hover:opacity-90 transition-opacity'}
      >
        <Sparkles className="w-4 h-4" />
        {label}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />{title}
            </SheetTitle>
            <SheetDescription>
              由 DeepSeek 基于当前数据生成的选题建议{model ? ` · ${model}` : ''}
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-6">
            {/* 工具行 */}
            <div className="flex items-center gap-2 mb-4">
              <button onClick={run} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border text-foreground hover:border-primary/50 disabled:opacity-60">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />重新分析
              </button>
              {text && (
                <button onClick={copy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border text-foreground hover:border-primary/50">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '已复制' : '复制'}
                </button>
              )}
            </div>

            {loading && (
              <div className="flex items-center gap-3 text-muted-foreground text-sm py-8 justify-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                AI 正在分析…(约 5–15 秒)
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {text && !loading && <Markdown text={text} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** 极简 markdown 渲染:标题/列表/加粗,够用于展示分析文本。 */
function Markdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-foreground">
      {lines.map((ln, i) => {
        const t = ln.trim();
        if (!t) return <div key={i} className="h-1" />;
        if (/^#{1,6}\s/.test(t)) {
          return <p key={i} className="font-semibold text-base text-foreground mt-3">{t.replace(/^#{1,6}\s/, '')}</p>;
        }
        if (/^[-*•]\s/.test(t)) {
          return <p key={i} className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary">{inline(t.replace(/^[-*•]\s/, ''))}</p>;
        }
        if (/^\d+[.)]\s/.test(t)) {
          return <p key={i} className="pl-4">{inline(t)}</p>;
        }
        return <p key={i}>{inline(t)}</p>;
      })}
    </div>
  );
}

/** 处理 **加粗** */
function inline(s: string) {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    /^\*\*[^*]+\*\*$/.test(p)
      ? <strong key={i} className="text-foreground font-semibold">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>,
  );
}
