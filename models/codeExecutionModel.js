const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "CodeExecution",
    {
      executionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        field: "execution_id",
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        field: "user_id",
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      // The programming language used (e.g. "javascript", "python", "cpp")
      language: {
        type: DataTypes.STRING(50),
        field: "language",
        allowNull: false,
      },
      // The source code submitted by the user
      sourceCode: {
        type: DataTypes.TEXT,
        field: "source_code",
        allowNull: false,
      },
      // Optional stdin provided by the user
      stdin: {
        type: DataTypes.TEXT,
        field: "stdin",
        allowNull: true,
        defaultValue: "",
      },
      // Judge0 status description (e.g. "Accepted", "Compilation Error")
      statusDescription: {
        type: DataTypes.STRING(100),
        field: "status_description",
        allowNull: true,
      },
      // Judge0 status ID (3 = Accepted, 6 = Compilation Error, etc.)
      statusId: {
        type: DataTypes.INTEGER,
        field: "status_id",
        allowNull: true,
      },
      // Program's standard output
      stdout: {
        type: DataTypes.TEXT,
        field: "stdout",
        allowNull: true,
        defaultValue: "",
      },
      // Program's standard error output
      stderr: {
        type: DataTypes.TEXT,
        field: "stderr",
        allowNull: true,
        defaultValue: "",
      },
      // Compilation error output (e.g. syntax errors from the compiler)
      compileOutput: {
        type: DataTypes.TEXT,
        field: "compile_output",
        allowNull: true,
        defaultValue: "",
      },
      // Execution time in seconds (e.g. "0.024")
      executionTime: {
        type: DataTypes.STRING(20),
        field: "execution_time",
        allowNull: true,
      },
      // Memory consumed in KB
      memoryUsed: {
        type: DataTypes.STRING(20),
        field: "memory_used",
        allowNull: true,
      },
      // Optional: link a code execution to an interview session
      roomCode: {
        type: DataTypes.STRING(50),
        field: "room_code",
        allowNull: true,
      },
    },
    {
      tableName: "code_executions",
      timestamps: true,
    }
  );
};
