const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "BugReport",
    {
      bugId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        field: "bug_id",
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        field: "user_id",
        allowNull: true,
      },
      userName: {
        type: DataTypes.STRING,
        field: "user_name",
        allowNull: true,
      },
      userEmail: {
        type: DataTypes.STRING,
        field: "user_email",
        allowNull: true,
      },
      userRole: {
        type: DataTypes.STRING(50),
        field: "user_role",
        allowNull: true,
        defaultValue: "candidate",
      },
      title: {
        type: DataTypes.STRING(255),
        field: "title",
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        field: "description",
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(100),
        field: "category",
        allowNull: true,
        defaultValue: "General UI",
      },
      severity: {
        type: DataTypes.STRING(50),
        field: "severity",
        allowNull: true,
        defaultValue: "medium",
      },
      photoUrl: {
        type: DataTypes.TEXT,
        field: "photo_url",
        allowNull: true,
      },
      pageUrl: {
        type: DataTypes.STRING(255),
        field: "page_url",
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        field: "status",
        allowNull: false,
        defaultValue: "open", // 'open', 'in_progress', 'resolved', 'closed'
      },
    },
    {
      tableName: "bug_reports",
      timestamps: true,
      underscored: true,
    }
  );
};
