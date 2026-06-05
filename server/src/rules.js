// 内容分类规则(与前端默认一致;真实环境可改为读数据库/配置中心)。
export const CLASSIFY_RULES = {
  categoryKeywords: {
    aesthetic: ['coquette', 'y2k', 'clean girl', 'dark academia', 'cottagecore', 'kawaii', 'old money', 'cybercore', 'soft girl', 'minimalist', 'aesthetic', 'aura', 'wallpaper', 'theme'],
    identity: ['christian girl', 'gym girl', 'that girl', 'main character', 'soft life', 'girl boss', 'dark feminine', 'black girl magic', 'latina', 'book girl'],
    interest: ['anime', 'coffee', 'cat', 'travel', 'reading', 'astrology', 'plants', 'photography', 'gaming', 'taylor swift fan', 'zodiac'],
    seasonal: ['christmas', 'halloween', 'valentine', 'graduation', 'back to school', 'summer', 'thanksgiving', 'easter', 'new year', 'mother', 'pride'],
    entertainment: ['k-pop', 'kpop', 'netflix', 'disney', 'marvel', 'taylor swift', 'minecraft', 'roblox', 'genshin', 'fortnite', 'wednesday', 'squid game', 'stranger things'],
    meme: ['girl math', 'delulu', 'brat summer', 'girl dinner', 'roman empire', 'lucky girl', 'corecore', 'pov', 'viral sound', 'reaction', 'meme'],
  },
  tagLexicon: ['pink', 'pastel', 'bow', 'cat', 'coffee', 'anime', 'minimal', 'dark', 'gradient', 'retro', 'cute', 'gothic', 'floral', 'sparkle', 'neon', 'vintage', 'holiday', 'icon', 'widget', 'lockscreen'],
  synonyms: { kpop: 'k-pop', xmas: 'christmas', ts: 'taylor swift' },
  productAdaptation: {
    aesthetic: ['wallpaper', 'theme'],
    identity: ['wallpaper', 'theme'],
    interest: ['sticker', 'wallpaper'],
    seasonal: ['theme', 'wallpaper', 'sticker'],
    entertainment: ['theme', 'sticker'],
    meme: ['sticker'],
  },
  globalExcludes: ['election', 'politics', 'president', 'war', 'shooting', 'crime', 'court', 'stock', 'inflation', 'economy', 'bank', 'tariff', 'lawsuit', 'protest', 'nsfw'],
};

// 内容方向抓取目标(对应前端重新规划的抓取规则)
export const REDDIT_CONTENT_SUBS = [
  'iOSsetups', 'androidthemes', 'keyboards', 'aesthetics', 'Wallpapers', 'iphonewallpapers',
];
export const REDDIT_MIN_UPVOTES = 200;
