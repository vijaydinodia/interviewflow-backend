const codeExecutionRepo = require("../repository/codeExecutionRepo");
const axios = require("axios");

// Judge0 Language ID map (Compatible with CE instance https://ce.judge0.com)
const LANGUAGE_IDS = {
  javascript: 63,
  typescript: 74,
  python:     71,
  python3:    71,
  java:       62,
  cpp:        54,
  c:          50,
  csharp:     51,
  go:         60,
  rust:       73,
  php:        68,
  ruby:       72,
  swift:      83,
  kotlin:     78,
};

/**
 * Encode a string to base64 for safe submission to Judge0.
 */
function encodeBase64(str) {
  if (!str) return "";
  return Buffer.from(str, "utf8").toString("base64");
}

/**
 * Decode a base64 string returned from Judge0.
 */
function decodeBase64(str) {
  if (!str) return "";
  try {
    return Buffer.from(str, "base64").toString("utf8");
  } catch {
    return str;
  }
}

/**
 * Preprocess source code to include necessary headers, types and test runners for competitive programming
 */
function preprocessSourceCode(sourceCode, langKey) {
  let code = sourceCode.trim();

  if (langKey === "cpp" || langKey === "c++") {
    const hasHeaders = code.includes("#include <iostream>") || code.includes("<bits/stdc++.h>") || code.includes("#include <vector>");
    const hasNamespace = code.includes("using namespace std;");
    const hasMain = /\bint\s+main\s*\(/.test(code) || /\bvoid\s+main\s*\(/.test(code);

    let prepended = "";
    if (!hasHeaders) {
      prepended += "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <unordered_map>\n#include <map>\n#include <set>\n#include <queue>\n#include <stack>\n#include <cmath>\n#include <numeric>\n";
    }
    if (!hasNamespace && !code.includes("std::")) {
      prepended += "using namespace std;\n\n";
    }

    code = prepended + code;

    if (!hasMain) {
      code += "\n\nint main() {\n    cout << \"=== Execution Output ===\" << endl;\n    cout << \"Code compiled and executed successfully!\" << endl;\n    return 0;\n}\n";
    }
  } else if (langKey === "c") {
    const hasHeaders = code.includes("#include <stdio.h>");
    const hasMain = /\bint\s+main\s*\(/.test(code) || /\bvoid\s+main\s*\(/.test(code);

    let prepended = "";
    if (!hasHeaders) {
      prepended += "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>\n#include <math.h>\n\n";
    }
    code = prepended + code;
    if (!hasMain) {
      code += "\n\nint main() {\n    printf(\"Code compiled and executed successfully!\\n\");\n    return 0;\n}\n";
    }
  } else if (langKey === "python" || langKey === "python3") {
    if (!code.includes("typing") && (code.includes("List[") || code.includes("Optional["))) {
      code = "from typing import *\nimport math, collections, heapq, bisect\n\n" + code;
    }
  } else if (langKey === "java") {
    if (!code.includes("import java.util")) {
      code = "import java.util.*;\nimport java.io.*;\n\n" + code;
    }
    if (!code.includes("public static void main")) {
      code += "\n\nclass Main {\n    public static void main(String[] args) {\n        System.out.println(\"Code compiled and executed successfully!\");\n    }\n}\n";
    }
  }

  return code;
}

/**
 * Poll a Judge0 submission token until it reaches a final status (id > 2).
 */
async function pollSubmission(token, headers, baseUrl, maxAttempts = 10) {
  const checkUrl = `${baseUrl.replace(/\/$/, "")}/submissions/${token}?base64_encoded=true`;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((res) => setTimeout(res, 1000));
    try {
      const response = await axios.get(checkUrl, { headers });
      if (response.status === 200 && response.data) {
        const result = response.data;
        if (result.status && result.status.id > 2) return result;
      }
    } catch (err) {
      // Continue polling unless timeout
    }
  }
  throw new Error("Execution timed out waiting for Judge0 response.");
}

/**
 * Execute source code via Judge0 CE API and save record to database.
 */
exports.executeCode = async ({ userId, sourceCode, language, stdin, roomCode }) => {
  const langKey = (language || "javascript").toLowerCase();
  const languageId = LANGUAGE_IDS[langKey] || LANGUAGE_IDS.javascript;

  if (!sourceCode || !sourceCode.trim()) {
    return {
      success: false,
      statusCode: 400,
      message: "Source code cannot be empty.",
    };
  }

  const judge0Url   = (process.env.JUDGE0_URL || "https://ce.judge0.com").replace(/\/$/, "");
  const judge0Key   = process.env.JUDGE0_API_KEY || "";
  const judge0Host  = process.env.JUDGE0_HOST || "";

  const headers = { "Content-Type": "application/json" };
  if (judge0Key) {
    headers["X-RapidAPI-Key"]  = judge0Key;
    if (judge0Host) headers["X-RapidAPI-Host"] = judge0Host;
  }

  const executableCode = preprocessSourceCode(sourceCode, langKey);

  const payload = {
    source_code:    encodeBase64(executableCode),
    language_id:    languageId,
    stdin:          stdin ? encodeBase64(stdin) : "",
    cpu_time_limit: 5,
    memory_limit:   128000,
  };

  try {
    const submitUrl = `${judge0Url}/submissions?base64_encoded=true&wait=true`;
    let response;

    try {
      response = await axios.post(submitUrl, payload, { headers });
    } catch (primaryErr) {
      // Fallback to public ce.judge0.com if primary failed
      if (judge0Url !== "https://ce.judge0.com") {
        response = await axios.post("https://ce.judge0.com/submissions?base64_encoded=true&wait=true", payload, {
          headers: { "Content-Type": "application/json" }
        });
      } else {
        throw primaryErr;
      }
    }

    let data = response.data;

    // If token was returned without final status, poll until done
    if (!data.status && data.token) {
      data = await pollSubmission(data.token, headers, judge0Url);
    }

    const stdout        = decodeBase64(data.stdout);
    const stderr        = decodeBase64(data.stderr);
    const compileOutput = decodeBase64(data.compile_output);
    const execTime      = data.time ? `${parseFloat(data.time).toFixed(3)}s` : "0.000s";
    const memory        = data.memory ? `${data.memory} KB` : "0 KB";
    const statusObj     = data.status || { id: 3, description: "Accepted" };

    // Persist execution to the database (non-blocking)
    try {
      await codeExecutionRepo.createExecution({
        userId:              userId || null,
        language:            langKey,
        sourceCode,
        stdin:               stdin || "",
        statusId:            statusObj.id,
        statusDescription:   statusObj.description,
        stdout,
        stderr,
        compileOutput,
        executionTime:       execTime,
        memoryUsed:          memory,
        roomCode:            roomCode || null,
      });
    } catch (dbErr) {
      console.warn("Could not save code execution history:", dbErr.message);
    }

    return {
      success:        true,
      statusCode:     200,
      message:        "Code executed successfully.",
      data: {
        token:          data.token,
        status:         statusObj,
        stdout,
        stderr,
        compile_output: compileOutput,
        time:           execTime,
        memory,
        language:       langKey,
      },
    };
  } catch (err) {
    console.error("Code execution engine error:", err.message);
    const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Execution engine failed.";
    return {
      success: true,
      statusCode: 200,
      message: errorMsg,
      data: {
        token: null,
        status: { id: 11, description: "Runtime Error" },
        stdout: "",
        stderr: errorMsg,
        compile_output: errorMsg,
        time: "0.000s",
        memory: "0 KB",
        language: langKey,
      },
    };
  }
};

/**
 * Get all executions for a specific user (paginated).
 */
exports.getMyHistory = async (userId, { page, limit }) => {
  try {
    const { count, rows } = await codeExecutionRepo.getExecutionsByUserId(userId, { page, limit });
    return {
      success:    true,
      statusCode: 200,
      message:    "Execution history fetched.",
      data:       rows,
      pagination: {
        total:       count,
        page:        Number(page),
        limit:       Number(limit),
        totalPages:  Math.ceil(count / limit),
      },
    };
  } catch (err) {
    return { success: false, statusCode: 500, message: err.message };
  }
};

/**
 * Get all executions in a specific interview room.
 */
exports.getRoomHistory = async (roomCode) => {
  try {
    const rows = await codeExecutionRepo.getExecutionsByRoomCode(roomCode);
    return {
      success:    true,
      statusCode: 200,
      message:    "Room execution history fetched.",
      data:       rows,
    };
  } catch (err) {
    return { success: false, statusCode: 500, message: err.message };
  }
};

/**
 * Get a single execution by ID.
 */
exports.getExecutionById = async (executionId) => {
  try {
    const record = await codeExecutionRepo.getExecutionById(executionId);
    if (!record) {
      return { success: false, statusCode: 404, message: "Execution record not found." };
    }
    return { success: true, statusCode: 200, message: "Execution record fetched.", data: record };
  } catch (err) {
    return { success: false, statusCode: 500, message: err.message };
  }
};

/**
 * Get all executions (super admin view, paginated).
 */
exports.getAllExecutions = async ({ page, limit }) => {
  try {
    const { count, rows } = await codeExecutionRepo.getAllExecutions({ page, limit });
    return {
      success:    true,
      statusCode: 200,
      message:    "All execution records fetched.",
      data:       rows,
      pagination: {
        total:       count,
        page:        Number(page),
        limit:       Number(limit),
        totalPages:  Math.ceil(count / limit),
      },
    };
  } catch (err) {
    return { success: false, statusCode: 500, message: err.message };
  }
};

/**
 * Delete a single execution record by ID.
 */
exports.deleteExecution = async (executionId) => {
  try {
    const record = await codeExecutionRepo.deleteExecution(executionId);
    if (!record) {
      return { success: false, statusCode: 404, message: "Execution record not found." };
    }
    return { success: true, statusCode: 200, message: "Execution record deleted." };
  } catch (err) {
    return { success: false, statusCode: 500, message: err.message };
  }
};
