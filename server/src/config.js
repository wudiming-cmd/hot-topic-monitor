import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 8787),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID ?? '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET ?? '',
    userAgent: process.env.REDDIT_USER_AGENT ?? 'hot-topic-monitor/0.1',
    hasCreds: Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET),
  },
  weights: {
    velocity: Number(process.env.WEIGHT_VELOCITY ?? 0.5),
    popularity: Number(process.env.WEIGHT_POPULARITY ?? 0.3),
    engagement: Number(process.env.WEIGHT_ENGAGEMENT ?? 0.2),
  },
  metaAdLibToken: process.env.META_ADLIB_TOKEN ?? '',
};
