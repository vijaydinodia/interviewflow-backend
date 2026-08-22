const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "InterviewRequest",
    {
      requestId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        field: "request_id",
        primaryKey: true,
        allowNull: false,
      },
      candidateUserId: {
        type: DataTypes.UUID,
        field: "candidate_user_id",
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
        onDelete: "CASCADE",
      },
      interviewerUserId: {
        type: DataTypes.UUID,
        field: "interviewer_user_id",
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
        onDelete: "CASCADE",
      },
      requestType: {
        type: DataTypes.ENUM("direct", "open"),
        field: "request_type",
        defaultValue: "direct",
      },
      roleRequirement: {
        type: DataTypes.STRING(150),
        field: "role_requirement",
        allowNull: false,
      },
      language: {
        type: DataTypes.STRING(50),
        field: "language",
        allowNull: true,
      },
      topicFocus: {
        type: DataTypes.JSON,
        field: "topic_focus",
        allowNull: true,
        defaultValue: [],
      },
      scheduledDate: {
        type: DataTypes.STRING(50),
        field: "scheduled_date",
        allowNull: true,
      },
      scheduledTime: {
        type: DataTypes.STRING(50),
        field: "scheduled_time",
        allowNull: true,
      },
      roomCode: {
        type: DataTypes.STRING(50),
        field: "room_code",
        allowNull: false,
      },
      candidateNotes: {
        type: DataTypes.TEXT,
        field: "candidate_notes",
        allowNull: true,
      },
      meetingLink: {
        type: DataTypes.STRING(255),
        field: "meeting_link",
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "accepted", "rejected", "completed"),
        field: "status",
        defaultValue: "pending",
      },
    },
    {
      tableName: "interview_requests",
      timestamps: true,
    }
  );
};
