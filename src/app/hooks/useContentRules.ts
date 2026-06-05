import { useCallback, useState } from 'react';
import {
  loadClassifyRules, loadCrawlRules, saveClassifyRules, saveCrawlRules,
} from '../services/content/rules';
import type { ClassifyRules, CrawlRule } from '../services/content/types';

/** 抓取规则 + 分类规则(本地持久化)。配置页修改后,机会列表会按新规则重新分类。 */
export function useContentRules() {
  const [crawlRules, setCrawlRulesState] = useState<CrawlRule[]>(loadCrawlRules);
  const [classifyRules, setClassifyRulesState] = useState<ClassifyRules>(loadClassifyRules);

  const setCrawlRules = useCallback((rules: CrawlRule[]) => {
    setCrawlRulesState(rules);
    saveCrawlRules(rules);
  }, []);

  const setClassifyRules = useCallback((rules: ClassifyRules) => {
    setClassifyRulesState(rules);
    saveClassifyRules(rules);
  }, []);

  return { crawlRules, setCrawlRules, classifyRules, setClassifyRules };
}
