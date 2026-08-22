const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "Session",
    {
      sessionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        field: "session_id",
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        field: "user_id",
        allowNull: false,
      },
      userName: {
        type: DataTypes.STRING(255),
        field: "user_name",
        allowNull: true,
      },
      userEmail: {
        type: DataTypes.STRING(255),
        field: "user_email",
        allowNull: true,
      },
      userRole: {
        type: DataTypes.STRING(50),
        field: "user_role",
        allowNull: true,
        defaultValue: "candidate",
      },
      ipAddress: {
        type: DataTypes.STRING(100),
        field: "ip_address",
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        field: "user_agent",
        allowNull: true,
      },
      serverHostname: {
        type: DataTypes.STRING(255),
        field: "server_hostname",
        allowNull: true,
      },
      serverOs: {
        type: DataTypes.STRING(255),
        field: "server_os",
        allowNull: true,
      },
      loginTime: {
        type: DataTypes.DATE,
        field: "login_time",
        defaultValue: DataTypes.NOW,
      },
      lastActiveTime: {
        type: DataTypes.DATE,
        field: "last_active_time",
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM("active", "terminated"),
        field: "status",
        defaultValue: "active",
      },
    },
    {
      tableName: "sessions",
      timestamps: true,
    }
  );
};
