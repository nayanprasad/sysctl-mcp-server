export type Response = {
  success: boolean;
  message?: string;
  error?: string;
  suggestions?: string[];
};

export type RamUsage = {
  total: {
    bytes: number;
    megabytes: number;
    gigabytes: string;
  };
  free: {
    bytes: number;
    megabytes: number;
    gigabytes: string;
  };
  used: {
    bytes: number;
    megabytes: number;
    gigabytes: string;
  };
  percentUsed: number;
};
