# 多平台热点监测工具 — Design Guidelines

## Aesthetic Stance: Data Intelligence Dashboard

A professional data analysis interface designed for continuous monitoring and trend analysis. Clean, focused, and optimized for information density without sacrificing clarity.

## Design System

### Color Palette

**Dark canvas foundation** — optimized for extended monitoring sessions and data readability.

- **Background**: Deep slate — reduces eye strain during long sessions
- **Surface**: Elevated panels — subtle depth without distraction  
- **Primary**: Cyan accent — signals activity and interactive elements
- **Data viz**: Multi-hue spectrum for category distinction
- **Status indicators**: Semantic colors for trend states (green=rising, amber=new, blue=stable, gray=declining)

### Typography

- **Display & UI**: System sans-serif — excellent at all sizes, designed for screens
- **Data & Labels**: Monospace — clear tabular alignment, distinctive numerals
- **Hierarchy**: Tight spacing for density, generous whitespace between sections for breathing room

### Layout Principles

1. **Grid-first structure** — modular cards for different data views
2. **Information density** — compact but readable; prioritize data over decoration
3. **Scannable hierarchy** — clear section headers, consistent card patterns, visual grouping
4. **Real-time feel** — status badges, timestamps, trend indicators make the data feel live

### Component Patterns

- **Metric cards**: Large number + label + trend indicator
- **Ranking lists**: Compact rows with platform badges, scores, and velocity arrows
- **Trend badges**: “New”, “Rising”, “Hot”, “Declining” with color coding
- **Platform pills**: Small colored badges for source attribution
- **Charts**: Sparklines for velocity, bar charts for cross-platform comparison

### Content Strategy

Use realistic placeholder data:
- Real platform names (YouTube, Reddit, Hacker News, Google News)
- Plausible trending topics and titles
- Realistic engagement numbers and timestamps
- Actual category tags (Tech, Entertainment, News, Memes)
