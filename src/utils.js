import os from "os";

export const getRamUsage = async () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    total: {
      bytes: totalMem,
      megabytes: Math.round(totalMem / 1024 / 1024),
      gigabytes: (totalMem / 1024 / 1024 / 1024).toFixed(2),
    },
    free: {
      bytes: freeMem,
      megabytes: Math.round(freeMem / 1024 / 1024),
      gigabytes: (freeMem / 1024 / 1024 / 1024).toFixed(2),
    },
    used: {
      bytes: usedMem,
      megabytes: Math.round(usedMem / 1024 / 1024),
      gigabytes: (usedMem / 1024 / 1024 / 1024).toFixed(2),
    },
    percentUsed: Math.round((usedMem / totalMem) * 100),
  };
};
