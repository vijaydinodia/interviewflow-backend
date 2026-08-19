const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "SuperAdmin",
    {
      superadminId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        field: "superadmin_id",
        primaryKey: true,
        allowNull: false,
      },

      // Foreign Key pointing to the main User model
      userId: {
        type: DataTypes.UUID,
        field: "user_id",
        allowNull: false,
        unique: true, // Guarantees 1-to-1 relationship with User
        references: {
          model: "users",
          key: "user_id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      // Superadmin Hierarchy Level
      level: {
        type: DataTypes.ENUM("root", "operations", "support", "auditor"),
        field: "level",
        defaultValue: "operations",
        allowNull: false,
        comment: "'root' has absolute control; 'support' / 'auditor' have restricted views",
      },

      // Fine-grained permission flags (JSON object)
      permissions: {
        type: DataTypes.JSON,
        field: "permissions",
        allowNull: false,
        defaultValue: {
          manageCompanies: true,
          manageUsers: true,
          manageBilling: true,
          viewAuditLogs: true,
          systemConfig: true,
          manageSuperadmins: false, // Only 'root' level gets true
        },
        comment: "Granular access flags for specific platform modules",
      },

      // Security: Multi-Factor Authentication (MFA / 2FA)
      twoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        field: "two_factor_enabled",
        defaultValue: false,
      },

      twoFactorSecret: {
        type: DataTypes.STRING,
        field: "two_factor_secret",
        allowNull: true, // Stores TOTP secret string (encrypted)
      },

      // Security: Restricted IP Addresses
      ipWhitelist: {
        type: DataTypes.JSON, // e.g. ["192.168.1.1", "203.0.113.0/24"]
        field: "ip_whitelist",
        allowNull: true,
        comment: "Optional array of allowed IP addresses for high-security login",
      },

      // Administrative tracking
      createdById: {
        type: DataTypes.UUID,
        field: "created_by_id",
        allowNull: true,
        comment: "The userId of the root superadmin who created this superadmin record",
      },

      lastActiveAt: {
        type: DataTypes.DATE,
        field: "last_active_at",
        allowNull: true,
      },
    },
    {
      tableName: "super_admins",
      timestamps: true,
      paranoid: true, // Enables soft deletes (adds deletedAt)
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      deletedAt: "deletedAt",
    }
  );
};