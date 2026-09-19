export interface Team {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

export interface ScoreDetail {
  home: number | null;
  away: number | null;
}

export interface MatchScore {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  duration: string;
  fullTime: ScoreDetail;
  halfTime: ScoreDetail;
  extraTime?: ScoreDetail;
  penalties?: ScoreDetail;
}

export interface Competition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem?: string;
}

export interface Area {
  id: number;
  name: string;
  code: string;
  flag?: string;
}

export interface Season {
  id: number;
  startDate: string;
  endDate: string;
  currentMatchday?: number;
}

export interface Referee {
  id: number;
  name: string;
  type?: string;
  nationality?: string;
}

export interface Match {
  id: number;
  utcDate: string;
  status: 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED' | 'AWARDED';
  matchday?: number | null;
  stage?: string;
  group?: string | null;
  lastUpdated?: string;
  area: Area;
  competition: Competition;
  season?: Season;
  homeTeam: Team;
  awayTeam: Team;
  score: MatchScore;
  referees?: Referee[];
  venue?: string;
  dataSource?: 'FOOTBALL_DATA' | 'API_FOOTBALL' | 'BOTH';
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetSeconds: number;
  requestsInWindow: number;
  isRateLimited: boolean;
}

export interface ApiFootballQuota {
  current: number;
  limit_day: number;
  remaining: number;
}

export interface MatchesResponse {
  date: string;
  totalMatches: number;
  matches: Match[];
  cached: boolean;
  cachedAt?: string;
  rateLimit: RateLimitInfo;
  apiFootballQuota?: ApiFootballQuota;
  error?: string;
}

export type DataSourceType = 'DUAL' | 'API_FOOTBALL';

export interface CoveredCompetitionDef {
  code: string;
  name: string;
  ptName: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  accentColor: string;
  apiFootballId: number;
  dataSource: DataSourceType;
  dataSourceLabel: string;
  tournamentNote?: string;
}

export const COVERED_COMPETITIONS: CoveredCompetitionDef[] = [
  // 1. Brasileirão Série A
  {
    code: 'BSA',
    name: 'Campeonato Brasileiro Série A',
    ptName: 'Brasileirão Série A',
    country: 'Brasil',
    countryCode: 'BRA',
    flagEmoji: '🇧🇷',
    accentColor: '#009b3a',
    apiFootballId: 71,
    dataSource: 'DUAL',
    dataSourceLabel: 'Football-Data.org + API-Football'
  },
  // 2. Champions League
  {
    code: 'CL',
    name: 'UEFA Champions League',
    ptName: 'Champions League',
    country: 'Europa',
    countryCode: 'EUR',
    flagEmoji: '⭐',
    accentColor: '#001489',
    apiFootballId: 2,
    dataSource: 'DUAL',
    dataSourceLabel: 'Football-Data.org + API-Football'
  },
  // 3. La Liga
  {
    code: 'PD',
    name: 'Primera Division',
    ptName: 'La Liga (Espanha)',
    country: 'Espanha',
    countryCode: 'ESP',
    flagEmoji: '🇪🇸',
    accentColor: '#ee151f',
    apiFootballId: 140,
    dataSource: 'DUAL',
    dataSourceLabel: 'Football-Data.org + API-Football'
  },
  // 4. Premier League
  {
    code: 'PL',
    name: 'Premier League',
    ptName: 'Premier League (Inglaterra)',
    country: 'Inglaterra',
    countryCode: 'ENG',
    flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    accentColor: '#38003c',
    apiFootballId: 39,
    dataSource: 'DUAL',
    dataSourceLabel: 'Football-Data.org + API-Football'
  },
  // 5. Bundesliga
  {
    code: 'BL1',
    name: 'Bundesliga',
    ptName: 'Bundesliga (Alemanha)',
    country: 'Alemanha',
    countryCode: 'DEU',
    flagEmoji: '🇩🇪',
    accentColor: '#d3010c',
    apiFootballId: 78,
    dataSource: 'DUAL',
    dataSourceLabel: 'Football-Data.org + API-Football'
  },
  // 6. Serie A (Itália)
  {
    code: 'SA',
    name: 'Serie A',
    ptName: 'Serie A (Itália)',
    country: 'Itália',
    countryCode: 'ITA',
    flagEmoji: '🇮🇹',
    accentColor: '#008fd7',
    apiFootballId: 135,
    dataSource: 'DUAL',
    dataSourceLabel: 'Football-Data.org + API-Football'
  },
  // 7. Ligue 1
  {
    code: 'FL1',
    name: 'Ligue 1',
    ptName: 'Ligue 1 (França)',
    country: 'França',
    countryCode: 'FRA',
    flagEmoji: '🇫🇷',
    accentColor: '#091c3e',
    apiFootballId: 61,
    dataSource: 'DUAL',
    dataSourceLabel: 'Football-Data.org + API-Football'
  },
  // 8. Eredivisie
  {
    code: 'DED',
    name: 'Eredivisie',
    ptName: 'Eredivisie (Holanda)',
    country: 'Holanda',
    countryCode: 'NLD',
    flagEmoji: '🇳🇱',
    accentColor: '#1e4785',
    apiFootballId: 88,
    dataSource: 'DUAL',
    dataSourceLabel: 'Football-Data.org + API-Football'
  },
  // 9. Championship (Inglaterra)
  {
    code: 'ELC',
    name: 'Championship',
    ptName: 'Championship (Inglaterra 2ª)',
    country: 'Inglaterra',
    countryCode: 'ENG',
    flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    accentColor: '#102244',
    apiFootballId: 40,
    dataSource: 'DUAL',
    dataSourceLabel: 'Football-Data.org + API-Football'
  },
  // 10. Primeira Liga (Portugal)
  {
    code: 'PPL',
    name: 'Primeira Liga',
    ptName: 'Primeira Liga (Portugal)',
    country: 'Portugal',
    countryCode: 'PRT',
    flagEmoji: '🇵🇹',
    accentColor: '#006600',
    apiFootballId: 94,
    dataSource: 'DUAL',
    dataSourceLabel: 'Football-Data.org + API-Football'
  },
  // 11. Copa do Mundo
  {
    code: 'WC',
    name: 'FIFA World Cup',
    ptName: 'Copa do Mundo FIFA',
    country: 'Mundo',
    countryCode: 'WLD',
    flagEmoji: '🌍',
    accentColor: '#8a1538',
    apiFootballId: 1,
    dataSource: 'DUAL',
    dataSourceLabel: 'Football-Data.org + API-Football',
    tournamentNote: 'Só ativa durante o torneio'
  },
  // 12. Eurocopa
  {
    code: 'EC',
    name: 'European Championship',
    ptName: 'Eurocopa',
    country: 'Europa',
    countryCode: 'EUR',
    flagEmoji: '🏆',
    accentColor: '#003399',
    apiFootballId: 4,
    dataSource: 'DUAL',
    dataSourceLabel: 'Football-Data.org + API-Football',
    tournamentNote: 'Só ativa durante o torneio'
  },
  // 13. Brasileirão Série B
  {
    code: 'BSB',
    name: 'Brasileirão Série B',
    ptName: 'Brasileirão Série B',
    country: 'Brasil',
    countryCode: 'BRA',
    flagEmoji: '🇧🇷',
    accentColor: '#0e7490',
    apiFootballId: 72,
    dataSource: 'API_FOOTBALL',
    dataSourceLabel: 'Exclusivo API-Football'
  },
  // 14. Copa Libertadores
  {
    code: 'CLI',
    name: 'CONMEBOL Libertadores',
    ptName: 'Copa Libertadores',
    country: 'América do Sul',
    countryCode: 'SAM',
    flagEmoji: '🌎',
    accentColor: '#b45309',
    apiFootballId: 13,
    dataSource: 'API_FOOTBALL',
    dataSourceLabel: 'Exclusivo API-Football'
  },
  // 15. Copa do Brasil
  {
    code: 'CDB',
    name: 'Copa do Brasil',
    ptName: 'Copa do Brasil',
    country: 'Brasil',
    countryCode: 'BRA',
    flagEmoji: '🇧🇷',
    accentColor: '#047857',
    apiFootballId: 73,
    dataSource: 'API_FOOTBALL',
    dataSourceLabel: 'Exclusivo API-Football'
  },
  // 16. Copa Sul-Americana
  {
    code: 'CSU',
    name: 'CONMEBOL Sudamericana',
    ptName: 'Copa Sul-Americana',
    country: 'América do Sul',
    countryCode: 'SAM',
    flagEmoji: '🌎',
    accentColor: '#1d4ed8',
    apiFootballId: 11,
    dataSource: 'API_FOOTBALL',
    dataSourceLabel: 'Exclusivo API-Football'
  },
  // 17. Saudi Pro League
  {
    code: 'SPL',
    name: 'Saudi Pro League',
    ptName: 'Saudi Pro League (Arábia)',
    country: 'Arábia Saudita',
    countryCode: 'SAU',
    flagEmoji: '🇸🇦',
    accentColor: '#059669',
    apiFootballId: 307,
    dataSource: 'API_FOOTBALL',
    dataSourceLabel: 'Exclusivo API-Football'
  },
  // 18. Liga Profesional Argentina
  {
    code: 'LPA',
    name: 'Liga Profesional Argentina',
    ptName: 'Liga Profesional Argentina',
    country: 'Argentina',
    countryCode: 'ARG',
    flagEmoji: '🇦🇷',
    accentColor: '#0284c7',
    apiFootballId: 128,
    dataSource: 'API_FOOTBALL',
    dataSourceLabel: 'Exclusivo API-Football'
  },
  // 19. Primera Nacional (Argentina)
  {
    code: 'PNA',
    name: 'Primera Nacional',
    ptName: 'Primera Nacional (Argentina 2ª)',
    country: 'Argentina',
    countryCode: 'ARG',
    flagEmoji: '🇦🇷',
    accentColor: '#475569',
    apiFootballId: 129,
    dataSource: 'API_FOOTBALL',
    dataSourceLabel: 'Exclusivo API-Football'
  },
  // 20. Copa Argentina
  {
    code: 'CAR',
    name: 'Copa Argentina',
    ptName: 'Copa Argentina',
    country: 'Argentina',
    countryCode: 'ARG',
    flagEmoji: '🇦🇷',
    accentColor: '#6b7280',
    apiFootballId: 130,
    dataSource: 'API_FOOTBALL',
    dataSourceLabel: 'Exclusivo API-Football'
  }
];

export interface HistoryTaskItem {
  competitionCode: string;
  competitionName: string;
  season: number;
  provider: 'API_FOOTBALL' | 'FOOTBALL_DATA';
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'not_available';
  matchCount?: number;
  error?: string;
  downloadedAt?: string;
}

export interface HistoryDownloadState {
  isRunning: boolean;
  totalItems: number;
  completedItems: number;
  currentLabel: string;
  secondsUntilNextRequest: number;
  startedAt?: string;
  finishedAt?: string;
  apiFootballQuota?: ApiFootballQuota;
  items: HistoryTaskItem[];
}

export interface TeamDetails {
  idTeam: string;
  name: string;
  shortName?: string;
  formedYear?: string;
  stadium?: string;
  stadiumCapacity?: string;
  stadiumLocation?: string;
  badge?: string;
  banner?: string;
  jersey?: string;
  website?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  descriptionPT?: string;
  descriptionEN?: string;
  league?: string;
  country?: string;
  colors?: string[];
  fromCache?: boolean;
  fromSqlite?: boolean;
}

export interface SqliteSeasonEntry {
  key: string;
  competition_code: string;
  competition_name: string;
  season: number;
  provider: string;
  total_matches: number;
  downloaded_at: string;
}

export interface SqliteStats {
  engine: string;
  dbFile: string;
  totalMatches: number;
  totalTeams: number;
  totalSeasons: number;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  seasons: SqliteSeasonEntry[];
}

export interface H2HSummary {
  teamA: string;
  teamB?: string;
  totalMatches: number;
  teamAWins: number;
  teamBWins: number;
  draws: number;
  goalsTeamA: number;
  goalsTeamB: number;
  matches: any[];
}
