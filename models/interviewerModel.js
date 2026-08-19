const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "Interviewer",
    {
      interviewerId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        field: "interviewer_id",
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
      companyId: {
        type: DataTypes.UUID,
        field: "company_id",
        allowNull: true,
        references: {
          model: "companies",
          key: "company_id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      title: {
        type: DataTypes.STRING(150),
        field: "title",
        allowNull: true,
      },
      department: {
        type: DataTypes.STRING(100),
        field: "department",
        allowNull: true,
      },
      specialization: {
        type: DataTypes.JSON,
        field: "specialization",
        allowNull: true,
        defaultValue: [],
      },
      availability: {
        type: DataTypes.JSON,
        field: "availability",
        allowNull: true,
        defaultValue: [],
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        field: "is_verified",
        defaultValue: false,
      },
    },
    {
      tableName: "interviewers",
      timestamps: true,
    }
  );
};
