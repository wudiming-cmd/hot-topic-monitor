import { useCallback, useEffect, useState } from 'react';
import type { TrendItem } from '../services/types';

const STORAGE_KEY = 'htm-favorites';

export interface FavoriteItem {
  item: TrendItem;
  note: string;
  saved_at: string; // ISO
}

/** 收藏/选题清单的稳定 key */
export function favKey(item: Pick<TrendItem, 'source' | 'url' | 'title'>): string {
  return `${item.source}::${item.url}::${item.title}`;
}

function load(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * 选题清单。持久化在 localStorage,跨刷新保留。
 * 提供:是否已收藏、切换收藏、改备注、移除、清空。
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = useCallback(
    (item: Pick<TrendItem, 'source' | 'url' | 'title'>) => {
      const k = favKey(item);
      return favorites.some((f) => favKey(f.item) === k);
    },
    [favorites],
  );

  const toggle = useCallback((item: TrendItem) => {
    const k = favKey(item);
    setFavorites((cur) => {
      if (cur.some((f) => favKey(f.item) === k)) {
        return cur.filter((f) => favKey(f.item) !== k);
      }
      return [{ item, note: '', saved_at: new Date().toISOString() }, ...cur];
    });
  }, []);

  const remove = useCallback((key: string) => {
    setFavorites((cur) => cur.filter((f) => favKey(f.item) !== key));
  }, []);

  const setNote = useCallback((key: string, note: string) => {
    setFavorites((cur) =>
      cur.map((f) => (favKey(f.item) === key ? { ...f, note } : f)),
    );
  }, []);

  const clear = useCallback(() => setFavorites([]), []);

  return { favorites, isFavorite, toggle, remove, setNote, clear };
}
