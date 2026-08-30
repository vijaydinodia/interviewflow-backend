const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "Question",
    {
      questionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        field: "question_id",
        primaryKey: true,
        allowNull: false,
      },
      frontendId: {
        type: DataTypes.STRING(20),
        field: "frontend_id",
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING(255),
        field: "title",
        allowNull: false,
      },
      titleSlug: {
        type: DataTypes.STRING(255),
        field: "title_slug",
        allowNull: true,
      },
      difficulty: {
        type: DataTypes.ENUM("Easy", "Medium", "Hard"),
        field: "difficulty",
        allowNull: false,
        defaultValue: "Medium",
      },
      description: {
        type: DataTypes.TEXT("long"),
        field: "description",
        allowNull: false,
      },
      topicTags: {
        type: DataTypes.JSON,
        field: "topic_tags",
        allowNull: true,
        defaultValue: [],
      },
      hints: {
        type: DataTypes.JSON,
        field: "hints",
        allowNull: true,
        defaultValue: [],
      },
      examples: {
        type: DataTypes.JSON,
        field: "examples",
        allowNull: true,
        defaultValue: [],
      },
      constraints: {
        type: DataTypes.TEXT,
        field: "constraints",
        allowNull: true,
      },
      codeSnippets: {
        type: DataTypes.JSON,
        field: "code_snippets",
        allowNull: true,
        defaultValue: [],
      },
      uploadedBy: {
        type: DataTypes.UUID,
        field: "uploaded_by",
        allowNull: true,
      },
    },
    {
      tableName: "questions",
      timestamps: true,
      underscored: true,
    }
  );
};
