import { ExternalLink, Star, EyeOff, HelpCircle, MessageSquareQuote, Flame } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import {
  CATEGORY_CHIP, CATEGORY_LABEL, COUNTRY_LABEL, PLATFORM_LABEL, PRODUCT_LABEL, STATUS_LABEL,
} from '../../services/content/rules';
import type { ContentOpportunity, OppStatus } from '../../services/content/types';

interface Props {
  opp: ContentOpportunity | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStatus: (id: string, s: OppStatus) => void;
}

export function OpportunityDetail({ opp, open, onOpenChange, onStatus }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {opp && (
          <>
            <SheetHeader>
              <SheetDescription className="font-mono">
                {PLATFORM_LABEL[opp.platform]} · {COUNTRY_LABEL[opp.country]} · {STATUS_LABEL[opp.status]}
              </SheetDescription>
              <SheetTitle className="text-lg leading-snug">{opp.name}</SheetTitle>
            </SheetHeader>

            <div className="px-4 pb-6 space-y-5">
              {/* 热度信号 */}
              <div className="flex items-center gap-2 text-sm text-orange-400">
                <Flame className="w-4 h-4" />
                {opp.heat_signal}
              </div>

              {/* 操作 */}
              <div className="flex flex-wrap gap-2">
                <ActionBtn active={opp.status === 'favorited'} icon={<Star className={`w-4 h-4 ${opp.status === 'favorited' ? 'fill-amber-400' : ''}`} />}
                  label={opp.status === 'favorited' ? '已收藏' : '收藏'} cls="amber"
                  onClick={() => onStatus(opp.id, opp.status === 'favorited' ? 'new' : 'favorited')} />
                <ActionBtn active={opp.status === 'pending'} icon={<HelpCircle className="w-4 h-4" />} label="待确认"
                  onClick={() => onStatus(opp.id, 'pending')} />
                <ActionBtn active={opp.status === 'ignored'} icon={<EyeOff className="w-4 h-4" />} label={opp.status === 'ignored' ? '取消忽略' : '忽略'}
                  onClick={() => onStatus(opp.id, opp.status === 'ignored' ? 'new' : 'ignored')} />
                <a href={opp.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-card border border-border text-foreground hover:border-primary/50">
                  <ExternalLink className="w-4 h-4" />来源
                </a>
              </div>

              {/* 分类 / 推荐产品 / 标签 */}
              <div className="space-y-3">
                <Row label="内容分类">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_CHIP[opp.category]}`}>
                    {CATEGORY_LABEL[opp.category]}
                  </span>
                </Row>
                {opp.recommended_products.length > 0 && (
                  <Row label="推荐产品">
                    {opp.recommended_products.map((p) => (
                      <span key={p} className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/10 text-cyan-400">{PRODUCT_LABEL[p]}</span>
                    ))}
                  </Row>
                )}
                {opp.tags.length > 0 && (
                  <Row label="标签">
                    {opp.tags.map((t) => <span key={t} className="text-xs text-muted-foreground">#{t}</span>)}
                  </Row>
                )}
              </div>

              {/* 需求聚合明细(App Store 评论) */}
              {opp.extra && (opp.extra.mentions || opp.extra.examples?.length) && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MessageSquareQuote className="w-4 h-4 text-primary" />
                    需求聚合(来自竞品评论)
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                    {opp.extra.mentions != null && <span>提及 <b className="text-foreground font-mono">{opp.extra.mentions}</b> 次</span>}
                    {opp.extra.avgRating != null && <span>平均评分 <b className="text-foreground font-mono">{opp.extra.avgRating}★</b></span>}
                    {opp.extra.apps?.length ? <span>来源 {opp.extra.apps.join('、')}</span> : null}
                  </div>
                  {opp.extra.examples?.length ? (
                    <ul className="space-y-2">
                      {opp.extra.examples.map((ex, i) => (
                        <li key={i} className="text-xs text-foreground/80 border-l-2 border-primary/40 pl-2 leading-relaxed">
                          “{ex}”
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, active, cls }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; cls?: string }) {
  const activeCls = cls === 'amber' ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-primary/10 border-primary/40 text-primary';
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
        active ? activeCls : 'bg-card border-border text-muted-foreground hover:text-foreground'
      }`}>
      {icon}{label}
    </button>
  );
}
