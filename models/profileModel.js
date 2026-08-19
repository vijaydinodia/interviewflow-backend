const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "Profile",
    {
      profileId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        field: "profile_id",
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
      },
      headline: {
        type: DataTypes.STRING(255),
        field: "headline",
        allowNull: true,
      },
      company: {
        type: DataTypes.STRING(255),
        field: "company",
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING(255),
        field: "location",
        allowNull: true,
      },
      experience: {
        type: DataTypes.STRING(100),
        field: "experience",
        allowNull: true,
      },
      ctc: {
        type: DataTypes.STRING(100),
        field: "ctc",
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        field: "phone",
        allowNull: true,
      },
      noticePeriod: {
        type: DataTypes.STRING(100),
        field: "notice_period",
        allowNull: true,
      },
      avatarUrl: {
        type: DataTypes.TEXT,
        field: "avatar_url",
        allowNull: true,
      },
      skills: {
        type: DataTypes.JSON,
        field: "skills",
        allowNull: true,
        defaultValue: [],
      },
      education: {
        type: DataTypes.JSON,
        field: "education",
        allowNull: true,
        defaultValue: [],
        comment: "Array of { degree, institution, year }",
      },
      employment: {
        type: DataTypes.JSON,
        field: "employment",
        allowNull: true,
        defaultValue: [],
        comment: "Array of { title, company, duration, location }",
      },
      resumeFileName: {
        type: DataTypes.STRING(255),
        field: "resume_file_name",
        allowNull: true,
      },
      resumeUploadDate: {
        type: DataTypes.STRING(50),
        field: "resume_upload_date",
        allowNull: true,
      },
      profileUpdatedAt: {
        type: DataTypes.DATE,
        field: "profile_updated_at",
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "profiles",
      timestamps: true,
    }
  );
};
