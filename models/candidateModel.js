const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "Candidate",
    {
      candidateId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        field: "candidate_id",
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        field: "user_id",
        allowNull: false,
        unique: true,
        references: {
          model: "users",
          key: "user_id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      currentRole: {
        type: DataTypes.STRING(150),
        field: "current_role",
        allowNull: true,
      },
      yearsExperience: {
        type: DataTypes.STRING(50),
        field: "years_experience",
        allowNull: true,
      },
      preferredLocation: {
        type: DataTypes.STRING(255),
        field: "preferred_location",
        allowNull: true,
      },
      resumeUrl: {
        type: DataTypes.TEXT,
        field: "resume_url",
        allowNull: true,
      },
      skills: {
        type: DataTypes.JSON,
        field: "skills",
        allowNull: true,
        defaultValue: [],
      },
      applicationStatus: {
        type: DataTypes.ENUM("active", "interviewing", "hired", "rejected"),
        field: "application_status",
        defaultValue: "active",
      },
    },
    {
      tableName: "candidates",
      timestamps: true,
    }
  );
};
