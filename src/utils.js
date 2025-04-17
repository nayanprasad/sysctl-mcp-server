import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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

export const getProcessByPort = async (port) => {
  try {
    let processInfo = {};

    // Different commands based on OS
    if (process.platform === "win32") {
      // For Windows
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      if (!stdout.trim()) {
        return { error: `No process found using port ${port}` };
      }

      // Parse netstat output to get PID
      const lines = stdout.trim().split("\n");
      const pidMatch = lines[0].trim().match(/(\d+)$/);
      if (pidMatch && pidMatch[1]) {
        const pid = pidMatch[1];

        // Get process details using tasklist
        const { stdout: tasklistOutput } = await execAsync(
          `tasklist /FI "PID eq ${pid}" /FO CSV /NH`,
        );
        const taskInfo = tasklistOutput.trim().split(",");

        if (taskInfo.length > 1) {
          processInfo = {
            pid: parseInt(pid),
            name: taskInfo[0].replace(/"/g, ""),
            port: port,
            protocol: lines[0].includes("TCP") ? "TCP" : "UDP",
            memoryUsage: taskInfo[4]
              ? taskInfo[4].replace(/"/g, "")
              : "Unknown",
          };
        }
      }
    } else {
      // For Unix-like systems (Linux, macOS)
      const { stdout } = await execAsync(`lsof -i :${port} -P -n`);
      if (!stdout.trim()) {
        return { error: `No process found using port ${port}` };
      }

      // Parse lsof output
      const lines = stdout.trim().split("\n");
      if (lines.length > 1) {
        const parts = lines[1].trim().split(/\s+/);
        const pid = parseInt(parts[1]);

        // Get additional process info
        const { stdout: psOutput } = await execAsync(
          `ps -p ${pid} -o pid,ppid,user,%cpu,%mem,command`,
        );
        const psLines = psOutput.trim().split("\n");

        if (psLines.length > 1) {
          const psInfo = psLines[1].trim().split(/\s+/);
          processInfo = {
            pid: pid,
            name: parts[0],
            user: psInfo[2],
            port: port,
            protocol: parts[4],
            cpuUsage: psInfo[3] + "%",
            memoryUsage: psInfo[4] + "%",
            command: psInfo.slice(5).join(" "),
          };
        }
      }
    }

    return Object.keys(processInfo).length > 0
      ? processInfo
      : {
          error: `Could not retrieve complete information for process on port ${port}`,
        };
  } catch (error) {
    return {
      error: `Failed to get process information: ${error.message}`,
      details: error.toString(),
    };
  }
};

export const killProcessByPort = async ({ port, force }) => {
  try {
    let pid;

    // Different commands based on OS to find PID
    if (process.platform === "win32") {
      // For Windows
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      if (!stdout.trim()) {
        return { success: false, error: `No process found using port ${port}` };
      }

      // Parse netstat output to get PID
      const lines = stdout.trim().split("\n");
      const pidMatch = lines[0].trim().match(/(\d+)$/);
      if (pidMatch && pidMatch[1]) {
        pid = pidMatch[1];

        // Kill the process
        const killCommand = force
          ? `taskkill /F /PID ${pid}`
          : `taskkill /PID ${pid}`;
        await execAsync(killCommand);
      } else {
        return {
          success: false,
          error: `Could not determine PID for process on port ${port}`,
        };
      }
    } else {
      // For Unix-like systems (Linux, macOS)
      const { stdout } = await execAsync(`lsof -i :${port} -t`);
      if (!stdout.trim()) {
        return { success: false, error: `No process found using port ${port}` };
      }

      pid = stdout.trim();

      // Kill the process
      const killCommand = force ? `kill -9 ${pid}` : `kill ${pid}`;
      await execAsync(killCommand);
    }

    // Verify the process was killed
    try {
      if (process.platform === "win32") {
        await execAsync(`tasklist /FI "PID eq ${pid}" /NH`);
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
        if (!stdout.includes(pid)) {
          return {
            success: true,
            message: `Process with PID ${pid} on port ${port} was successfully terminated`,
          };
        }
      } else {
        await execAsync(`ps -p ${pid}`);
        const { stdout } = await execAsync(`lsof -i :${port} -t`);
        if (!stdout.trim()) {
          return {
            success: true,
            message: `Process with PID ${pid} on port ${port} was successfully terminated`,
          };
        }
      }

      // If we get here, the process might still be running
      if (force) {
        return {
          success: false,
          error: `Failed to kill process with PID ${pid} on port ${port} even with force option`,
        };
      } else {
        return {
          success: false,
          error: `Process with PID ${pid} on port ${port} could not be terminated gracefully. Try using force option.`,
          suggestion: "Retry with force=true parameter",
        };
      }
    } catch (e) {
      // If checking process status fails, it's likely killed
      return {
        success: true,
        message: `Process with PID ${pid} on port ${port} was successfully terminated`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to kill process: ${error.message}`,
      details: error.toString(),
    };
  }
};
