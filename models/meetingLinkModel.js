const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "MeetingLink",
    {
      linkId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "link_id",
      },
      link: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: "link",
      },
      isOccupied: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_occupied",
      },
      assignedRequestId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "assigned_request_id",
      },
      tag: {
        type: DataTypes.STRING(100),
        defaultValue: "available",
        field: "tag",
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 60,
        field: "duration_minutes",
      },
      occupiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "occupied_at",
      },
      releaseAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "release_at",
      },
    },
    {
      tableName: "meeting_links",
      timestamps: true,
    }
  );
};
