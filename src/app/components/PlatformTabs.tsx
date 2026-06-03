import { Globe, Youtube, MessageSquare, Hash, Film, Image } from 'lucide-react';

interface PlatformTabsProps {
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
}

const platforms = [
  { id: 'all', label: '综合热榜', icon: Globe },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'reddit', label: 'Reddit', icon: MessageSquare },
  { id: 'hackernews', label: 'Hacker News', icon: Hash },
  { id: 'google_news', label: 'Google News', icon: Globe },
  { id: 'tmdb', label: 'TMDb', icon: Film },
  { id: 'giphy', label: 'Giphy', icon: Image },
];

export function PlatformTabs({ selectedPlatform, onSelectPlatform }: PlatformTabsProps) {
  return (
    <div className="border-b border-border overflow-x-auto scrollbar-none">
      <div className="flex">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isActive = selectedPlatform === platform.id;

          return (
            <button
              key={platform.id}
              onClick={() => onSelectPlatform(platform.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              {platform.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
