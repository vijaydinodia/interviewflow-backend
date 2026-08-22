const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "User",
    {
      userId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        field: "user_id",
        primaryKey: true,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        field: "username",
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        field: "email",
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        field: "password_hash",
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        field: "first_name",
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING,
        field: "last_name",
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM("admin", "interviewer", "candidate" , "superAdmin"),
        field: "role",
        defaultValue: "candidate",
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        field: "is_active",
        defaultValue: true,
      },
      resetToken: {
        type: DataTypes.STRING,
        field: "reset_token",
        allowNull: true,
      },
      resetTokenExpires: {
        type: DataTypes.DATE,
        field: "reset_token_expires",
        allowNull: true,
      },
      otpCode: {
        type: DataTypes.STRING(6),
        field: "otp_code",
        allowNull: true,
      },
      otpExpires: {
        type: DataTypes.DATE,
        field: "otp_expires",
        allowNull: true,
      },
    },
    {
      tableName: "users",
      timestamps: true,
    },
  );
};
