const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "Company",
    {
      companyId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        field: "company_id",
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
      companyName: {
        type: DataTypes.STRING(255),
        field: "company_name",
        allowNull: false,
      },
      tagline: {
        type: DataTypes.STRING(255),
        field: "tagline",
        allowNull: true,
      },
      website: {
        type: DataTypes.STRING(255),
        field: "website",
        allowNull: true,
      },
      industry: {
        type: DataTypes.STRING(100),
        field: "industry",
        allowNull: true,
      },
      companySize: {
        type: DataTypes.STRING(100),
        field: "company_size",
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING(255),
        field: "location",
        allowNull: true,
      },
      contactPhone: {
        type: DataTypes.STRING(20),
        field: "contact_phone",
        allowNull: true,
      },
      contactEmail: {
        type: DataTypes.STRING(255),
        field: "contact_email",
        allowNull: true,
      },
      logoUrl: {
        type: DataTypes.TEXT,
        field: "logo_url",
        allowNull: true,
      },
      verificationDoc: {
        type: DataTypes.STRING(255),
        field: "verification_doc",
        allowNull: true,
      },
    },
    {
      tableName: "companies",
      timestamps: true,
    }
  );
};
