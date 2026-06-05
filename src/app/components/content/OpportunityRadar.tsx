import { useState } from 'react';
import { List, Settings2, Tags, Radar } from 'lucide-react';
import { useContentRules } from '../../hooks/useContentRules';
import { OpportunityList } from './OpportunityList';
import { CrawlRulesConfig } from './CrawlRulesConfig';
import { ClassifyRulesConfig } from './ClassifyRulesConfig';

type Tab = 'list' | 'crawl' | 'classify';

export function OpportunityRadar() {
  const [tab, setTab] = useState<Tab>('list');
  const { crawlRules, setCrawlRules, classifyRules, setClassifyRules } = useContentRules();

  const tabs: { id: Tab; label: string; icon: typeof List }[] = [
    { id: 'list', label: '机会列表', icon: List },
    { id: 'crawl', label: '抓取规则', icon: Settings2 },
    { id: 'classify', label: '分类规则', icon: Tags },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Radar className="w-6 h-6 text-primary" />
          内容机会雷达
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          从内容相关平台定向抓趋势,自动分类成内容同学看得懂、用得上的内容机会(第一阶段 · 模拟数据)
        </p>
      </div>

      {/* 子导航 */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-lg w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'list' && <OpportunityList classifyRules={classifyRules} />}
      {tab === 'crawl' && <CrawlRulesConfig rules={crawlRules} onChange={setCrawlRules} />}
      {tab === 'classify' && <ClassifyRulesConfig rules={classifyRules} onChange={setClassifyRules} />}
    </div>
  );
}
