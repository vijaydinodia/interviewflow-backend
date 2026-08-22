const codeExecutionRepo = require("../repository/codeExecutionRepo");

// Judge0 Language ID map
const LANGUAGE_IDS = {
  javascript: 93,
  typescript: 94,
  python:     92,
  java:       91,
  cpp:        54,
  c:          50,
  go:         95,
  rust:       73,
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
  return Buffer.from(str, "base64").toString("utf8");
}

/**
 * Poll a Judge0 submission token until it reaches a final status (id > 2).
 */
async function pollSubmission(token, headers, baseUrl, maxAttempts = 10) {
  const checkUrl = `${baseUrl.replace(/\/$/, "")}/submissions/${token}?base64_encoded=true`;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((res) => setTimeout(res, 1200));
    const res = await fetch(checkUrl, { headers });
    if (res.ok) {
      const result = await res.json();
      if (result.status && result.status.id > 2) return result;
    }
  }
  throw new Error("Execution timed out waiting for Judge0 response.");
}

/**
 * Execute source code via Judge0 CE API and save record to database.
 */
exports.executeCode = async ({ userId, sourceCode, language, stdin, roomCode }) => {
  const langKey = (language || "javascript").toLowerCase();
  const languageId = LANGUAGE_IDS[langKey];

  if (!languageId) {
    return {
      success: false,
      statusCode: 400,
      message: `Unsupported language '${language}'. Supported: ${Object.keys(LANGUAGE_IDS).join(", ")}`,
    };
  }

  if (!sourceCode || !sourceCode.trim()) {
    return {
      success: false,
      statusCode: 400,
      message: "Source code cannot be empty.",
    };
  }

  const judge0Url   = process.env.JUDGE0_URL || "https://judge0-ce.p.rapidapi.com";
  const judge0Key   = process.env.JUDGE0_API_KEY || "";
  const judge0Host  = process.env.JUDGE0_HOST  || "judge0-ce.p.rapidapi.com";

  const headers = { "Content-Type": "application/json" };
  if (judge0Key) {
    headers["X-RapidAPI-Key"]  = judge0Key;
    headers["X-RapidAPI-Host"] = judge0Host;
  }

  const payload = {
    source_code:    encodeBase64(sourceCode),
    language_id:    languageId,
    stdin:          stdin ? encodeBase64(stdin) : "",
    cpu_time_limit: 5,
    memory_limit:   128000,
  };

  try {
    const submitUrl = `${judge0Url.replace(/\/$/, "")}/submissions?base64_encoded=true&wait=true`;
    const response = await fetch(submitUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        statusCode: 502,
        message: `Judge0 API error (${response.status}): ${errText || response.statusText}`,
      };
    }

    let data = await response.json();

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

    // Persist execution to the database (non-blocking – don't fail the response if DB save fails)
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
    return {
      success:    false,
      statusCode: 500,
      message:    err.message || "Execution engine failed.",
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
